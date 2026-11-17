"use client";

import type { Errors, SellForm } from "./types";

/**
 * Keeps the finished form (including photo files) in memory while the seller signs in,
 * or after a failed post, so nothing is lost. Survives page changes inside the app,
 * not a full refresh.
 */
type Pending = { form: SellForm; errors?: Errors };
let pending: Pending | null = null;

export function setPendingPost(form: SellForm, errors?: Errors) {
  pending = { form, errors };
}

export function takePendingPost(): Pending | null {
  const p = pending;
  pending = null;
  return p;
}

/** Thrown when posting fails. `errors` uses the wizard's field names; `step` is where to send the seller. */
export class PostError extends Error {
  constructor(
    message: string,
    public errors: Errors = {},
    public step: number | null = null,
    /** The seller has to confirm their email before posting. */
    public needsEmail = false,
  ) {
    super(message);
    this.name = "PostError";
  }
}

export type PostedAd = { id: string; status: string };

/* --------------------------- photo compression --------------------------- */

const MAX_SIDE = 1600;

/**
 * Shrink a photo before upload: at most 1600px on the longest side, as JPEG.
 * A 6MB phone photo usually becomes 250 to 400KB, which is much faster on mobile data.
 * If the browser can't read the file, the original is sent as it is.
 */
async function compress(file: File, quality = 0.82): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Keep the whole upload under ~4MB (Vercel's limit is 4.5MB), squeezing harder if needed. */
async function preparePhotos(files: File[]): Promise<File[]> {
  let quality = 0.82;
  let out = await Promise.all(files.map((f) => compress(f, quality)));
  while (out.reduce((sum, f) => sum + f.size, 0) > 4 * 1024 * 1024 && quality > 0.5) {
    quality -= 0.12;
    out = await Promise.all(files.map((f) => compress(f, quality)));
  }
  return out;
}

/* ------------------------------ errors ------------------------------ */

/** Turn Laravel's field names into the wizard's, and find the earliest step with a problem. */
function mapErrors(apiErrors: Record<string, string[]>): { errors: Errors; step: number | null } {
  const errors: Errors = {};
  let step: number | null = null;
  const at = (s: number) => {
    step = step === null ? s : Math.min(step, s);
  };

  for (const [key, messages] of Object.entries(apiErrors)) {
    const message = messages[0];
    if (!message) continue;

    if (key.startsWith("specs.")) {
      errors[`spec_${key.slice(6)}`] = message;
      at(2);
    } else if (key === "photos" || key.startsWith("photos.") || key === "order" || key.startsWith("order.")) {
      errors.photos = message;
      at(1);
    } else if (key.startsWith("delivery")) {
      errors.delivery = message;
      at(3);
    } else if (key === "category") {
      errors.category = message;
      at(0);
    } else if (["title", "condition", "description"].includes(key)) {
      errors[key] = message;
      at(2);
    } else if (["price", "quantity", "state", "city", "negotiable"].includes(key)) {
      errors[key] = message;
      at(3);
    } else {
      errors.form = message;
    }
  }

  return { errors, step };
}

/* ------------------------------ publish ------------------------------ */

/** The fields shared by posting and editing. */
function baseForm(form: SellForm): FormData {
  const data = new FormData();
  data.set("category", form.category);
  data.set("title", form.title.trim());
  data.set("description", form.description.trim());
  data.set("condition", form.condition);
  data.set("price", form.price);
  data.set("negotiable", form.negotiable ? "1" : "0");
  data.set("quantity", form.quantity || "1");
  data.set("state", form.state);
  data.set("city", form.city);
  if (form.delivery.meetup) data.append("delivery[]", "meetup");
  if (form.delivery.seller_delivery) data.append("delivery[]", "seller_delivery");
  for (const [key, value] of Object.entries(form.specs)) {
    if (value?.trim()) data.set(`specs[${key}]`, value.trim());
  }
  return data;
}

/** Turn the API's answer into a PostedAd, or a PostError the wizard can show. */
async function handle(res: Response, failMessage: string): Promise<PostedAd> {
  const body = await res.json().catch(() => ({}));

  if (res.status === 401) {
    throw new PostError("Your session has ended. Please sign in again.", {}, null);
  }
  if (res.status === 403 && body?.code === "email_unverified") {
    throw new PostError(body.message, {}, null, true);
  }
  if (res.status === 422 && body?.errors) {
    const { errors, step } = mapErrors(body.errors);
    throw new PostError("Please fix the highlighted details.", errors, step);
  }
  if (res.status === 429) {
    throw new PostError("You've made a lot of changes in a short time. Please wait a little and try again.");
  }
  if (!res.ok) {
    throw new PostError(body?.message ?? failMessage);
  }

  return { id: body.data.id, status: body.data.status };
}

/** Upload the photos and post the ad to the API (through our own /api/listings route). */
export async function publishListing(form: SellForm): Promise<PostedAd> {
  const data = baseForm(form);

  const photos = await preparePhotos(form.photos.map((p) => p.file).filter((f): f is File => f !== null));
  photos.forEach((file) => data.append("photos[]", file, file.name));

  let res: Response;
  try {
    res = await fetch("/api/listings", { method: "POST", body: data, headers: { Accept: "application/json" } });
  } catch {
    throw new PostError("No internet connection. Your ad is saved, so please try again.");
  }

  return handle(res, "We couldn't post your ad. Please try again.");
}

/**
 * Save changes to an existing ad. Photos already on the ad are kept by id; new ones are uploaded.
 * order[] tells the API the final order: "p12" = existing photo 12, "n0" = first new upload.
 */
export async function updateListing(id: string, form: SellForm): Promise<PostedAd> {
  const data = baseForm(form);

  const newFiles = form.photos.filter((p) => p.file !== null).map((p) => p.file as File);
  const prepared = await preparePhotos(newFiles);
  let n = 0;
  for (const p of form.photos) {
    if (p.existingId !== undefined) {
      data.append("order[]", `p${p.existingId}`);
    } else {
      data.append("order[]", `n${n}`);
      n++;
    }
  }
  prepared.forEach((file) => data.append("photos[]", file, file.name));

  let res: Response;
  try {
    res = await fetch(`/api/me/listings/${id}`, { method: "POST", body: data, headers: { Accept: "application/json" } });
  } catch {
    throw new PostError("No internet connection. Please try again.");
  }

  return handle(res, "We couldn't save your changes. Please try again.");
}
