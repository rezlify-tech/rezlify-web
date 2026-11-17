import Image from "next/image";
import Link from "next/link";
import { ConditionBadge, ShieldCheck } from "@/components/ui/Badge";
import { formatNaira, timeAgo } from "@/lib/format";
import { listingHref } from "@/lib/listing-url";
import type { ListingSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SaveButton } from "./SaveButton";

export { listingHref };

function PhotoPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center text-line-strong">
      <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <circle cx="9" cy="10" r="1.75" />
        <path d="m21 16-5-5-9 8" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M3 7.25A1.75 1.75 0 0 1 4.75 5.5h1.5l1.25-1.75h5L13.75 5.5h1.5A1.75 1.75 0 0 1 17 7.25v7A1.75 1.75 0 0 1 15.25 16H4.75A1.75 1.75 0 0 1 3 14.25v-7Z" strokeLinejoin="round" />
      <circle cx="10" cy="10.5" r="2.75" />
    </svg>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-amber-500" fill="currentColor" aria-hidden>
      <path d="m10 1.75 2.47 5.2 5.7.68-4.2 3.92 1.1 5.63L10 14.4l-5.07 2.78 1.1-5.63-4.2-3.92 5.7-.68L10 1.75Z" />
    </svg>
  );
}

export function ListingCard({ listing, priority = false, className }: { listing: ListingSummary; priority?: boolean; className?: string }) {
  const { seller } = listing;

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-[var(--radius-card)] border border-line bg-card p-2.5 shadow-[var(--shadow-card)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sand">
        {listing.photo ? (
          <Image
            src={listing.photo.url}
            alt=""
            fill
            priority={priority}
            unoptimized={/^(blob|data):/.test(listing.photo.url)}
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <PhotoPlaceholder />
        )}

        {seller.isVerified || listing.isBoosted ? (
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {seller.isVerified ? (
              <span
                title="Verified seller"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_2px_8px_-2px_rgb(0_0_0/0.4)] ring-2 ring-white/90"
              >
                <ShieldCheck className="h-[18px] w-[18px]" tick="var(--color-brand-500)" />
                <span className="sr-only">Verified seller</span>
              </span>
            ) : null}
            {listing.isBoosted ? (
              <span className="rounded-md bg-ink/85 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                Boosted
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-ink/70 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            <CameraIcon />
            {listing.photoCount}
          </span>
          {listing.canBuyNow ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold text-ink">
              <ShieldCheck className="h-3 w-3" />
              Buy now
            </span>
          ) : null}
        </div>
      </div>

      {/* Save sits above the stretched link so it stays clickable */}
      <SaveButton listingId={listing.id} initialSaved={listing.isSaved} className="absolute right-4 top-4 z-10" />

      {/* Details */}
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg font-extrabold tracking-[-0.01em]">{formatNaira(listing.price)}</span>
          {listing.isNegotiable ? <span className="text-xs font-medium text-subtle">Negotiable</span> : null}
        </div>

        <h3 className="mt-1 line-clamp-2 text-[15px] font-medium leading-snug text-ink-3">
          <Link href={listingHref(listing)} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none">
            {listing.title}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <ConditionBadge condition={listing.condition} />
          {listing.highlights.slice(0, 2).map((h) => (
            <span key={h} className="rounded-md bg-sand px-2 py-0.5 text-xs text-muted">
              {h}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between gap-2 border-t border-line pt-2.5 text-xs text-muted">
            <span className="truncate">
              {listing.location.city}, {listing.location.state}
            </span>
            <span className="shrink-0">{timeAgo(listing.publishedAt)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1 font-medium text-ink-3">
              {/* Above the card's own link, so tapping the name opens the seller instead of the ad. */}
              <Link href={`/u/${seller.id}`} className="relative z-10 truncate underline-offset-2 hover:text-ink hover:underline">
                {seller.name}
              </Link>
              {seller.isVerified ? (
                <span className="shrink-0 text-brand-500" title="Verified seller">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="sr-only">Verified seller</span>
                </span>
              ) : null}
            </span>
            {seller.ratingCount > 0 ? (
              <span className="flex shrink-0 items-center gap-0.5 text-muted">
                <Star />
                {seller.ratingAvg.toFixed(1)}
                <span>({seller.ratingCount})</span>
              </span>
            ) : (
              <span className="shrink-0 text-subtle">New seller</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-card p-2.5" aria-hidden>
      <div className="skeleton aspect-[4/3] rounded-xl" />
      <div className="px-1 pt-3">
        <div className="skeleton h-5 w-2/5 rounded-md" />
        <div className="skeleton mt-2 h-4 w-full rounded-md" />
        <div className="skeleton mt-1.5 h-4 w-3/4 rounded-md" />
        <div className="skeleton mt-4 h-3 w-full rounded-md" />
      </div>
    </div>
  );
}

export function ListingGrid({ listings, className }: { listings: ListingSummary[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4", className)}>
      {listings.map((l, i) => (
        <ListingCard key={l.id} listing={l} priority={i < 4} />
      ))}
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
