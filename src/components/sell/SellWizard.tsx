"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { categoryFields } from "@/lib/mock/category-fields";
import { ensureSession, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { StepCategory } from "./StepCategory";
import { StepDetails } from "./StepDetails";
import { StepPhotos } from "./StepPhotos";
import { StepPrice } from "./StepPrice";
import { StepReview } from "./StepReview";
import { PostError, publishListing, setPendingPost, takePendingPost, updateListing } from "./publish";
import { DESCRIPTION_MIN, emptyForm, type Errors, type SellForm } from "./types";

const STEPS = ["Category", "Photos", "Details", "Price", "Review"];
const DRAFT_KEY = "rezlify:sell-draft";

/** Which step a field error belongs to (used when a failed post comes back). */
function firstStepWithError(errors: Errors): number | null {
  const steps = Object.entries(errors)
    .filter(([, v]) => v)
    .map(([key]): number | null => {
      if (key === "category") return 0;
      if (key === "photos") return 1;
      if (key.startsWith("spec_") || ["title", "condition", "description"].includes(key)) return 2;
      if (["price", "quantity", "state", "city", "delivery"].includes(key)) return 3;
      return null;
    })
    .filter((s): s is number => s !== null);
  return steps.length ? Math.min(...steps) : null;
}

function validate(step: number, form: SellForm): Errors {
  const e: Errors = {};
  if (step === 0 && !form.category) e.category = "Pick a category to continue.";
  if (step === 1 && form.photos.length === 0) e.photos = "Add at least one photo. Listings with photos sell much faster.";
  if (step === 2) {
    if (form.title.trim().length < 5) e.title = "Give your item a clear title (at least 5 characters).";
    if (!form.condition) e.condition = "Choose the condition.";
    for (const f of categoryFields[form.category] ?? []) {
      if (f.required && !form.specs[f.key]?.trim()) e[`spec_${f.key}`] = `${f.label.replace(/\s*\(.*\)$/, "")} is required.`;
    }
    if (form.description.trim().length < DESCRIPTION_MIN) e.description = `Write at least ${DESCRIPTION_MIN} characters so buyers know what they're getting.`;
  }
  if (step === 3) {
    if (!form.price || Number(form.price) < 100) e.price = "Enter a price of at least ₦100.";
    if (!form.quantity || Number(form.quantity) < 1) e.quantity = "At least 1.";
    if (!form.state) e.state = "Choose your state.";
    if (!form.city) e.city = "Choose your city or area.";
    if (!form.delivery.meetup && !form.delivery.seller_delivery) e.delivery = "Pick at least one way to get the item to the buyer.";
  }
  return e;
}

/** Save everything except photos (files can't be stored), so a half-done ad survives a refresh. */
function saveDraft(form: SellForm) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, photos: [] }));
  } catch {
    /* storage unavailable */
  }
}

function loadDraft(): Partial<SellForm> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<SellForm>) : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** When editing an existing ad: its id and the form filled in from it. */
export type EditTarget = { id: string; initial: SellForm };

export function SellWizard({ edit }: { edit?: EditTarget } = {}) {
  const editing = Boolean(edit);
  // Editing opens on the summary, where each section has its own Edit link.
  const [step, setStep] = useState(edit ? 4 : 0);
  const [form, setForm] = useState<SellForm>(edit?.initial ?? emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [restored, setRestored] = useState(false);
  const [posting, setPosting] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const resumed = useSearchParams().get("resume") === "1";
  const user = useSession();
  const seller = { name: user?.name ?? "You", isVerified: user?.isVerified ?? false };

  // Restore once, after the page loads: a failed post (with its photos and errors) first, otherwise the saved draft.
  useEffect(() => {
    if (editing) return; // editing never mixes with a new-ad draft
    const failed = takePendingPost();
    if (failed) {
      const { form: saved, errors: savedErrors = {} } = failed;
      setForm(saved);
      setErrors(savedErrors);
      setStep(firstStepWithError(savedErrors) ?? STEPS.length - 1);
      return;
    }

    const draft = loadDraft();
    if (draft && (draft.category || draft.title)) {
      setForm((f) => ({ ...f, ...draft, photos: [] }));
      setRestored(true);
    }
  }, [editing]);

  // Autosave (new ads only).
  useEffect(() => {
    if (!posting && !editing) saveDraft(form);
  }, [form, posting, editing]);

  const set = <K extends keyof SellForm>(key: K, value: SellForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function goTo(next: number) {
    setStep(next);
    setErrors({});
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function next() {
    const e = validate(step, form);
    setErrors(e);
    if (Object.keys(e).length) return;
    goTo(Math.min(step + 1, STEPS.length - 1));
  }

  async function post() {
    for (let s = 0; s < STEPS.length - 1; s++) {
      const e = validate(s, form);
      if (Object.keys(e).length) {
        goTo(s);
        setErrors(e);
        return;
      }
    }

    if (edit) {
      setPosting(true);
      setErrors({});
      try {
        const ad = await updateListing(edit.id, form);
        router.push(`/account/ads?updated=${ad.id}`);
      } catch (err) {
        setPosting(false);
        const e = err instanceof PostError ? err : new PostError("We couldn't save your changes. Please try again.");
        if (e.step !== null) goTo(e.step);
        setErrors({ ...e.errors, form: e.errors.form ?? e.message });
      }
      return;
    }

    const current = await ensureSession();

    // Not signed in: keep the finished ad (photos too) and come back to post it after sign-in.
    if (!current) {
      setPendingPost(form);
      saveDraft(form);
      router.push(`/login?next=${encodeURIComponent("/sell/finish")}`);
      return;
    }

    setPosting(true);
    setErrors({});
    try {
      const ad = await publishListing(form);
      clearDraft();
      router.push(`/account/ads?posted=${ad.id}`);
    } catch (err) {
      setPosting(false);
      // Email not confirmed yet: keep the ad (with photos), confirm, then it posts by itself.
      if (err instanceof PostError && err.needsEmail) {
        setPendingPost(form);
        router.push(`/verify-email?next=${encodeURIComponent("/sell/finish")}`);
        return;
      }
      const e = err instanceof PostError ? err : new PostError("We couldn't post your ad. Please try again.");
      if (e.step !== null) goTo(e.step);
      setErrors({ ...e.errors, form: e.errors.form ?? e.message });
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold">
            Step {step + 1} of {STEPS.length} · <span className="text-muted">{STEPS[step]}</span>
          </p>
          <p className="text-xs text-subtle">{editing ? "Editing your ad" : restored ? "Draft restored · saving as you go" : "Saving as you go"}</p>
        </div>
        <ol className="mt-3 grid grid-cols-5 gap-1.5">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                aria-label={`Go to ${label}`}
                aria-current={i === step ? "step" : undefined}
                disabled={!editing && i > step}
                onClick={() => goTo(i)}
                className={cn("h-1.5 w-full rounded-full transition-colors", editing || i <= step ? "bg-ink" : "bg-line", (editing || i < step) && "hover:bg-ink-3")}
              />
              <span className={cn("mt-2 hidden text-xs sm:block", i === step ? "font-semibold text-ink" : "text-subtle")}>{label}</span>
            </li>
          ))}
        </ol>
      </div>

      {errors.form ? (
        <p role="alert" className="mb-6 rounded-2xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
          {errors.form}
        </p>
      ) : null}

      {resumed && form.photos.length === 0 ? (
        <p className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-ink-3">
          Your details were saved, but photos can&apos;t be kept after the page reloads. Please add them again in the
          Photos step.
        </p>
      ) : null}

      {/* Step */}
      <div key={step} className="animate-fade-up">
        {step === 0 ? (
          <StepCategory
            form={form}
            errors={errors}
            onPick={(rootSlug, subSlug) => {
              setForm((f) => ({
                ...f,
                rootCategory: rootSlug,
                category: subSlug,
                specs: subSlug === f.category ? f.specs : {},
              }));
              setErrors({});
            }}
          />
        ) : null}
        {step === 1 ? <StepPhotos photos={form.photos} errors={errors} onChange={(p) => set("photos", p)} /> : null}
        {step === 2 ? <StepDetails form={form} errors={errors} set={set} /> : null}
        {step === 3 ? <StepPrice form={form} errors={errors} set={set} isVerified={seller.isVerified} /> : null}
        {step === 4 ? <StepReview form={form} sellerName={seller.name} isVerified={seller.isVerified} onEdit={goTo} /> : null}
      </div>

      {/* Navigation: sticky at the bottom on phones */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-10 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-sm sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex items-center gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="inline-flex h-12 items-center justify-center rounded-[10px] border border-line-strong bg-card px-5 text-[15px] font-semibold transition-colors hover:bg-sand"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={isLast ? post : next}
            disabled={posting}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[10px] bg-ink px-6 text-[15px] font-semibold text-white transition-colors hover:bg-ink-3 disabled:opacity-60 sm:ml-auto sm:flex-none sm:px-10"
          >
            {posting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : null}
            {isLast ? (posting ? (editing ? "Saving" : "Posting") : editing ? "Save changes" : "Post ad") : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
