"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Photo } from "@/lib/types";
import { cn } from "@/lib/utils";

function Placeholder({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-sand text-line-strong">
      <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <circle cx="9" cy="10" r="1.75" />
        <path d="m21 16-5-5-9 8" strokeLinejoin="round" />
      </svg>
      <span className="text-xs font-medium text-subtle">
        Photo {index + 1} of {total}
      </span>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === "left" ? "m12 4.5-5.5 5.5 5.5 5.5" : "m8 4.5 5.5 5.5L8 15.5"} />
    </svg>
  );
}

/** Swipe on phones, arrows and thumbnails on desktop. */
export function Gallery({ photos, title }: { photos: Photo[]; title: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const total = Math.max(1, photos.length);

  function goTo(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(total - 1, i));
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <div>
      <div className="group relative overflow-hidden rounded-[20px] border border-line bg-card">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto"
          aria-roledescription="carousel"
          aria-label={`Photos of ${title}`}
        >
          {Array.from({ length: total }, (_, i) => {
            const photo = photos[i];
            return (
              <div key={i} className="relative h-full w-full shrink-0 snap-center" aria-roledescription="slide" aria-label={`Photo ${i + 1} of ${total}`}>
                {photo?.url ? (
                  <Image
                    src={photo.url}
                    alt={i === 0 ? title : ""}
                    fill
                    priority={i === 0}
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-contain"
                  />
                ) : (
                  <Placeholder index={i} total={total} />
                )}
              </div>
            );
          })}
        </div>

        {/* Counter */}
        <span className="absolute bottom-3 right-3 rounded-md bg-ink/75 px-2 py-0.5 text-xs font-semibold tabular-nums text-white backdrop-blur-sm">
          {index + 1} / {total}
        </span>

        {/* Desktop arrows */}
        {total > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-ink opacity-0 shadow-[var(--shadow-card)] backdrop-blur-sm transition-opacity hover:bg-card disabled:pointer-events-none disabled:opacity-0 group-hover:opacity-100 sm:flex"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => goTo(index + 1)}
              disabled={index === total - 1}
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-ink opacity-0 shadow-[var(--shadow-card)] backdrop-blur-sm transition-opacity hover:bg-card disabled:pointer-events-none disabled:opacity-0 group-hover:opacity-100 sm:flex"
            >
              <Chevron dir="right" />
            </button>
          </>
        ) : null}
      </div>

      {/* Thumbnails */}
      {total > 1 ? (
        <div className="no-scrollbar mt-3 hidden gap-2 overflow-x-auto sm:flex">
          {Array.from({ length: total }, (_, i) => {
            const photo = photos[i];
            return (
              <button
                key={i}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={index === i}
                onClick={() => goTo(i)}
                className={cn(
                  "relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-sand transition-colors",
                  index === i ? "border-ink" : "border-transparent hover:border-line-strong",
                )}
              >
                {photo?.url ? (
                  <Image src={photo.url} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-subtle">{i + 1}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
