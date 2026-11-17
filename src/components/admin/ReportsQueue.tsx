"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge, ShieldCheck } from "@/components/ui/Badge";
import { formatNaira, timeAgo } from "@/lib/format";
import { listingHref } from "@/lib/listing-url";
import { cn } from "@/lib/utils";

/* --------------------------------- types --------------------------------- */

type TargetType = "listing" | "user" | "message";
type Action = "dismiss" | "remove_listing" | "delete_message" | "suspend_user";

type Person = { id: string; name: string; status: string; isVerified: boolean };

type ContextMessage = {
  id: number;
  body: string | null;
  originalBody: string | null;
  image: { url: string } | null;
  deleted: boolean;
  senderId: string;
  isReported: boolean;
  createdAt: string;
};

type Target =
  | { title: string; slug: string; price: number; status: string; photoUrl: string | null; description: string; owner: Person | null }
  | (Person & { email: string; memberSince: string | null; listings: number })
  | { sender: Person | null; listing: { id: string; slug: string; title: string } | null; context: ContextMessage[] };

type Group = {
  type: TargetType;
  id: string;
  count: number;
  firstAt: string | null;
  lastAt: string | null;
  target: Target | null;
  reports: {
    id: number;
    reason: string;
    reasonLabel: string;
    details: string | null;
    reporter: string;
    status: string;
    handledBy: string | null;
    at: string;
  }[];
};

const typeLabel: Record<TargetType, string> = { listing: "Ad", user: "Person", message: "Chat message" };

const filters: { id: "all" | TargetType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "listing", label: "Ads" },
  { id: "user", label: "People" },
  { id: "message", label: "Messages" },
];

const actionsFor: Record<TargetType, { id: Action; label: string; danger?: boolean }[]> = {
  listing: [
    { id: "dismiss", label: "Nothing wrong" },
    { id: "remove_listing", label: "Take ad down", danger: true },
    { id: "suspend_user", label: "Suspend seller", danger: true },
  ],
  user: [
    { id: "dismiss", label: "Nothing wrong" },
    { id: "suspend_user", label: "Suspend account", danger: true },
  ],
  message: [
    { id: "dismiss", label: "Nothing wrong" },
    { id: "delete_message", label: "Delete message", danger: true },
    { id: "suspend_user", label: "Suspend sender", danger: true },
  ],
};

const confirmText: Record<Action, string> = {
  dismiss: "Close these reports. An ad hidden by reports goes live again.",
  remove_listing: "The ad is taken down. The seller sees your note in My ads.",
  delete_message: "The message is removed for both people.",
  suspend_user: "They're signed out everywhere, can't sign in, and their live ads are paused.",
};

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { Accept: "application/json", ...init?.headers }, cache: "no-store" });
  } catch {
    throw new Error("No internet connection. Please try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const first = Object.values((body?.errors ?? {}) as Record<string, string[]>)[0]?.[0];
    throw new Error(first ?? body?.message ?? "Something went wrong. Please try again.");
  }
  return body as T;
}

/* ------------------------------- the queue ------------------------------- */

export function ReportsQueue() {
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [type, setType] = useState<"all" | TargetType>("all");
  const [groups, setGroups] = useState<Group[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ status });
        if (type !== "all") params.set("type", type);
        if (p > 1) params.set("page", String(p));
        const body = await call<{ data: Group[]; counts: { open: number }; meta: { current_page: number; last_page: number } }>(
          `/api/admin/reports?${params}`,
        );
        setGroups((prev) => (p === 1 ? body.data : [...prev, ...body.data]));
        setOpenCount(body.counts.open);
        setPage(body.meta.current_page);
        setLastPage(body.meta.last_page);
      } catch (e) {
        setError(e instanceof Error ? e.message : "We couldn't load reports.");
      } finally {
        setLoading(false);
      }
    },
    [status, type],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  function handled(g: Group) {
    setGroups((prev) => prev.filter((x) => !(x.type === g.type && x.id === g.id)));
    setOpenCount((n) => Math.max(0, n - 1));
  }

  const pill = (active: boolean) =>
    cn(
      "h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors",
      active ? "bg-ink text-white" : "bg-card text-ink-3 ring-1 ring-line hover:text-ink",
    );

  return (
    <div className="mt-6 max-w-3xl">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setStatus("open")} className={pill(status === "open")}>
            Waiting{openCount ? ` · ${openCount}` : ""}
          </button>
          <button type="button" onClick={() => setStatus("closed")} className={pill(status === "closed")}>
            Handled
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setType(f.id)}
              className={cn("h-8 shrink-0 rounded-lg px-3 text-xs font-semibold", type === f.id ? "bg-sand text-ink ring-1 ring-ink" : "text-muted hover:text-ink")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p> : null}

      {!loading && !error && groups.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-line-strong bg-card px-5 py-12 text-center">
          <p className="font-bold">{status === "open" ? "No reports waiting" : "Nothing handled yet"}</p>
          <p className="mt-1 text-sm text-muted">{status === "open" ? "All clear." : "Decisions show up here."}</p>
        </div>
      ) : null}

      <ul className="mt-5 space-y-4">
        {groups.map((g) => (
          <li key={`${g.type}:${g.id}`}>
            <ReportCard group={g} closed={status === "closed"} onHandled={() => handled(g)} />
          </li>
        ))}
        {loading ? Array.from({ length: groups.length ? 1 : 3 }, (_, i) => <li key={`s${i}`} className="skeleton h-48 rounded-2xl" />) : null}
      </ul>

      {!loading && page < lastPage ? (
        <button type="button" onClick={() => void load(page + 1)} className="mt-4 h-10 w-full rounded-[10px] border border-line-strong text-sm font-semibold hover:bg-sand">
          Show more
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------- one target ------------------------------- */

function ReportCard({ group, closed, onHandled }: { group: Group; closed: boolean; onHandled: () => void }) {
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!action) return;
    setBusy(true);
    setError("");
    try {
      await call("/api/admin/reports/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: group.type, id: group.id, action, note: note.trim() }),
      });
      onHandled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  const outcome = group.reports[0];
  const chosen = actionsFor[group.type].find((a) => a.id === action);

  return (
    <article className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="dark">{typeLabel[group.type]}</Badge>
        <Badge tone={group.count >= 3 ? "danger" : "amber"}>
          {group.count} report{group.count === 1 ? "" : "s"}
        </Badge>
        {group.lastAt ? <span className="text-xs text-muted">latest {timeAgo(group.lastAt)}</span> : null}
        {closed && outcome ? (
          <span className="ml-auto text-xs font-semibold text-muted">
            {outcome.status === "dismissed" ? "Dismissed" : "Action taken"}
            {outcome.handledBy ? ` by ${outcome.handledBy}` : ""}
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        {group.target ? <TargetView type={group.type} id={group.id} target={group.target} /> : <p className="text-sm text-muted">This no longer exists.</p>}
      </div>

      <ul className="mt-4 space-y-2">
        {group.reports.map((r) => (
          <li key={r.id} className="rounded-xl bg-sand px-3 py-2.5 text-sm">
            <p className="font-semibold">{r.reasonLabel}</p>
            {r.details ? <p className="mt-0.5 whitespace-pre-line text-ink-3">{r.details}</p> : null}
            <p className="mt-1 text-xs text-muted">
              {r.reporter} · {timeAgo(r.at)}
            </p>
          </li>
        ))}
      </ul>

      {!closed ? (
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex flex-wrap gap-2">
            {actionsFor[group.type].map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAction(a.id)}
                aria-pressed={action === a.id}
                className={cn(
                  "h-10 rounded-[10px] border px-3.5 text-sm font-semibold transition-colors",
                  action === a.id
                    ? a.danger
                      ? "border-danger-600 bg-danger-50 text-danger-600"
                      : "border-ink bg-sand text-ink"
                    : "border-line-strong hover:bg-sand",
                )}
              >
                {a.label}
              </button>
            ))}
          </div>

          {action ? (
            <div className="mt-3">
              <p className="text-xs text-muted">{confirmText[action]}</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 1000))}
                rows={2}
                placeholder="Note for the record (required)"
                className="mt-2 w-full resize-none rounded-xl border border-line-strong bg-card px-3 py-2.5 text-base outline-none focus:border-ink sm:text-sm"
              />
              {error ? <p className="mt-1 text-sm font-medium text-danger-600">{error}</p> : null}
              <button
                type="button"
                disabled={busy || note.trim().length < 3}
                onClick={submit}
                className={cn(
                  "mt-2 inline-flex h-10 items-center rounded-[10px] px-4 text-sm font-semibold text-white disabled:opacity-50",
                  chosen?.danger ? "bg-danger-600 hover:bg-danger-500" : "bg-ink hover:bg-ink-3",
                )}
              >
                {busy ? "Saving…" : `Confirm: ${chosen?.label.toLowerCase()}`}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function PersonLine({ label, p }: { label: string; p: Person }) {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
      {label}:
      <Link href={`/u/${p.id}`} target="_blank" className="font-semibold text-ink hover:underline">
        {p.name}
      </Link>
      {p.isVerified ? <ShieldCheck className="h-3.5 w-3.5 text-brand-500" /> : null}
      {p.status !== "active" ? <Badge tone="danger" className="text-[10px]">{p.status}</Badge> : null}
    </p>
  );
}

function TargetView({ type, id, target }: { type: TargetType; id: string; target: Target }) {
  if (type === "listing" && "title" in target) {
    return (
      <div className="flex gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand">
          {target.photoUrl ? <Image src={target.photoUrl} alt="" fill sizes="80px" className="object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={listingHref({ slug: target.slug, id })} target="_blank" className="line-clamp-2 text-sm font-semibold hover:underline">
            {target.title}
          </Link>
          <p className="mt-0.5 text-sm font-extrabold">{formatNaira(target.price)}</p>
          <p className="mt-0.5 text-xs text-muted">Status: {target.status.replace("_", " ")}</p>
          {target.owner ? <PersonLine label="Seller" p={target.owner} /> : null}
          {target.description ? <p className="mt-1.5 line-clamp-3 text-xs text-ink-3">{target.description}</p> : null}
        </div>
      </div>
    );
  }

  if (type === "user" && "email" in target) {
    return (
      <div className="text-sm">
        <PersonLine label="Account" p={target} />
        <p className="mt-1 text-xs text-muted">
          {target.email} · {target.listings} ad{target.listings === 1 ? "" : "s"}
          {target.memberSince ? ` · joined ${timeAgo(target.memberSince)}` : ""}
        </p>
      </div>
    );
  }

  if (type === "message" && "context" in target) {
    return (
      <div>
        {target.sender ? <PersonLine label="Sent by" p={target.sender} /> : null}
        {target.listing ? <p className="mt-0.5 text-xs text-muted">About: {target.listing.title}</p> : null}
        <div className="mt-2 space-y-1.5 rounded-xl bg-paper p-3">
          {target.context.map((m) => {
            const fromSender = m.senderId === target.sender?.id;
            return (
              <div key={m.id} className={cn("flex", fromSender ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-1.5 text-sm",
                    m.isReported ? "bg-danger-50 text-danger-600 ring-2 ring-danger-500" : fromSender ? "bg-card ring-1 ring-line" : "bg-sand text-ink-3",
                  )}
                >
                  {m.image ? (
                    <a href={m.image.url} target="_blank" rel="noreferrer" className="block text-xs font-semibold underline">
                      Photo
                    </a>
                  ) : null}
                  {m.deleted ? <span className="italic">Deleted{m.originalBody ? `: ${m.originalBody}` : ""}</span> : m.body}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
