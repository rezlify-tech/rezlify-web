"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Stars } from "@/components/reviews/Stars";
import { timeAgo } from "@/lib/format";
import { listingHref } from "@/lib/listing-url";
import { fetchSellerReviews, type Review, type ReviewSummary } from "@/lib/reviews";

const noop = () => () => {};

/** A seller's reviews: full screen on phones, a centred panel on bigger screens. */
export function ReviewsSheet({ sellerId, sellerName, onClose }: { sellerId: string; sellerName: string; onClose: () => void }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchSellerReviews(sellerId, p);
        setReviews((prev) => (p === 1 ? res.reviews : [...prev, ...res.reviews]));
        setSummary(res.summary);
        setPage(res.page);
        setLastPage(res.lastPage);
      } catch (e) {
        setError(e instanceof Error ? e.message : "We couldn't load reviews.");
      } finally {
        setLoading(false);
      }
    },
    [sellerId],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Reviews for ${sellerName}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[100dvh] w-full flex-col bg-card sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-[20px] sm:shadow-[var(--shadow-lift)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] sm:pt-3">
          <h2 className="truncate font-extrabold">Reviews for {sellerName}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4">
          {summary ? <Summary summary={summary} /> : null}

          {error ? <p className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p> : null}

          {summary && summary.count === 0 ? (
            <p className="mt-6 text-center text-sm text-muted">No reviews yet. Reviews come only from people who bought with Buy now.</p>
          ) : null}

          <ul className="mt-4 divide-y divide-line">
            {reviews.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <Stars value={r.rating} className="text-sm" />
                  <span className="text-xs text-subtle">{timeAgo(r.createdAt)}</span>
                </div>
                {r.comment ? <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{r.comment}</p> : null}
                <p className="mt-2 text-xs text-muted">
                  {r.reviewer.name} · Bought{" "}
                  {r.item ? (
                    <Link href={listingHref(r.item)} className="font-semibold text-ink-3 hover:underline">
                      {r.item.title}
                    </Link>
                  ) : (
                    "an item"
                  )}
                </p>
                {r.reply ? (
                  <div className="mt-3 rounded-xl bg-sand px-3 py-2.5 text-sm">
                    <p className="text-xs font-bold text-ink-3">Seller&apos;s reply</p>
                    <p className="mt-0.5 whitespace-pre-line text-ink-3">{r.reply}</p>
                  </div>
                ) : null}
              </li>
            ))}
            {loading ? (
              <li className="space-y-2 py-4">
                <span className="skeleton block h-4 w-24 rounded" />
                <span className="skeleton block h-4 w-3/4 rounded" />
              </li>
            ) : null}
          </ul>

          {!loading && page < lastPage ? (
            <button type="button" onClick={() => void load(page + 1)} className="mt-2 h-10 w-full rounded-[10px] border border-line-strong text-sm font-semibold hover:bg-sand">
              Show more
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Summary({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="flex items-center gap-5 rounded-2xl bg-sand p-4">
      <div className="text-center">
        <p className="text-4xl font-extrabold leading-none">{summary.count ? summary.average.toFixed(1) : "–"}</p>
        <Stars value={summary.average} className="mt-1.5 text-sm" />
        <p className="mt-1 text-xs text-muted">
          {summary.count} review{summary.count === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex-1 space-y-1">
        {(["5", "4", "3", "2", "1"] as const).map((s) => {
          const n = summary.stars[s] ?? 0;
          const pct = summary.count ? (n / summary.count) * 100 : 0;
          return (
            <div key={s} className="flex items-center gap-2 text-xs">
              <span className="w-2 text-muted">{s}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-6 text-right text-muted">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
