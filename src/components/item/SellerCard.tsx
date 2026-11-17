import Link from "next/link";
import { ChatAvatar } from "@/components/chat/ChatAvatar";
import { SellerRating } from "@/components/reviews/SellerRating";
import { ShieldCheck } from "@/components/ui/Badge";
import { memberSince } from "@/lib/format";
import type { ListingDetail } from "@/lib/types";
import { site } from "@/lib/site";

export function SellerCard({ seller }: { seller: ListingDetail["seller"] }) {
  const profileHref = `/u/${seller.id}`;

  return (
    <section className="rounded-[20px] border border-line bg-card p-5 shadow-[var(--shadow-card)]">
      {/* Name and photo open the seller's profile, with all their ads. */}
      <Link href={profileHref} className="group flex items-center gap-3">
        <div className="relative">
          <ChatAvatar name={seller.name} url={seller.avatarUrl} className="h-12 w-12 text-sm" />
          {seller.isVerified ? (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white ring-2 ring-card" title="Verified seller">
              <ShieldCheck className="h-3 w-3" tick="var(--color-brand-500)" />
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold underline-offset-2 group-hover:underline">{seller.name}</p>
          <p className="text-xs text-muted">{memberSince(seller.memberSince)}</p>
        </div>
        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-subtle transition-colors group-hover:text-ink" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="m6 3.5 4.5 4.5L6 12.5" />
        </svg>
      </Link>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="sr-only">Rating</dt>
          <dd>
            <SellerRating sellerId={seller.id} sellerName={seller.name} avg={seller.ratingAvg} count={seller.ratingCount} />
          </dd>
        </div>
        <div className="rounded-xl bg-sand px-2 py-2.5">
          <dt className="text-[11px] text-muted">Listings</dt>
          <dd className="mt-0.5 text-sm font-bold">{seller.activeListings}</dd>
        </div>
        <div className="rounded-xl bg-sand px-2 py-2.5">
          <dt className="text-[11px] text-muted">Location</dt>
          <dd className="mt-0.5 truncate text-sm font-bold">{seller.city}</dd>
        </div>
      </dl>

      {seller.isVerified ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-brand-700">
          <ShieldCheck className="mt-px h-4 w-4 shrink-0" />
          ID verified by {site.name}. This seller can receive safe payments.
        </p>
      ) : (
        <p className="mt-4 rounded-xl bg-sand px-3 py-2.5 text-xs leading-relaxed text-muted">
          This seller hasn&apos;t verified their ID yet.
        </p>
      )}

      <Link
        href={profileHref}
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[10px] border border-line-strong text-sm font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-sand"
      >
        See all their ads
      </Link>
    </section>
  );
}
