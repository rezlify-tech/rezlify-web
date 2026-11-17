"use client";

import { useState } from "react";
import { toggleSaved, useIsSaved } from "@/lib/saved";
import { cn } from "@/lib/utils";

/** Heart toggle on listing cards. Updates instantly and stays in sync with every other heart for the same ad. */
export function SaveButton({ listingId, initialSaved, className }: { listingId: string; initialSaved: boolean; className?: string }) {
  const saved = useIsSaved(listingId, initialSaved);
  const [pop, setPop] = useState(false);

  async function onClick(e: React.MouseEvent) {
    // The card itself is a link; the heart shouldn't open the ad.
    e.preventDefault();
    e.stopPropagation();
    if (!saved) {
      setPop(true);
      window.setTimeout(() => setPop(false), 300);
    }
    await toggleSaved(listingId, saved);
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save this item"}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-card/90 shadow-[var(--shadow-card)] backdrop-blur-sm transition-transform hover:scale-105 active:scale-95",
        pop && "scale-110",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className={cn("h-[19px] w-[19px] transition-colors", saved ? "text-danger-500" : "text-ink-3")}
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
      </svg>
    </button>
  );
}
