"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Badge, ShieldCheck } from "@/components/ui/Badge";
import { formatNaira, timeAgo } from "@/lib/format";
import { listingHref } from "@/lib/listing-url";
import { cn } from "@/lib/utils";

/* --------------------------------- types --------------------------------- */

type Filter = "disputed" | "payout_failed" | "all";

type Person = { id: string; name: string; email: string; phone: string | null; isVerified: boolean };

type AdminOrder = {
  id: string;
  reference: string;
  status: string;
  listing: { id: string; slug: string; title: string; photoUrl: string | null };
  buyer: Person;
  seller: Person;
  quantity: number;
  itemAmount: number;
  feeAmount: number;
  sellerAmount: number;
  deliveryMethod: "meetup" | "seller_delivery";
  deliveryNote: string | null;
  dispute: {
    reason: string;
    reasonLabel: string;
    description: string;
    status: string;
    resolutionNote: string | null;
    openedAt: string;
    resolvedAt: string | null;
  } | null;
  payout: { status: string; failureReason: string | null; sentAt: string | null } | null;
  history: { from: string | null; to: string; note: string | null; by: string; at: string | null }[];
  paidAt: string | null;
  handedOverAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChatLine = {
  id: number;
  type: "text" | "image" | "offer" | "system";
  body: string | null;
  originalBody: string | null;
  image: { url: string } | null;
  call: { status: string } | null;
  order: { id: string } | null;
  deleted: boolean;
  senderId: string;
  createdAt: string;
};

const filters: { id: Filter; label: string }[] = [
  { id: "disputed", label: "Disputes" },
  { id: "payout_failed", label: "Payout problems" },
  { id: "all", label: "All orders" },
];

const statusLabel: Record<string, { label: string; tone: "neutral" | "amber" | "success" | "danger" | "dark" }> = {
  pending_payment: { label: "Awaiting payment", tone: "amber" },
  paid: { label: "Paid", tone: "dark" },
  handed_over: { label: "Handed over", tone: "dark" },
  confirmed: { label: "Confirmed", tone: "neutral" },
  released: { label: "Paid out", tone: "success" },
  disputed: { label: "Disputed", tone: "danger" },
  refunded: { label: "Refunded", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

const when = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/* ---------------------------------- api ---------------------------------- */

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

/* ------------------------------- the screen ------------------------------- */

export function OrderDisputes() {
  const [filter, setFilter] = useState<Filter>("disputed");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
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
        const params = new URLSearchParams({ status: filter });
        if (search) params.set("q", search);
        if (p > 1) params.set("page", String(p));
        const body = await call<{ data: AdminOrder[]; meta: { current_page: number; last_page: number } }>(`/api/admin/orders?${params}`);
        setOrders((prev) => (p === 1 ? body.data : [...prev, ...body.data]));
        setPage(body.meta.current_page);
        setLastPage(body.meta.last_page);
      } catch (e) {
        setError(e instanceof Error ? e.message : "We couldn't load orders.");
      } finally {
        setLoading(false);
      }
    },
    [filter, search],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  // A decision changes the row; drop it from the disputes list since it's no longer waiting.
  function onResolved(updated: AdminOrder) {
    setOrders((prev) =>
      filter === "disputed" && updated.status !== "disputed"
        ? prev.filter((o) => o.id !== updated.id)
        : prev.map((o) => (o.id === updated.id ? updated : o)),
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
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
            placeholder="Reference, name or email"
            className="h-10 w-full rounded-[10px] border border-line-strong bg-card px-3 text-base outline-none focus:border-ink sm:w-64 sm:text-sm"
          />
          <button type="submit" className="h-10 shrink-0 rounded-[10px] bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-3">
            Search
          </button>
        </form>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]">
        <div>
          {error ? <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p> : null}
          {!loading && !error && orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-strong bg-card px-5 py-10 text-center">
              <p className="font-bold">{filter === "disputed" ? "No open disputes" : filter === "payout_failed" ? "No failed payouts" : "No orders"}</p>
              <p className="mt-1 text-sm text-muted">Nothing needs you here right now.</p>
            </div>
          ) : null}

          <ul className="space-y-2">
            {orders.map((o) => {
              const s = statusLabel[o.status] ?? { label: o.status, tone: "neutral" as const };
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(o.id)}
                    className={cn(
                      "flex w-full gap-3 rounded-2xl border bg-card p-3 text-left transition-colors hover:bg-paper",
                      selectedId === o.id ? "border-ink ring-1 ring-ink" : "border-line",
                    )}
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                      {o.listing.photoUrl ? <Image src={o.listing.photoUrl} alt="" fill sizes="56px" className="object-cover" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{o.listing.title}</span>
                        <span className="shrink-0 text-sm font-extrabold">{formatNaira(o.itemAmount)}</span>
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge tone={s.tone} className="text-[11px]">
                          {s.label}
                        </Badge>
                        {o.dispute && o.status === "disputed" ? <span className="text-xs font-semibold text-ink">{o.dispute.reasonLabel}</span> : null}
                        {o.payout?.status === "failed" ? <span className="text-xs font-semibold text-danger-600">Payout failed</span> : null}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted">
                        {o.reference} · {o.buyer.name} → {o.seller.name} · {timeAgo(o.dispute?.openedAt ?? o.updatedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {loading
              ? Array.from({ length: orders.length ? 1 : 4 }, (_, i) => <li key={`s${i}`} className="skeleton h-20 rounded-2xl" />)
              : null}
          </ul>

          {!loading && page < lastPage ? (
            <button type="button" onClick={() => void load(page + 1)} className="mt-3 h-10 w-full rounded-[10px] border border-line-strong text-sm font-semibold hover:bg-sand">
              Show more
            </button>
          ) : null}
        </div>

        {/* Desktop: detail beside the list */}
        <div className="hidden lg:block">
          {selectedId && wide ? (
            <OrderDetail key={selectedId} id={selectedId} onResolved={onResolved} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-line-strong bg-card text-sm text-muted">
              Choose an order to review it
            </div>
          )}
        </div>
      </div>

      {/* Phones: detail opens full screen */}
      {selectedId && !wide ? (
        <MobileSheet onClose={() => setSelectedId(null)}>
          <OrderDetail key={selectedId} id={selectedId} onResolved={onResolved} />
        </MobileSheet>
      ) : null}
    </div>
  );
}

const noop = () => () => {};

/** Desktop layout (detail beside the list) from 1024px; phones and tablets get a full-screen sheet. */
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

  // Lock the page behind the sheet.
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
      <div className="flex shrink-0 items-center gap-2 border-b border-line bg-card px-2 pt-[env(safe-area-inset-top)]">
        <button type="button" onClick={onClose} className="h-12 px-3 text-sm font-semibold">
          ← Back
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-[max(env(safe-area-inset-bottom),1rem)]">{children}</div>
    </div>,
    document.body,
  );
}

/* ------------------------------- one order ------------------------------- */

function OrderDetail({ id, onResolved }: { id: string; onResolved: (o: AdminOrder) => void }) {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const body = await call<{ data: AdminOrder; chat: ChatLine[] }>(`/api/admin/orders/${id}`);
      setOrder(body.data);
      setChat(body.chat);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load this order.");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

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
  if (!order) return <div className="skeleton h-96 rounded-2xl" />;

  const s = statusLabel[order.status] ?? { label: order.status, tone: "neutral" as const };
  const open = order.status === "disputed" && order.dispute && ["open", "under_review"].includes(order.dispute.status);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-extrabold">Order {order.reference}</h2>
          <Badge tone={s.tone}>{s.label}</Badge>
        </div>
        <Link href={listingHref(order.listing)} target="_blank" className="mt-3 flex items-center gap-3 rounded-xl bg-sand p-2.5 hover:bg-line">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-card">
            {order.listing.photoUrl ? <Image src={order.listing.photoUrl} alt="" fill sizes="48px" className="object-cover" /> : null}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{order.listing.title}</span>
        </Link>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <Money label="Buyer paid" value={order.itemAmount} />
          <Money label="Rezlify fee" value={order.feeAmount} />
          <Money label="Seller gets" value={order.sellerAmount} />
        </dl>
        <p className="mt-3 text-xs text-muted">
          {order.deliveryMethod === "meetup" ? "Meet in person" : "Seller delivers"}
          {order.deliveryNote ? ` · "${order.deliveryNote}"` : ""}
        </p>
        {order.payout ? (
          <p className={cn("mt-2 text-xs font-semibold", order.payout.status === "failed" ? "text-danger-600" : "text-ink-3")}>
            Payout: {order.payout.status}
            {order.payout.failureReason ? ` · ${order.payout.failureReason}` : ""}
          </p>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <PersonCard role="Buyer" p={order.buyer} />
        <PersonCard role="Seller" p={order.seller} />
      </div>

      {order.dispute ? (
        <section className="rounded-2xl border border-line bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-danger-600">Buyer&apos;s complaint</p>
          <p className="mt-1 font-bold">{order.dispute.reasonLabel}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-ink-3">{order.dispute.description}</p>
          <p className="mt-2 text-xs text-muted">Opened {when.format(new Date(order.dispute.openedAt))}</p>
          {order.dispute.resolutionNote ? (
            <p className="mt-3 rounded-xl bg-sand p-3 text-sm">
              <span className="font-semibold">Decision: </span>
              {order.dispute.resolutionNote}
            </p>
          ) : null}
        </section>
      ) : null}

      {open ? (
        <ResolveForm
          order={order}
          onDone={(updated) => {
            setOrder(updated);
            onResolved(updated);
          }}
        />
      ) : null}

      <ChatLog chat={chat} order={order} />

      <section className="rounded-2xl border border-line bg-card p-4">
        <h3 className="text-sm font-bold">History</h3>
        <ol className="mt-3 space-y-2.5">
          {order.history.map((h, i) => (
            <li key={i} className="text-sm">
              <span className="font-semibold">{statusLabel[h.to]?.label ?? h.to}</span>
              <span className="text-muted"> · {h.by}</span>
              {h.at ? <span className="text-xs text-subtle"> · {when.format(new Date(h.at))}</span> : null}
              {h.note ? <span className="block text-xs text-muted">{h.note}</span> : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Money({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-sand px-2 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-extrabold">{formatNaira(value)}</dd>
    </div>
  );
}

function PersonCard({ role, p }: { role: string; p: Person }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4 text-sm">
      <p className="text-xs font-semibold text-muted">{role}</p>
      <p className="mt-0.5 flex items-center gap-1 font-bold">
        {p.name}
        {p.isVerified ? <ShieldCheck className="h-4 w-4 text-brand-500" /> : null}
      </p>
      <a href={`mailto:${p.email}`} className="mt-1 block truncate text-ink-3 underline-offset-2 hover:underline">
        {p.email}
      </a>
      {p.phone ? (
        <a href={`tel:${p.phone}`} className="mt-0.5 block text-ink-3 underline-offset-2 hover:underline">
          {p.phone}
        </a>
      ) : null}
    </section>
  );
}

function ChatLog({ chat, order }: { chat: ChatLine[]; order: AdminOrder }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h3 className="text-sm font-bold">Chat between them</h3>
      {chat.length === 0 ? <p className="mt-2 text-sm text-muted">They haven&apos;t chatted.</p> : null}
      <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto rounded-xl bg-sand p-3">
        {chat.map((m) => {
          const fromSeller = m.senderId === order.seller.id;
          if (m.order || m.call || m.type === "system") {
            return (
              <p key={m.id} className="text-center text-[11px] text-muted">
                {m.body} · {when.format(new Date(m.createdAt))}
              </p>
            );
          }
          return (
            <div key={m.id} className={cn("flex", fromSeller ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", fromSeller ? "bg-ink text-white" : "bg-card text-ink ring-1 ring-line")}>
                <p className={cn("text-[10px] font-bold uppercase", fromSeller ? "text-white/60" : "text-subtle")}>
                  {fromSeller ? "Seller" : "Buyer"} · {when.format(new Date(m.createdAt))}
                </p>
                {m.image ? (
                  <a href={m.image.url} target="_blank" rel="noreferrer" className="mt-1 block">
                    <Image src={m.image.url} alt="Photo sent in chat" width={200} height={200} className="h-auto max-h-48 w-auto rounded-lg object-cover" />
                  </a>
                ) : null}
                {m.deleted ? (
                  <p className="mt-0.5 italic opacity-80">Deleted{m.originalBody ? `: ${m.originalBody}` : ""}</p>
                ) : m.body ? (
                  <p className="mt-0.5 whitespace-pre-line">{m.body}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ResolveForm({ order, onDone }: { order: AdminOrder; onDone: (o: AdminOrder) => void }) {
  const [outcome, setOutcome] = useState<"refund" | "release" | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ready = outcome !== null && note.trim().length >= 5;

  async function submit() {
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      const body = await call<{ data: AdminOrder }>(`/api/admin/orders/${order.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, note: note.trim() }),
      });
      onDone(body.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const option = (id: "refund" | "release", title: string, sub: string) => (
    <button
      type="button"
      onClick={() => setOutcome(id)}
      aria-pressed={outcome === id}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors",
        outcome === id ? "border-ink bg-sand ring-1 ring-ink" : "border-line-strong hover:bg-paper",
      )}
    >
      <span className="block text-sm font-bold">{title}</span>
      <span className="mt-0.5 block text-xs text-muted">{sub}</span>
    </button>
  );

  return (
    <section className="rounded-2xl border-2 border-ink bg-card p-4">
      <h3 className="font-extrabold">Decide</h3>
      <p className="mt-0.5 text-xs text-muted">Read the complaint and the chat first. Both people see your note.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {option("refund", "Refund the buyer", `${formatNaira(order.itemAmount)} back to ${order.buyer.name}. Ad goes live again.`)}
        {option("release", "Pay the seller", `${formatNaira(order.sellerAmount)} to ${order.seller.name}.`)}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 1000))}
        rows={3}
        placeholder="Why? e.g. Photos show the screen was cracked on arrival."
        className="mt-3 w-full resize-none rounded-xl border border-line-strong bg-card px-3 py-2.5 text-base outline-none focus:border-ink sm:text-sm"
      />
      {error ? <p className="mt-2 text-sm font-medium text-danger-600">{error}</p> : null}
      <button
        type="button"
        disabled={!ready || busy}
        onClick={submit}
        className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-ink text-sm font-semibold text-white hover:bg-ink-3 disabled:opacity-50"
      >
        {busy ? "Sending money…" : outcome === "refund" ? "Refund buyer" : outcome === "release" ? "Pay seller" : "Choose an outcome"}
      </button>
      <p className="mt-2 text-center text-[11px] text-subtle">Money moves straight away. This can&apos;t be undone.</p>
    </section>
  );
}
