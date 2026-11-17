"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { formatNaira, timeAgo } from "@/lib/format";
import { OrderError, fetchMyOrders, statusFor, type Order } from "@/lib/orders";
import { useSessionStatus } from "@/lib/session";
import { cn } from "@/lib/utils";

type Tab = "buying" | "selling";

/** What needs you now, shown under the title so the list is scannable. */
function nextStep(o: Order): string | null {
  const selling = o.role === "selling";
  if (o.status === "pending_payment" && !selling) return "Pay to secure the item";
  if (o.status === "paid" && selling) return "Hand over the item";
  if (o.status === "handed_over" && !selling) return "Confirm or report a problem";
  if (o.status === "confirmed" && selling && o.payout?.status === "failed") return "Payout delayed";
  return null;
}

export function MyOrders() {
  const router = useRouter();
  const params = useSearchParams();
  const session = useSessionStatus();
  const tab: Tab = params.get("tab") === "selling" ? "selling" : "buying";

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchMyOrders(tab, p);
        setOrders((prev) => (p === 1 ? res.orders : [...prev, ...res.orders]));
        setPage(res.page);
        setLastPage(res.lastPage);
      } catch (e) {
        if (e instanceof OrderError && e.status === 401) {
          router.replace(`/login?next=${encodeURIComponent("/account/orders")}`);
          return;
        }
        setError(e instanceof Error ? e.message : "We couldn't load your orders.");
      } finally {
        setLoading(false);
      }
    },
    [tab, router],
  );

  useEffect(() => {
    if (session === "guest") router.replace(`/login?next=${encodeURIComponent("/account/orders")}`);
    if (session === "authenticated") void load(1);
  }, [session, load, router]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">Orders</h1>

      <div className="mt-4 inline-flex rounded-xl bg-sand p-1" role="tablist">
        {(["buying", "selling"] as Tab[]).map((t) => (
          <Link
            key={t}
            href={t === "selling" ? "/account/orders?tab=selling" : "/account/orders"}
            role="tab"
            aria-selected={tab === t}
            replace
            className={cn(
              "inline-flex h-9 items-center rounded-lg px-4 text-sm font-semibold transition-colors",
              tab === t ? "bg-card text-ink shadow-[var(--shadow-card)]" : "text-muted hover:text-ink",
            )}
          >
            {t === "buying" ? "Buying" : "Selling"}
          </Link>
        ))}
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-line bg-card p-5 text-center">
          <p className="text-sm text-muted">{error}</p>
          <button type="button" onClick={() => void load(1)} className="mt-3 h-10 rounded-[10px] bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-3">
            Try again
          </button>
        </div>
      ) : null}

      {!error && !loading && orders.length === 0 ? (
        <div className="mt-5 rounded-[20px] border border-dashed border-line-strong bg-card px-6 py-12 text-center">
          <p className="font-bold">No orders yet</p>
          <p className="mt-1 text-sm text-muted">
            {tab === "buying" ? "Items you buy with Buy now show up here." : "When someone buys from you with Buy now, it shows up here."}
          </p>
          {tab === "buying" ? (
            <Link href="/search?buy_now=1" className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-3">
              Browse Buy now items
            </Link>
          ) : null}
        </div>
      ) : null}

      <ul className="mt-5 space-y-3">
        {orders.map((o) => {
          const badge = statusFor(o);
          const step = nextStep(o);
          return (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="flex gap-3 rounded-2xl border border-line bg-card p-3 transition-colors hover:bg-paper sm:p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand sm:h-20 sm:w-20">
                  {o.listing.photoUrl ? <Image src={o.listing.photoUrl} alt="" fill sizes="80px" className="object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-semibold">{o.listing.title}</p>
                    <span className="shrink-0 text-sm font-extrabold">{formatNaira(o.itemAmount)}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone={badge.tone} className="text-[11px]">
                      {badge.label}
                    </Badge>
                    {step ? <span className="text-xs font-semibold text-ink">{step}</span> : null}
                  </div>
                  <p className="mt-1.5 truncate text-xs text-muted">
                    {o.reference} · {o.role === "selling" ? "to" : "from"} {o.otherUser.name} · {timeAgo(o.createdAt)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
        {loading
          ? Array.from({ length: orders.length ? 1 : 3 }, (_, i) => (
              <li key={`s${i}`} className="flex gap-3 rounded-2xl border border-line bg-card p-3 sm:p-4">
                <span className="skeleton h-16 w-16 shrink-0 rounded-xl sm:h-20 sm:w-20" />
                <span className="flex flex-1 flex-col gap-2 pt-1">
                  <span className="skeleton h-4 w-3/4 rounded" />
                  <span className="skeleton h-4 w-28 rounded" />
                </span>
              </li>
            ))
          : null}
      </ul>

      {!loading && page < lastPage ? (
        <div className="mt-4 text-center">
          <button type="button" onClick={() => void load(page + 1)} className="h-10 rounded-[10px] border border-line-strong px-4 text-sm font-semibold hover:bg-sand">
            Show more
          </button>
        </div>
      ) : null}
    </div>
  );
}
