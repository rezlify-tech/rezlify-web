"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ListingCard, ListingGridSkeleton } from "@/components/listing/ListingCard";
import { toggleSaved, useSavedIds } from "@/lib/saved";
import { useSessionStatus } from "@/lib/session";
import type { ListingSummary } from "@/lib/types";

type SavedListing = ListingSummary & { available: boolean; savedAt: string | null };

export function SavedItems() {
  const router = useRouter();
  const session = useSessionStatus();
  const saved = useSavedIds();
  const [items, setItems] = useState<SavedListing[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/me/saved${p > 1 ? `?page=${p}` : ""}`, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent("/saved")}`);
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message ?? "We couldn't load your saved items.");
      setItems((prev) => (p === 1 ? body.data : [...prev, ...body.data]));
      setPage(body.meta.current_page);
      setLastPage(body.meta.last_page);
      setTotal(body.meta.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load your saved items.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (session === "guest") router.replace(`/login?next=${encodeURIComponent("/saved")}`);
    if (session === "authenticated") void load(1);
  }, [session, load, router]);

  // Un-hearting an item here removes it straight away.
  const shown = saved.ready ? items.filter((i) => saved.ids.has(i.id)) : items;
  const removed = items.length - shown.length;
  const available = shown.filter((i) => i.available);
  const gone = shown.filter((i) => !i.available);

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">Saved items</h1>
          {!loading || items.length ? (
            <p className="mt-1 text-sm text-muted">
              {Math.max(0, total - removed)} item{total - removed === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-line bg-card p-5 text-center">
          <p className="text-sm text-muted">{error}</p>
          <button type="button" onClick={() => void load(1)} className="mt-3 h-10 rounded-[10px] bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-3">
            Try again
          </button>
        </div>
      ) : null}

      {loading && !items.length ? (
        <div className="mt-5">
          <ListingGridSkeleton count={8} />
        </div>
      ) : null}

      {!loading && !error && shown.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-[20px] border border-dashed border-line-strong bg-card px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sand text-subtle">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
              <path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
            </svg>
          </span>
          <p className="mt-4 font-bold">Nothing saved yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted">Tap the heart on any ad to keep it here and compare later.</p>
          <Link href="/" className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-3">
            Browse ads
          </Link>
        </div>
      ) : null}

      {available.length ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {available.map((l, i) => (
            <ListingCard key={l.id} listing={l} priority={i < 4} />
          ))}
        </div>
      ) : null}

      {gone.length ? (
        <section className="mt-10">
          <h2 className="text-sm font-bold text-muted">No longer available</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {gone.map((l) => (
              <div key={l.id} className="relative">
                <div className="pointer-events-none opacity-50 grayscale">
                  <ListingCard listing={l} />
                </div>
                <span className="absolute left-4 top-4 rounded-md bg-ink px-2 py-0.5 text-[11px] font-bold text-white">Sold or paused</span>
                <RemoveButton id={l.id} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && page < lastPage ? (
        <div className="mt-6 text-center">
          <button type="button" onClick={() => void load(page + 1)} className="h-10 rounded-[10px] border border-line-strong px-4 text-sm font-semibold hover:bg-sand">
            Show more
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Unavailable items are greyed out (can't be clicked), so they get their own remove button. */
function RemoveButton({ id }: { id: string }) {
  return (
    <button
      type="button"
      onClick={() => void toggleSaved(id, true)}
      className="absolute right-4 top-4 z-10 h-8 rounded-full bg-card px-3 text-xs font-semibold shadow-[var(--shadow-card)] hover:bg-sand"
    >
      Remove
    </button>
  );
}
