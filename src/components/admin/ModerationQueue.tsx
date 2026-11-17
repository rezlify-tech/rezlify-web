"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConditionBadge, ShieldCheck } from "@/components/ui/Badge";
import { formatNaira, memberSince, timeAgo } from "@/lib/format";
import { listingHref } from "@/lib/listing-url";
import type { ListingStatus, ListingSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

/* --------------------------------- types --------------------------------- */

type Queue = "pending" | "live" | "rejected" | "removed";

type RiskFlag = { code: string; label: string };
type Reason = { code: string; text: string };

type ModListing = Omit<ListingSummary, "seller"> & {
  status: ListingStatus;
  description: string;
  photos: { url: string; width: number | null; height: number | null }[];
  specs: Record<string, string>;
  riskFlags: RiskFlag[];
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  seller: ListingSummary["seller"] & {
    email: string;
    phone: string | null;
    memberSince: string | null;
    totalListings: number;
    rejectedListings: number;
    status: string;
  };
};

type Counts = Record<Queue, number>;

type HistoryEntry = { action: string; reason: string | null; moderator: string | null; at: string };

const queues: { id: Queue; label: string }[] = [
  { id: "pending", label: "Waiting" },
  { id: "live", label: "Live" },
  { id: "rejected", label: "Rejected" },
  { id: "removed", label: "Taken down" },
];

const SPEC_LABELS: Record<string, string> = {
  battery_health: "Battery health (%)",
  dual_sim: "Dual SIM",
  storage_type: "Storage type",
  screen_size: "Screen size",
  imei: "IMEI (private)",
};

const specLabel = (key: string) => SPEC_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");

/* ---------------------------------- api ---------------------------------- */

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new Error("No internet connection. Please try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const first = body?.errors ? (Object.values(body.errors as Record<string, string[]>)[0]?.[0] ?? null) : null;
    throw new Error(first ?? body?.message ?? "Something went wrong. Please try again.");
  }
  return body as T;
}

/* --------------------------------- pieces -------------------------------- */

function Flags({ flags }: { flags: RiskFlag[] }) {
  if (!flags.length) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-xs font-medium text-brand-700">
        <ShieldCheck className="h-3.5 w-3.5" /> No risk flags
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {flags.map((f) => (
        <li key={f.code} className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-ink-3">
          <svg viewBox="0 0 20 20" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" fill="currentColor" aria-hidden>
            <path d="M8.6 2.9a1.6 1.6 0 0 1 2.8 0l6.4 11.5A1.6 1.6 0 0 1 16.4 17H3.6a1.6 1.6 0 0 1-1.4-2.6L8.6 2.9ZM10 7a.9.9 0 0 0-.9.9v3.4a.9.9 0 1 0 1.8 0V7.9A.9.9 0 0 0 10 7Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
          </svg>
          {f.label}
        </li>
      ))}
    </ul>
  );
}

function ReasonPicker({
  reasons,
  verb,
  busy,
  onCancel,
  onConfirm,
}: {
  reasons: Reason[];
  verb: "Reject" | "Take down";
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reasonCode: string | null, note: string) => void;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const ready = code !== null || note.trim().length >= 5;

  return (
    <div className="mt-4 rounded-2xl border border-line-strong bg-paper p-4 animate-fade-up">
      <p className="text-sm font-bold">Why? The seller will see this.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {reasons.map((r) => (
          <label
            key={r.code}
            className={cn(
              "flex cursor-pointer gap-2.5 rounded-xl border bg-card p-3 text-xs leading-relaxed transition-colors",
              code === r.code ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/30",
            )}
          >
            <input
              type="radio"
              name="reason"
              className="mt-0.5 accent-[var(--color-ink)]"
              checked={code === r.code}
              onChange={() => setCode(r.code)}
            />
            <span className="text-ink-3">{r.text}</span>
          </label>
        ))}
      </div>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs font-semibold text-ink">Add a note (optional if you picked a reason)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="e.g. The photos show a different phone from the title."
          className="w-full rounded-[10px] border border-line-strong bg-card px-3 py-2 text-sm text-ink placeholder:text-subtle focus:border-ink/40 focus:outline-none focus:ring-4 focus:ring-ink/5"
        />
      </label>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-10 rounded-[10px] px-4 text-sm font-semibold text-muted hover:bg-sand hover:text-ink">
          Cancel
        </button>
        <button
          type="button"
          disabled={!ready || busy}
          onClick={() => onConfirm(code, note.trim())}
          className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-danger-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-danger-500 disabled:opacity-50"
        >
          {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : null}
          {verb}
        </button>
      </div>
    </div>
  );
}

function History({ id }: { id: string }) {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    call<{ data: HistoryEntry[] }>(`/api/admin/listings/${id}/history`)
      .then((r) => alive && setEntries(r.data))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [id]);

  if (error) return <p className="mt-3 text-xs text-danger-600">{error}</p>;
  if (!entries) return <p className="mt-3 text-xs text-muted">Loading history…</p>;
  if (!entries.length) return <p className="mt-3 text-xs text-muted">No moderation actions yet.</p>;

  return (
    <ol className="mt-3 space-y-2 border-l-2 border-line pl-4">
      {entries.map((e, i) => (
        <li key={i} className="text-xs leading-relaxed text-ink-3">
          <span className="font-bold capitalize text-ink">{e.action}</span> by {e.moderator ?? "someone"} · {timeAgo(e.at)}
          {e.reason ? <span className="block text-muted">{e.reason}</span> : null}
        </li>
      ))}
    </ol>
  );
}

function ListingReview({
  item,
  reasons,
  queue,
  onDone,
}: {
  item: ModListing;
  reasons: Reason[];
  queue: Queue;
  onDone: (id: string, message: string) => void;
}) {
  const [mode, setMode] = useState<"idle" | "reject" | "remove">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [photo, setPhoto] = useState(0);

  const specs = Object.entries(item.specs ?? {});
  const longText = item.description.length > 280;

  async function run(action: "approve" | "reject" | "remove", reasonCode?: string | null, note?: string) {
    setBusy(true);
    setError("");
    try {
      const res = await call<{ message: string }>(`/api/admin/listings/${item.id}/${action}`, {
        method: "POST",
        body: JSON.stringify(action === "approve" ? {} : { reason_code: reasonCode ?? undefined, reason: note || undefined }),
      });
      onDone(item.id, res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work.");
      setBusy(false);
    }
  }

  return (
    <li className={cn("rounded-[20px] border border-line bg-card p-4 shadow-[var(--shadow-card)] sm:p-5", busy && "opacity-70")}>
      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)_260px]">
        {/* Photos */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sand">
            {item.photos[photo] ? (
              <Image src={item.photos[photo].url} alt="" fill sizes="280px" className="object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-xs text-subtle">No photos</span>
            )}
          </div>
          {item.photos.length > 1 ? (
            <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
              {item.photos.map((p, i) => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => setPhoto(i)}
                  aria-label={`Photo ${i + 1}`}
                  className={cn("relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-2", i === photo ? "ring-ink" : "ring-transparent")}
                >
                  <Image src={p.url} alt="" fill sizes="48px" className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Ad */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <ConditionBadge condition={item.condition} className="text-[11px]" />
            <span>{item.category.name}</span>
            <span aria-hidden>·</span>
            <span>
              {item.location.city}, {item.location.state}
            </span>
            <span aria-hidden>·</span>
            <span>posted {timeAgo(item.createdAt)}</span>
          </div>
          <h2 className="mt-2 text-lg font-bold leading-snug">
            <Link href={listingHref(item)} target="_blank" className="hover:underline">
              {item.title}
            </Link>
          </h2>
          <p className="mt-1 text-xl font-extrabold">
            {formatNaira(item.price)} {item.isNegotiable ? <span className="text-sm font-medium text-subtle">Negotiable</span> : null}
          </p>

          <p className={cn("mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-3", !expanded && longText && "line-clamp-4")}>
            {item.description}
          </p>
          {longText ? (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-xs font-semibold text-ink underline-offset-2 hover:underline">
              {expanded ? "Show less" : "Read all"}
            </button>
          ) : null}

          {specs.length ? (
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
              {specs.map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="truncate text-subtle">{specLabel(k)}</dt>
                  <dd className="truncate font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {item.rejectionReason && queue !== "live" ? (
            <p className="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-xs text-danger-600">
              <span className="font-bold">Reason given: </span>
              {item.rejectionReason}
              {item.reviewedBy ? <span className="text-danger-600/80"> · by {item.reviewedBy}</span> : null}
            </p>
          ) : null}
        </div>

        {/* Risk + seller */}
        <div className="space-y-3">
          <Flags flags={item.riskFlags} />

          <div className="rounded-xl border border-line p-3 text-xs">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              {item.seller.name}
              {item.seller.isVerified ? (
                <span className="text-brand-500" title="Verified">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 truncate text-muted">{item.seller.email}</p>
            {item.seller.phone ? <p className="text-muted">{item.seller.phone}</p> : null}
            <dl className="mt-2 grid grid-cols-2 gap-1.5">
              <div className="rounded-lg bg-sand px-2 py-1.5">
                <dt className="text-subtle">Joined</dt>
                <dd className="font-semibold text-ink">{item.seller.memberSince ? memberSince(item.seller.memberSince).replace(/^Member since /, "") : "–"}</dd>
              </div>
              <div className="rounded-lg bg-sand px-2 py-1.5">
                <dt className="text-subtle">Ads</dt>
                <dd className="font-semibold text-ink">{item.seller.totalListings}</dd>
              </div>
              <div className={cn("rounded-lg px-2 py-1.5", item.seller.rejectedListings ? "bg-danger-50" : "bg-sand")}>
                <dt className="text-subtle">Rejected</dt>
                <dd className={cn("font-semibold", item.seller.rejectedListings ? "text-danger-600" : "text-ink")}>{item.seller.rejectedListings}</dd>
              </div>
              <div className="rounded-lg bg-sand px-2 py-1.5">
                <dt className="text-subtle">Rating</dt>
                <dd className="font-semibold text-ink">{item.seller.ratingCount ? `${item.seller.ratingAvg.toFixed(1)} (${item.seller.ratingCount})` : "New"}</dd>
              </div>
            </dl>
            {item.seller.status !== "active" ? (
              <p className="mt-2 font-bold capitalize text-danger-600">Account {item.seller.status}</p>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}

      {mode === "reject" || mode === "remove" ? (
        <ReasonPicker
          reasons={reasons}
          verb={mode === "reject" ? "Reject" : "Take down"}
          busy={busy}
          onCancel={() => setMode("idle")}
          onConfirm={(code, note) => run(mode, code, note)}
        />
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="text-xs font-semibold text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            {showHistory ? "Hide history" : "History"}
          </button>
          <div className="flex flex-wrap gap-2">
            {queue === "pending" ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setMode("reject")}
                  className="h-10 rounded-[10px] border border-line-strong px-4 text-sm font-semibold text-danger-600 transition-colors hover:bg-danger-50 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run("approve")}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-3 disabled:opacity-50"
                >
                  {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : null}
                  Approve
                </button>
              </>
            ) : null}
            {queue === "live" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setMode("remove")}
                className="h-10 rounded-[10px] border border-line-strong px-4 text-sm font-semibold text-danger-600 transition-colors hover:bg-danger-50 disabled:opacity-50"
              >
                Take down
              </button>
            ) : null}
            {queue === "rejected" || queue === "removed" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => run("approve")}
                className="h-10 rounded-[10px] border border-line-strong px-4 text-sm font-semibold transition-colors hover:bg-sand disabled:opacity-50"
              >
                {queue === "rejected" ? "Approve anyway" : "Restore"}
              </button>
            ) : null}
          </div>
        </div>
      )}

      {showHistory ? <History id={item.id} /> : null}
    </li>
  );
}

/* ---------------------------------- page ---------------------------------- */

export function ModerationQueue() {
  const [queue, setQueue] = useState<Queue>("pending");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<ModListing[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, live: 0, rejected: 0, removed: 0 });
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);

  const load = useCallback(
    async (nextPage = 1) => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ queue });
      if (flaggedOnly) params.set("flagged", "1");
      if (search) params.set("q", search);
      if (nextPage > 1) params.set("page", String(nextPage));
      try {
        const res = await call<{
          data: ModListing[];
          counts: Counts;
          reasons: Reason[];
          meta: { current_page: number; last_page: number };
        }>(`/api/admin/listings?${params}`);
        setItems((current) => (nextPage > 1 ? [...current, ...res.data.filter((d) => !current.some((c) => c.id === d.id))] : res.data));
        setCounts(res.counts);
        setReasons(res.reasons);
        setPage(res.meta.current_page);
        setLastPage(res.meta.last_page);
      } catch (e) {
        setError(e instanceof Error ? e.message : "We couldn't load the queue.");
      } finally {
        setLoading(false);
      }
    },
    [queue, flaggedOnly, search],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function handled(id: string, message: string) {
    setItems((current) => current.filter((i) => i.id !== id));
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3000);
    // Refresh the counts quietly.
    call<{ counts: Counts }>(`/api/admin/listings?queue=${queue}`)
      .then((r) => setCounts(r.counts))
      .catch(() => undefined);
  }

  return (
    <div className="mt-6">
      {/* Queues */}
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {queues.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={queue === t.id}
            onClick={() => setQueue(t.id)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
              queue === t.id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}{" "}
            <span
              className={cn(
                "ml-1 rounded-full px-1.5 py-0.5 text-xs font-bold",
                t.id === "pending" && counts.pending ? "bg-amber-500 text-ink" : "text-subtle",
              )}
            >
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form
          className="flex min-w-0 flex-1 gap-2 sm:max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q.trim());
          }}
        >
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (!e.target.value) setSearch("");
            }}
            placeholder="Search title, seller name or email"
            className="h-10 min-w-0 flex-1 rounded-[10px] border border-line-strong bg-card px-3 text-sm placeholder:text-subtle focus:border-ink/40 focus:outline-none focus:ring-4 focus:ring-ink/5"
          />
          <button type="submit" className="h-10 rounded-[10px] bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-3">
            Search
          </button>
        </form>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-3">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} className="h-4 w-4 accent-[var(--color-ink)]" />
          Flagged only
        </label>
      </div>

      {error ? (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
          {error}
          <button type="button" onClick={() => load(1)} className="font-semibold underline underline-offset-2">
            Try again
          </button>
        </div>
      ) : null}

      {loading && !items.length ? (
        <ul className="mt-5 space-y-4" aria-busy="true">
          {[0, 1].map((i) => (
            <li key={i} className="grid gap-5 rounded-[20px] border border-line bg-card p-5 lg:grid-cols-[280px_1fr_260px]">
              <span className="skeleton aspect-[4/3] rounded-xl" />
              <span className="space-y-2">
                <span className="skeleton block h-4 w-1/3 rounded" />
                <span className="skeleton block h-5 w-2/3 rounded" />
                <span className="skeleton block h-16 w-full rounded" />
              </span>
              <span className="skeleton h-32 rounded-xl" />
            </li>
          ))}
        </ul>
      ) : items.length ? (
        <>
          <ul className={cn("mt-5 space-y-4 transition-opacity", loading && "opacity-60")}>
            {items.map((item) => (
              <ListingReview key={item.id} item={item} reasons={reasons} queue={queue} onDone={handled} />
            ))}
          </ul>
          {page < lastPage ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => load(page + 1)}
                disabled={loading}
                className="h-11 rounded-[10px] border border-line-strong bg-card px-5 text-sm font-semibold hover:bg-sand disabled:opacity-60"
              >
                Load more
              </button>
            </div>
          ) : null}
        </>
      ) : !error ? (
        <div className="mt-5 flex flex-col items-center rounded-[20px] border border-dashed border-line-strong bg-card px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-brand-500">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <p className="mt-4 text-lg font-extrabold">{queue === "pending" ? "All caught up" : "Nothing here"}</p>
          <p className="mt-1 text-sm text-muted">
            {queue === "pending" ? "No ads are waiting for review." : "No ads match these filters."}
          </p>
        </div>
      ) : null}

      {/* Toast */}
      <div
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-all duration-300",
          toast ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        <p className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-lift)]">{toast || " "}</p>
      </div>
    </div>
  );
}
