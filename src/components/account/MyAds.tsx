"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConditionBadge, ShieldCheck } from "@/components/ui/Badge";
import { formatNaira, memberSince, timeAgo } from "@/lib/format";
import { listingHref } from "@/lib/listing-url";
import {
  deleteListing,
  fetchMyListings,
  setListingStatus,
  type MyCounts,
  type MyListing,
  type MyTab,
} from "@/lib/my-listings";
import { signOut, useSession, useSessionStatus } from "@/lib/session";
import type { ListingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const tabs: { id: MyTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Under review" },
  { id: "active", label: "Live" },
  { id: "paused", label: "Paused" },
  { id: "sold", label: "Sold" },
];

const EMPTY_COUNTS: MyCounts = { all: 0, pending: 0, active: 0, paused: 0, sold: 0 };

const statusStyle: Partial<Record<ListingStatus, { label: string; className: string }>> = {
  pending_review: { label: "Under review", className: "bg-amber-500/12 text-amber-600 ring-amber-500/30" },
  draft: { label: "Draft", className: "bg-sand text-muted ring-line" },
  active: { label: "Live", className: "bg-primary-soft text-brand-700 ring-brand-200" },
  paused: { label: "Paused", className: "bg-sand text-ink-3 ring-line-strong" },
  sold: { label: "Sold", className: "bg-sand text-muted ring-line" },
  rejected: { label: "Not approved", className: "bg-danger-50 text-danger-600 ring-danger-500/30" },
};

type Action = "sold" | "paused" | "active" | "delete";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const smallButton =
  "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-[10px] border border-line-strong px-3 text-xs font-semibold transition-colors hover:bg-sand disabled:opacity-50";

function AdRow({
  ad,
  highlight,
  busy,
  onAction,
}: {
  ad: MyListing;
  highlight: boolean;
  busy: boolean;
  onAction: (action: Action) => void;
}) {
  const status = statusStyle[ad.status] ?? { label: ad.status, className: "bg-sand text-muted ring-line" };

  return (
    <li
      className={cn(
        "rounded-2xl border bg-card p-3 transition-shadow sm:p-4",
        highlight ? "border-ink shadow-[var(--shadow-lift)] ring-1 ring-ink" : "border-line shadow-[var(--shadow-card)]",
        busy && "opacity-60",
      )}
    >
      <div className="flex gap-3 sm:gap-4">
        <Link
          href={listingHref(ad)}
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sand sm:h-28 sm:w-32"
          aria-label={`View ${ad.title}`}
        >
          {ad.photo ? (
            <Image src={ad.photo.url} alt="" fill sizes="128px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-subtle">No photo</span>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset", status.className)}>{status.label}</span>
            <ConditionBadge condition={ad.condition} className="text-[11px]" />
          </div>
          <Link href={listingHref(ad)} className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug hover:underline">
            {ad.title}
          </Link>
          <p className="mt-1 text-base font-extrabold">{formatNaira(ad.price)}</p>
          <p className="mt-auto pt-1 text-xs text-muted">
            {ad.location.city}, {ad.location.state} · posted {timeAgo(ad.createdAt)} · {ad.viewsCount} view
            {ad.viewsCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {ad.status === "rejected" && ad.rejectionReason ? (
        <p className="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-xs leading-relaxed text-danger-600">
          <span className="font-bold">Why: </span>
          {ad.rejectionReason}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
        {ad.status !== "sold" && ad.status !== "removed" ? (
          <Link
            href={`/account/ads/${ad.id}/edit`}
            className={cn(smallButton, ad.status === "rejected" && "border-ink bg-ink text-white hover:bg-ink-3", busy && "pointer-events-none opacity-50")}
          >
            {ad.status === "rejected" ? "Fix and resubmit" : "Edit"}
          </Link>
        ) : null}
        {ad.status === "active" ? (
          <>
            <button type="button" disabled={busy} onClick={() => onAction("paused")} className={smallButton}>
              Pause
            </button>
            <button type="button" disabled={busy} onClick={() => onAction("sold")} className={smallButton}>
              Mark sold
            </button>
          </>
        ) : null}
        {ad.status === "paused" ? (
          <>
            <button type="button" disabled={busy} onClick={() => onAction("active")} className={smallButton}>
              Reactivate
            </button>
            <button type="button" disabled={busy} onClick={() => onAction("sold")} className={smallButton}>
              Mark sold
            </button>
          </>
        ) : null}
        {ad.status === "sold" ? (
          <button type="button" disabled={busy} onClick={() => onAction("active")} className={smallButton}>
            Repost
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction("delete")}
          className="inline-flex h-9 items-center rounded-[10px] px-3 text-xs font-semibold text-danger-600 transition-colors hover:bg-danger-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

/** "Where did you sell it?" Helps us learn how fast things really sell on Rezlify. */
function SoldDialog({
  ad,
  onPick,
  onClose,
}: {
  ad: MyListing;
  onPick: (via: "rezlify" | "elsewhere") => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const option =
    "flex h-12 w-full items-center justify-center rounded-[10px] text-[15px] font-semibold transition-colors";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sold-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[20px] bg-card p-5 shadow-[var(--shadow-lift)] animate-fade-up"
      >
        <h2 id="sold-title" className="text-lg font-extrabold">
          Where did you sell it?
        </h2>
        <p className="mt-1 truncate text-sm text-muted">{ad.title}</p>
        <div className="mt-5 space-y-2">
          <button type="button" onClick={() => onPick("rezlify")} className={cn(option, "bg-ink text-white hover:bg-ink-3")}>
            On Rezlify
          </button>
          <button type="button" onClick={() => onPick("elsewhere")} className={cn(option, "border border-line-strong hover:bg-sand")}>
            Somewhere else
          </button>
          <button type="button" onClick={onClose} className={cn(option, "text-muted hover:text-ink")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <li className="flex gap-3 rounded-2xl border border-line bg-card p-3 sm:gap-4 sm:p-4">
      <span className="skeleton h-24 w-24 shrink-0 rounded-xl sm:h-28 sm:w-32" />
      <span className="flex flex-1 flex-col gap-2 pt-1">
        <span className="skeleton h-4 w-24 rounded" />
        <span className="skeleton h-4 w-3/4 rounded" />
        <span className="skeleton h-5 w-28 rounded" />
      </span>
    </li>
  );
}

export function MyAds() {
  const user = useSession();
  const status = useSessionStatus();
  const router = useRouter();
  const params = useSearchParams();
  const updatedId = params.get("updated");
  const postedId = params.get("posted") ?? updatedId;

  const [tab, setTab] = useState<MyTab>("all");
  const [ads, setAds] = useState<MyListing[]>([]);
  const [counts, setCounts] = useState<MyCounts>(EMPTY_COUNTS);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [posted, setPosted] = useState<MyListing | null>(null);
  const [soldTarget, setSoldTarget] = useState<MyListing | null>(null);

  // Signed-out visitors go to sign in, then come back here.
  useEffect(() => {
    if (status === "guest") router.replace(`/login?next=${encodeURIComponent("/account/ads")}`);
  }, [status, router]);

  const load = useCallback(
    async (which: MyTab) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchMyListings(which);
        setAds(res.ads);
        setCounts(res.counts);
        setPage(res.page);
        setLastPage(res.lastPage);
        if (postedId) {
          const found = res.ads.find((a) => a.id === postedId);
          if (found) setPosted(found);
        }
      } catch (err) {
        if (err instanceof Error && "status" in err && err.status === 401) {
          router.replace(`/login?next=${encodeURIComponent("/account/ads")}`);
          return;
        }
        setError(err instanceof Error ? err.message : "We couldn't load your ads.");
      } finally {
        setLoading(false);
      }
    },
    [postedId, router],
  );

  useEffect(() => {
    // Load from the API when the user or tab changes.
    if (user) void load(tab);
  }, [user, tab, load]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetchMyListings(tab, page + 1);
      setAds((current) => [...current, ...res.ads.filter((a) => !current.some((c) => c.id === a.id))]);
      setPage(res.page);
      setLastPage(res.lastPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't load more ads.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function act(ad: MyListing, action: Action, soldVia?: "rezlify" | "elsewhere") {
    if (action === "delete" && !window.confirm(`Delete "${ad.title}"? This can't be undone.`)) return;
    // Marking sold first asks where it sold (see SoldDialog).
    if (action === "sold" && !soldVia) {
      setSoldTarget(ad);
      return;
    }

    setBusyId(ad.id);
    setError("");
    try {
      if (action === "delete") await deleteListing(ad.id);
      else await setListingStatus(ad.id, action, soldVia);
      if (posted?.id === ad.id) setPosted(null);
      await load(tab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (!user) {
    return (
      <div className="flex justify-center py-24">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink border-r-transparent" aria-hidden />
      </div>
    );
  }

  const postedLive = posted?.status === "active";

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
      {/* Profile */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <section className="rounded-[20px] border border-line bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-lg font-bold text-white">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials(user.name)
              )}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold">{user.name}</h1>
              <p className="text-xs text-muted">{memberSince(user.createdAt)}</p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-sand px-2 py-2.5">
              <dt className="text-[11px] text-muted">Ads</dt>
              <dd className="mt-0.5 text-sm font-bold">{counts.all}</dd>
            </div>
            <div className="rounded-xl bg-sand px-2 py-2.5">
              <dt className="text-[11px] text-muted">Live</dt>
              <dd className="mt-0.5 text-sm font-bold">{counts.active}</dd>
            </div>
            <div className="rounded-xl bg-sand px-2 py-2.5">
              <dt className="text-[11px] text-muted">Sold</dt>
              <dd className="mt-0.5 text-sm font-bold">{counts.sold}</dd>
            </div>
          </dl>

          {user.isVerified ? (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2.5 text-xs text-brand-700">
              <ShieldCheck className="h-4 w-4" /> Verified seller
            </p>
          ) : (
            <div className="mt-4 rounded-xl border border-line bg-paper p-3.5">
              <p className="text-sm font-bold">Get the Verified badge</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">Unlock Buy now and safe payments on all your ads.</p>
              <Link href="/verify" className="mt-3 inline-flex h-9 items-center rounded-[10px] bg-ink px-3.5 text-xs font-semibold text-white hover:bg-ink-3">
                Get verified
              </Link>
            </div>
          )}

          <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
            <p className="truncate text-muted">{user.email}</p>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.replace("/");
              }}
              className="font-semibold text-danger-600 hover:underline"
            >
              Sign out
            </button>
          </div>
        </section>
      </aside>

      {/* Ads */}
      <div className="min-w-0">
        {posted ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-brand-200 bg-primary-soft p-4 animate-fade-up">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="font-bold text-brand-800">
                {updatedId ? (posted.status === "pending_review" ? "Changes sent for review" : "Changes saved") : postedLive ? "Your ad is live" : "Your ad has been submitted"}
              </p>
              <p className="mt-0.5 text-sm text-brand-700">
                &ldquo;{posted.title}&rdquo;{" "}
                {posted.status === "pending_review"
                  ? "is under review. It usually goes live within a few hours."
                  : updatedId
                    ? posted.status === "paused"
                      ? "is updated. It's still paused."
                      : "is updated and visible to buyers."
                    : "is now visible to buyers."}{" "}
                <Link href={listingHref(posted)} className="font-semibold underline underline-offset-2">
                  {postedLive ? "View ad" : "Preview"}
                </Link>
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold tracking-[-0.02em]">My ads</h2>
          <Link href="/sell" className="inline-flex h-10 items-center rounded-[10px] bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-3">
            Post an ad
          </Link>
        </div>

        <div className="no-scrollbar mt-4 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                tab === t.id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
              )}
            >
              {t.label} <span className="ml-1 text-xs font-medium text-subtle">{counts[t.id]}</span>
            </button>
          ))}
        </div>

        {error ? (
          <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
            {error}
            <button type="button" onClick={() => load(tab)} className="font-semibold underline underline-offset-2">
              Try again
            </button>
          </div>
        ) : null}

        {loading && !ads.length ? (
          <ul className="mt-5 space-y-3" aria-busy="true">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </ul>
        ) : ads.length ? (
          <>
            <ul className={cn("mt-5 space-y-3 transition-opacity", loading && "opacity-60")}>
              {ads.map((ad) => (
                <AdRow key={ad.id} ad={ad} highlight={ad.id === postedId} busy={busyId === ad.id} onAction={(a) => act(ad, a)} />
              ))}
            </ul>
            {page < lastPage ? (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-5 text-sm font-semibold transition-colors hover:bg-sand disabled:opacity-60"
                >
                  {loadingMore ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : null}
                  Load more
                </button>
              </div>
            ) : null}
          </>
        ) : !error ? (
          <div className="mt-5 flex flex-col items-center rounded-[20px] border border-dashed border-line-strong bg-card px-6 py-14 text-center">
            <p className="text-lg font-extrabold">{tab === "all" ? "You haven't posted any ads yet" : "Nothing here yet"}</p>
            <p className="mt-1 text-sm text-muted">Sell something you no longer use. It takes about 2 minutes.</p>
            <Link href="/sell" className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-3">
              Post an ad
            </Link>
          </div>
        ) : null}
      </div>
      {soldTarget ? (
        <SoldDialog
          ad={soldTarget}
          onClose={() => setSoldTarget(null)}
          onPick={(via) => {
            const ad = soldTarget;
            setSoldTarget(null);
            void act(ad, "sold", via);
          }}
        />
      ) : null}
    </div>
  );
}
