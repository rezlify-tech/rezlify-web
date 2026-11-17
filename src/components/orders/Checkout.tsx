"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "@/components/ui/Badge";
import { formatNaira } from "@/lib/format";
import { listingHref } from "@/lib/listing-url";
import { OrderError, deliveryLabels, placeOrder, type DeliveryMethod } from "@/lib/orders";
import type { ListingDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

const deliveryHints: Record<DeliveryMethod, string> = {
  meetup: "Check the item, then give the seller your release code.",
  seller_delivery: "The seller sends it. Confirm in the app when it arrives.",
};

const steps = [
  { title: "You pay Rezlify", body: "Transfer to a one-time account. The seller doesn't get it yet." },
  { title: "You get the item", body: "Meet up or receive delivery, and check it properly." },
  { title: "Seller gets paid", body: "Only when you confirm. Report a problem and we hold the money." },
];

export function Checkout({ listing }: { listing: ListingDetail }) {
  const router = useRouter();
  const options = listing.deliveryOptions.length ? listing.deliveryOptions : (["meetup"] as DeliveryMethod[]);
  const [delivery, setDelivery] = useState<DeliveryMethod>(options[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const order = await placeOrder({ listingId: listing.id, delivery, note });
      router.push(`/orders/${order.id}`);
    } catch (e) {
      if (e instanceof OrderError && e.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/checkout/${listing.id}`)}`);
        return;
      }
      if (e instanceof OrderError && e.code === "email_unverified") {
        router.push(`/verify-email?next=${encodeURIComponent(`/checkout/${listing.id}`)}`);
        return;
      }
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const photo = listing.photos[0]?.url ?? listing.photo?.url ?? null;

  return (
    <div className="mx-auto max-w-4xl pb-24 sm:pb-0">
      <Link href={listingHref(listing)} className="text-sm font-semibold text-muted hover:text-ink">
        ← Back to item
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">Buy now</h1>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Item */}
          <section className="flex gap-3 rounded-2xl border border-line bg-card p-3 sm:gap-4 sm:p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand sm:h-24 sm:w-24">
              {photo ? <Image src={photo} alt="" fill sizes="96px" className="object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[15px] font-semibold leading-snug">{listing.title}</p>
              <p className="mt-1 text-lg font-extrabold">{formatNaira(listing.price)}</p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                {listing.seller.name}
                {listing.seller.isVerified ? <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand-500" /> : null}
                <span>· {listing.location.city}</span>
              </p>
            </div>
          </section>

          {/* Delivery */}
          <section className="rounded-2xl border border-line bg-card p-4">
            <h2 className="text-sm font-bold">How do you want to get it?</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {options.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDelivery(id)}
                  aria-pressed={delivery === id}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    delivery === id ? "border-ink bg-sand ring-1 ring-ink" : "border-line-strong hover:bg-paper",
                  )}
                >
                  <span className="block text-sm font-semibold">{deliveryLabels[id]}</span>
                  <span className="mt-0.5 block text-xs text-muted">{deliveryHints[id]}</span>
                </button>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-semibold text-ink-3">Note for the seller (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                rows={2}
                placeholder={delivery === "meetup" ? "e.g. I can meet at the mall on Saturday" : "e.g. Delivery address and best time"}
                className="mt-1.5 w-full resize-none rounded-xl border border-line-strong bg-card px-3 py-2.5 text-base outline-none focus:border-ink sm:text-sm"
              />
            </label>
          </section>

          {/* How it works */}
          <section className="rounded-2xl bg-sand p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold">
              <ShieldCheck className="h-4 w-4 text-brand-500" />
              Your money is protected
            </h2>
            <ol className="mt-3 space-y-3">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">{i + 1}</span>
                  <span className="text-sm leading-snug">
                    <span className="font-semibold">{s.title}</span>
                    <span className="block text-xs text-muted">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Summary: a side card on desktop, a sticky bar on phones */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="hidden rounded-2xl border border-line bg-card p-4 lg:block">
            <Totals price={listing.price} />
            {error ? <p className="mt-3 text-sm font-medium text-danger-600">{error}</p> : null}
            <PayButton busy={busy} price={listing.price} onClick={submit} className="mt-4" />
            <p className="mt-2 text-center text-xs text-muted">No fee for buyers.</p>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 lg:hidden">
        {error ? <p className="mb-2 text-sm font-medium text-danger-600">{error}</p> : null}
        <PayButton busy={busy} price={listing.price} onClick={submit} />
      </div>
    </div>
  );
}

function Totals({ price }: { price: number }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">Item</dt>
        <dd className="font-semibold">{formatNaira(price)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">Buyer fee</dt>
        <dd className="font-semibold">₦0</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-2 text-base">
        <dt className="font-bold">You pay</dt>
        <dd className="font-extrabold">{formatNaira(price)}</dd>
      </div>
    </dl>
  );
}

function PayButton({ busy, price, onClick, className }: { busy: boolean; price: number; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink px-5 text-[15px] font-bold text-white transition-colors hover:bg-ink-3 disabled:opacity-60",
        className,
      )}
    >
      {busy ? "Getting payment details…" : `Continue to pay ${formatNaira(price)}`}
    </button>
  );
}
