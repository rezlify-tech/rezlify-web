"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FieldError, StepHeading } from "./Fields";
import { MAX_PHOTO_MB, MAX_PHOTOS, type Errors, type SellPhoto } from "./types";

type Props = {
  photos: SellPhoto[];
  errors: Errors;
  onChange: (photos: SellPhoto[]) => void;
};

const tips = ["Use daylight, near a window", "Show the front, back and sides", "Include any scratches or faults", "Show the box and accessories"];

export function StepPhotos({ photos, errors, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [warning, setWarning] = useState("");

  function addFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_PHOTOS - photos.length;
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const tooBig = files.filter((f) => f.size > MAX_PHOTO_MB * 1024 * 1024);
    const ok = files.filter((f) => f.size <= MAX_PHOTO_MB * 1024 * 1024).slice(0, Math.max(0, room));

    const notes: string[] = [];
    if (tooBig.length) notes.push(`${tooBig.length} photo(s) over ${MAX_PHOTO_MB}MB were skipped.`);
    if (files.length - tooBig.length > room) notes.push(`You can add up to ${MAX_PHOTOS} photos.`);
    setWarning(notes.join(" "));

    if (ok.length) {
      onChange([
        ...photos,
        ...ok.map((file) => ({ id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`, file, url: URL.createObjectURL(file) })),
      ]);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(id: string) {
    const photo = photos.find((p) => p.id === id);
    if (photo?.file) URL.revokeObjectURL(photo.url);
    onChange(photos.filter((p) => p.id !== id));
  }

  function makeCover(id: string) {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;
    onChange([photo, ...photos.filter((p) => p.id !== id)]);
  }

  return (
    <div>
      <StepHeading title="Add photos" hint={`Good photos sell faster. Add up to ${MAX_PHOTOS}; the first one is your cover.`} />

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-ink bg-sand" : "border-line-strong bg-card hover:border-ink/40 hover:bg-paper",
          photos.length >= MAX_PHOTOS && "pointer-events-none opacity-50",
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand text-ink">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
            <circle cx="12" cy="12.5" r="3.2" />
          </svg>
        </span>
        <span className="mt-3 text-[15px] font-semibold">Tap to add photos</span>
        <span className="mt-0.5 hidden text-sm text-muted sm:block">or drag and drop them here</span>
        <span className="mt-2 text-xs text-subtle">
          JPG or PNG, up to {MAX_PHOTO_MB}MB each · {photos.length}/{MAX_PHOTOS} added
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
      </label>

      {warning ? <p className="mt-2 text-xs font-medium text-amber-600">{warning}</p> : null}
      <FieldError message={errors.photos} />

      {photos.length ? (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((p, i) => (
            <li key={p.id} className="group relative overflow-hidden rounded-xl border border-line bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Photo ${i + 1}`} className="aspect-square w-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-2 top-2 rounded-md bg-ink/85 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Cover
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(p.id)}
                  className="absolute left-2 top-2 rounded-md bg-card/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink shadow-sm backdrop-blur-sm hover:bg-card"
                >
                  Make cover
                </button>
              )}
              <button
                type="button"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => remove(p.id)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 text-ink shadow-sm backdrop-blur-sm hover:bg-card"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="m4 4 8 8M12 4l-8 8" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 rounded-2xl bg-paper p-4">
        <p className="text-sm font-semibold">Photo tips</p>
        <ul className="mt-2 grid gap-1.5 text-sm text-muted sm:grid-cols-2">
          {tips.map((t) => (
            <li key={t}>· {t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
