"use client";

import { useState } from "react";
import { ReviewsSheet } from "@/components/reviews/ReviewsSheet";

/** "See all 12 reviews": opens the full list. */
export function AllReviewsButton({ sellerId, sellerName, count }: { sellerId: string; sellerName: string; count: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-ink underline underline-offset-2 hover:text-ink-3">
        See all {count} review{count === 1 ? "" : "s"}
      </button>
      {open ? <ReviewsSheet sellerId={sellerId} sellerName={sellerName} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
