"use client";

import { useState } from "react";
import { ReviewsSheet } from "@/components/reviews/ReviewsSheet";

/** The rating box on the seller card. Tapping it opens their reviews. */
export function SellerRating({ sellerId, sellerName, avg, count }: { sellerId: string; sellerName: string; avg: number; count: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!count}
        className="w-full rounded-xl bg-sand px-2 py-2.5 text-center transition-colors enabled:hover:bg-line disabled:cursor-default"
      >
        <span className="block text-[11px] text-muted">Rating</span>
        <span className="mt-0.5 flex items-center justify-center gap-1 text-sm font-bold">
          {count ? (
            <>
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-amber-500" aria-hidden>
                <path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8L10 1.8Z" />
              </svg>
              {avg.toFixed(1)}
              <span className="font-semibold text-muted underline underline-offset-2">({count})</span>
            </>
          ) : (
            "New"
          )}
        </span>
      </button>
      {open ? <ReviewsSheet sellerId={sellerId} sellerName={sellerName} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
