"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const PATH = "M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8L10 1.8Z";

/** Read-only stars, e.g. 4.3 shows four full and one partly filled. */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <svg key={n} viewBox="0 0 20 20" className="h-[1em] w-[1em]" aria-hidden>
            <path d={PATH} className="fill-line-strong" />
            <path d={PATH} className="fill-amber-500" style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }} />
          </svg>
        );
      })}
    </span>
  );
}

const words = ["", "Bad", "Poor", "Okay", "Good", "Excellent"];

/** Tap to choose 1–5 stars. Big targets for thumbs. */
export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="flex h-11 w-11 items-center justify-center rounded-lg transition-transform active:scale-90"
          >
            <svg viewBox="0 0 20 20" className="h-8 w-8" aria-hidden>
              <path d={PATH} className={n <= shown ? "fill-amber-500" : "fill-line-strong"} />
            </svg>
          </button>
        ))}
      </div>
      <p className="mt-1 h-4 text-xs font-semibold text-muted">{words[shown]}</p>
    </div>
  );
}
