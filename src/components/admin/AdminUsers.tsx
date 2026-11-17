"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChatAvatar } from "@/components/chat/ChatAvatar";
import { Badge, ShieldCheck } from "@/components/ui/Badge";
import { formatNaira, timeAgo } from "@/lib/format";
import { listingHref } from "@/lib/listing-url";
import { cn } from "@/lib/utils";

/* --------------------------------- types --------------------------------- */

type Filter = "all" | "suspended" | "verified" | "unverified_email" | "staff";
type Role = "user" | "moderator" | "admin";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  status: "active" | "suspended" | "banned";
  isVerified: boolean;
  emailVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  liveAds: number;
  purchases: number;
  sales: number;
  lastSeenAt: string | null;
  createdAt: string | null;
  openReports?: number;
};

type Detail = Row & {
  bio: string | null;
  location: string | null;
  googleLinked: boolean;
  deleted: boolean;
  identity: { type: string; nameOnRecord: string | null; idLast4: string | null; verifiedAt: string | null } | null;
  bank: { bankName: string; accountName: string; last4: string } | null;
  ads: { id: string; slug: string; title: string; price: number; status: string; photoUrl: string | null; createdAt: string }[];
  orders: { id: string; reference: string; role: "buying" | "selling"; status: string; amount: number; title: string | null; createdAt: string }[];
  reports: { reason: string; details: string | null; status: string; by: string | null; at: string }[];
  history: { action: string; reason: string | null; by: string; at: string }[];
};

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "suspended", label: "Suspended" },
  { id: "verified", label: "Verified sellers" },
  { id: "unverified_email", label: "Email not confirmed" },
  { id: "staff", label: "Staff" },
];

const actionLabel: Record<string, string> = {
  suspended: "Suspended",
  reinstated: "Reinstated",
  role_changed: "Role changed",
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

const post = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

/* ------------------------------ layout helpers ------------------------------ */

const noop = () => () => {};

function subscribeWide(cb: () => void) {
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function useWide() {
  return useSyncExternalStore(subscribeWide, () => window.matchMedia("(min-width: 1024px)").matches, () => true);
}

function MobileSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-paper">
      <div className="flex shrink-0 items-center border-b border-line bg-card px-2 pt-[env(safe-area-inset-top)]">
        <button type="button" onClick={onClose} className="h-12 px-3 text-sm font-semibold">
          ← Back
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-[max(env(safe-area-inset-bottom),1rem)]">{children}</div>
    </div>,
    document.body,
  );
}

function StatusBadges({ u }: { u: Row }) {
  return (
    <>
      {u.status !== "active" ? <Badge tone="danger" className="text-[11px]">{u.status === "banned" ? "Banned" : "Suspended"}</Badge> : null}
      {u.role !== "user" ? <Badge tone="dark" className="text-[11px]">{u.role === "admin" ? "Admin" : "Moderator"}</Badge> : null}
      {!u.emailVerified ? <Badge tone="amber" className="text-[11px]">Email not confirmed</Badge> : null}
    </>
  );
}

/* --------------------------------- the list -------------------------------- */

export function AdminUsers({ isAdmin }: { isAdmin: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const wide = useWide();

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ filter });
        if (search) params.set("q", search);
        if (p > 1) params.set("page", String(p));
        const body = await call<{ data: Row[]; meta: { current_page: number; last_page: number; total: number } }>(`/api/admin/users?${params}`);
        setUsers((prev) => (p === 1 ? body.data : [...prev, ...body.data]));
        setPage(body.meta.current_page);
        setLastPage(body.meta.last_page);
        setTotal(body.meta.total);
      } catch (e) {
        setError(e instanceof Error ? e.message : "We couldn't load users.");
      } finally {
        setLoading(false);
      }
    },
    [filter, search],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  // After a change in the detail panel, update that row in the list.
  function onChanged(d: Detail) {
    setUsers((prev) => prev.map((u) => (u.id === d.id ? { ...u, ...d } : u)));
  }

  const detail = selectedId ? <UserDetail key={selectedId} id={selectedId} isAdmin={isAdmin} onChanged={onChanged} /> : null;

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilter(f.id);
                setSelectedId(null);
              }}
              aria-pressed={filter === f.id}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors",
                filter === f.id ? "bg-ink text-white" : "bg-card text-ink-3 ring-1 ring-line hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(query.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, email or phone"
            className="h-10 w-full rounded-[10px] border border-line-strong bg-card px-3 text-base outline-none focus:border-ink sm:w-64 sm:text-sm"
          />
          <button type="submit" className="h-10 shrink-0 rounded-[10px] bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-3">
            Search
          </button>
        </form>
      </div>

      <p className="mt-3 text-xs text-muted">{loading && !users.length ? "Loading…" : `${total.toLocaleString("en-NG")} ${total === 1 ? "person" : "people"}`}</p>

      <div className="mt-3 grid gap-5 lg:grid-cols-[380px_1fr]">
        <div>
          {error ? <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p> : null}
          {!loading && !error && users.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-strong bg-card px-5 py-10 text-center text-sm text-muted">No one matches that.</div>
          ) : null}

          <ul className="space-y-2">
            {users.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(u.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-colors hover:bg-paper",
                    selectedId === u.id ? "border-ink ring-1 ring-ink" : "border-line",
                  )}
                >
                  <ChatAvatar name={u.name} url={u.avatarUrl} className={cn("h-11 w-11", u.status !== "active" && "opacity-50")} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1">
                      <span className="truncate text-sm font-semibold">{u.name}</span>
                      {u.isVerified ? <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand-500" /> : null}
                    </span>
                    <span className="block truncate text-xs text-muted">{u.email}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1">
                      <StatusBadges u={u} />
                      {u.openReports ? <Badge tone="danger" className="text-[11px]">{u.openReports} report{u.openReports === 1 ? "" : "s"}</Badge> : null}
                      <span className="text-[11px] text-subtle">
                        {u.liveAds} live ad{u.liveAds === 1 ? "" : "s"} · joined {u.createdAt ? timeAgo(u.createdAt) : "—"}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {loading ? Array.from({ length: users.length ? 1 : 5 }, (_, i) => <li key={`s${i}`} className="skeleton h-[74px] rounded-2xl" />) : null}
          </ul>

          {!loading && page < lastPage ? (
            <button type="button" onClick={() => void load(page + 1)} className="mt-3 h-10 w-full rounded-[10px] border border-line-strong text-sm font-semibold hover:bg-sand">
              Show more
            </button>
          ) : null}
        </div>

        <div className="hidden lg:block">
          {wide && detail ? (
            detail
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-line-strong bg-card text-sm text-muted">
              Choose someone to see their account
            </div>
          )}
        </div>
      </div>

      {detail && !wide ? <MobileSheet onClose={() => setSelectedId(null)}>{detail}</MobileSheet> : null}
    </div>
  );
}

/* -------------------------------- one person -------------------------------- */

function UserDetail({ id, isAdmin, onChanged }: { id: string; isAdmin: boolean; onChanged: (d: Detail) => void }) {
  const [u, setU] = useState<Detail | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setU((await call<{ data: Detail }>(`/api/admin/users/${id}`)).data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load this account.");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function updated(d: Detail) {
    setU(d);
    onChanged(d);
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-line bg-card p-5 text-center">
        <p className="text-sm text-muted">{error}</p>
        <button type="button" onClick={() => void load()} className="mt-3 h-10 rounded-[10px] bg-ink px-4 text-sm font-semibold text-white">
          Try again
        </button>
      </div>
    );
  }
  if (!u) return <div className="skeleton h-96 rounded-2xl" />;

  const fact = (label: string, value: ReactNode) => (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <ChatAvatar name={u.name} url={u.avatarUrl} className="h-16 w-16 text-lg" />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-lg font-extrabold">
              <span className="truncate">{u.name}</span>
              {u.isVerified ? <ShieldCheck className="h-4 w-4 shrink-0 text-brand-500" /> : null}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              <StatusBadges u={u} />
              {u.deleted ? <Badge className="text-[11px]">Closed account</Badge> : null}
            </div>
            {!u.deleted ? (
              <Link href={`/u/${u.id}`} target="_blank" className="mt-1.5 inline-block text-xs font-semibold text-ink underline underline-offset-2">
                Public profile
              </Link>
            ) : null}
          </div>
        </div>

        <dl className="mt-4 divide-y divide-line">
          {fact("Email", <a href={`mailto:${u.email}`} className="hover:underline">{u.email}</a>)}
          {fact("Phone", u.phone ? <a href={`tel:${u.phone}`} className="hover:underline">{u.phone}</a> : "—")}
          {fact("Location", u.location ?? "—")}
          {fact("Joined", u.createdAt ? timeAgo(u.createdAt) : "—")}
          {fact("Last seen", u.lastSeenAt ? timeAgo(u.lastSeenAt) : "Never")}
          {fact("Sign-in", u.googleLinked ? "Email + Google" : "Email")}
          {fact("Rating", u.ratingCount ? `${u.ratingAvg.toFixed(1)} (${u.ratingCount})` : "No reviews")}
          {fact("Activity", `${u.liveAds} live ads · ${u.sales} sold · ${u.purchases} bought`)}
        </dl>
        {u.bio ? <p className="mt-3 rounded-xl bg-sand px-3 py-2 text-sm text-ink-3">{u.bio}</p> : null}
      </section>

      {u.identity || u.bank ? (
        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <h3 className="text-sm font-bold">Verification</h3>
          <dl className="mt-2 divide-y divide-line">
            {u.identity ? fact(`${u.identity.type} name`, u.identity.nameOnRecord ?? "—") : null}
            {u.identity ? fact(`${u.identity.type}`, `•••• ${u.identity.idLast4 ?? ""}`) : null}
            {u.bank ? fact("Payout bank", `${u.bank.bankName} •••• ${u.bank.last4}`) : null}
            {u.bank ? fact("Account name", u.bank.accountName) : null}
          </dl>
        </section>
      ) : null}

      {!u.deleted ? <Actions u={u} isAdmin={isAdmin} onDone={updated} /> : null}

      {u.reports.length ? (
        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <h3 className="text-sm font-bold">Reports about them</h3>
          <ul className="mt-3 space-y-2">
            {u.reports.map((r, i) => (
              <li key={i} className="rounded-xl bg-sand px-3 py-2.5 text-sm">
                <p className="font-semibold">
                  {r.reason} <span className="font-normal text-muted">· {r.status}</span>
                </p>
                {r.details ? <p className="mt-0.5 text-ink-3">{r.details}</p> : null}
                <p className="mt-1 text-xs text-muted">
                  {r.by ?? "Someone"} · {timeAgo(r.at)}
                </p>
              </li>
            ))}
          </ul>
          <Link href="/admin/reports" className="mt-3 inline-block text-xs font-semibold text-ink underline underline-offset-2">
            Open the Reports queue
          </Link>
        </section>
      ) : null}

      {u.ads.length ? (
        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <h3 className="text-sm font-bold">Their ads</h3>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {u.ads.map((a) => (
              <li key={a.id}>
                <Link href={listingHref(a)} target="_blank" className="block rounded-xl border border-line p-2 hover:bg-paper">
                  <span className="relative block aspect-square overflow-hidden rounded-lg bg-sand">
                    {a.photoUrl ? <Image src={a.photoUrl} alt="" fill sizes="160px" className="object-cover" /> : null}
                  </span>
                  <span className="mt-1.5 block truncate text-xs font-semibold">{a.title}</span>
                  <span className="block text-xs text-muted">
                    {formatNaira(a.price)} · {a.status.replace("_", " ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {u.orders.length ? (
        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <h3 className="text-sm font-bold">Recent orders</h3>
          <ul className="mt-2 divide-y divide-line">
            {u.orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{o.title ?? o.reference}</span>
                  <span className="text-xs text-muted">
                    {o.reference} · {o.role} · {o.status.replace("_", " ")}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">{formatNaira(o.amount)}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/orders" className="mt-2 inline-block text-xs font-semibold text-ink underline underline-offset-2">
            Open Orders
          </Link>
        </section>
      ) : null}

      <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
        <h3 className="text-sm font-bold">Moderation history</h3>
        {u.history.length ? (
          <ol className="mt-3 space-y-2.5">
            {u.history.map((h, i) => (
              <li key={i} className="text-sm">
                <span className="font-semibold">{actionLabel[h.action] ?? h.action}</span>
                <span className="text-muted"> · {h.by} · {timeAgo(h.at)}</span>
                {h.reason ? <span className="block text-xs text-ink-3">{h.reason}</span> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted">Nothing yet.</p>
        )}
      </section>
    </div>
  );
}

/* --------------------------------- actions --------------------------------- */

function Actions({ u, isAdmin, onDone }: { u: Detail; isAdmin: boolean; onDone: (d: Detail) => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [restoreAds, setRestoreAds] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const suspended = u.status !== "active";

  async function submit() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await call<{ data: Detail; restoredAds?: number }>(
        `/api/admin/users/${u.id}/${suspended ? "reinstate" : "suspend"}`,
        post(suspended ? { note: note.trim(), restore_ads: restoreAds } : { note: note.trim() }),
      );
      onDone(res.data);
      setNotice(
        suspended
          ? `Reinstated.${res.restoredAds ? ` ${res.restoredAds} ad${res.restoredAds === 1 ? "" : "s"} live again.` : ""}`
          : "Suspended. They've been signed out and emailed.",
      );
      setOpen(false);
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(role: Role) {
    if (!window.confirm(`Make ${u.name} ${role === "user" ? "a normal user" : `a ${role}`}?`)) return;
    setError("");
    try {
      onDone((await call<{ data: Detail }>(`/api/admin/users/${u.id}/role`, post({ role }))).data);
      setNotice("Role updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work.");
    }
  }

  return (
    <section className={cn("rounded-2xl border bg-card p-4 sm:p-5", suspended ? "border-danger-500/30" : "border-line")}>
      <h3 className="text-sm font-bold">{suspended ? "This account is suspended" : "Account actions"}</h3>
      {suspended ? <p className="mt-1 text-sm text-muted">They can&apos;t sign in, and their ads were paused.</p> : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "mt-3 h-10 rounded-[10px] px-4 text-sm font-semibold",
            suspended ? "bg-ink text-white hover:bg-ink-3" : "border border-danger-500/40 text-danger-600 hover:bg-danger-50",
          )}
        >
          {suspended ? "Reinstate account" : "Suspend account"}
        </button>
      ) : (
        <div className="mt-3">
          <p className="text-xs text-muted">
            {suspended ? "They'll be able to sign in again and we'll email them." : "They're signed out everywhere, can't sign in, their live ads are paused, and they get an email with your note."}
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 1000))}
            rows={2}
            placeholder={suspended ? "Why (for the record)" : "Why (they see this)"}
            className="mt-2 w-full resize-none rounded-xl border border-line-strong bg-card px-3 py-2.5 text-base outline-none focus:border-ink sm:text-sm"
          />
          {suspended ? (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={restoreAds} onChange={(e) => setRestoreAds(e.target.checked)} className="h-4 w-4 accent-[var(--color-ink)]" />
              Put back the ads that the suspension paused
            </label>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || note.trim().length < 3}
              onClick={submit}
              className={cn(
                "h-10 rounded-[10px] px-4 text-sm font-semibold text-white disabled:opacity-50",
                suspended ? "bg-ink hover:bg-ink-3" : "bg-danger-600 hover:bg-danger-500",
              )}
            >
              {busy ? "Saving…" : suspended ? "Reinstate" : "Suspend"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="h-10 px-3 text-sm font-semibold text-muted hover:text-ink">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isAdmin && !suspended ? (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-xs font-semibold text-muted">Role</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(["user", "moderator", "admin"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                disabled={u.role === r}
                onClick={() => void changeRole(r)}
                className={cn(
                  "h-8 rounded-full px-3 text-xs font-semibold",
                  u.role === r ? "bg-ink text-white" : "bg-card text-ink-3 ring-1 ring-line hover:text-ink",
                )}
              >
                {r === "user" ? "User" : r === "moderator" ? "Moderator" : "Admin"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm font-medium text-danger-600">{error}</p> : null}
      {notice ? <p className="mt-3 text-sm font-medium text-ink">{notice}</p> : null}
    </section>
  );
}
