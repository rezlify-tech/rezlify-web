import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Gallery } from "@/components/item/Gallery";
import { ItemActions } from "@/components/item/ItemActions";
import { SellerCard } from "@/components/item/SellerCard";
import { ListingGrid } from "@/components/listing/ListingCard";
import { ConditionBadge, ShieldCheck } from "@/components/ui/Badge";
import { LoadError } from "@/components/ui/LoadError";
import { formatNaira, timeAgo } from "@/lib/format";
import { idFromSlugId, listingHref } from "@/lib/listing-url";
import { getListing } from "@/lib/server/listings";
import { site } from "@/lib/site";

type Props = { params: Promise<{ slugId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugId } = await params;
  const page = await getListing(idFromSlugId(slugId));
  if (page === "missing") return { title: "Item not found" };
  if (!page) return { title: "Item" };
  const { listing } = page;

  const description = `${formatNaira(listing.price)} · ${listing.location.city}, ${listing.location.state}. ${listing.description.slice(0, 140)}`;
  return {
    title: listing.title,
    description,
    alternates: { canonical: listingHref(listing) },
    robots: listing.status === "active" ? undefined : { index: false, follow: false },
    openGraph: {
      title: `${listing.title} · ${formatNaira(listing.price)}`,
      description,
      type: "website",
      images: listing.photos[0] ? [{ url: listing.photos[0].url }] : undefined,
    },
  };
}

const safetyTips = [
  "Use Buy now where available. Your money is held until you confirm the item.",
  `Never send money before seeing the item, and never pay outside ${site.name}.`,
  "Meet in a busy public place and check the item properly before paying.",
  "For phones, check that iCloud or Google account is signed out and the IMEI matches.",
];

const deliveryLabels = { meetup: "Meet in person", seller_delivery: "Seller can deliver" } as const;

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">{n}</span>
      <span className="text-sm leading-snug">
        <span className="font-semibold text-ink">{title}</span>
        <span className="block text-xs text-muted">{body}</span>
      </span>
    </li>
  );
}

export default async function ItemPage({ params }: Props) {
  const { slugId } = await params;
  const page = await getListing(idFromSlugId(slugId));

  if (page === "missing") notFound();
  if (!page) {
    return (
      <div className="container-x py-10">
        <LoadError title="We couldn't load this item" retryHref={`/item/${slugId}`} />
      </div>
    );
  }

  const { listing, similar, isOwner } = page;

  // Old or shortened links go to the proper address (e.g. after the seller edits the title).
  if (`${listing.slug}-${listing.id}` !== slugId) permanentRedirect(listingHref(listing));

  const statusNote =
    listing.status === "sold"
      ? "This item has been sold."
      : isOwner && listing.status === "pending_review"
        ? "Only you can see this ad. It goes live once our team reviews it, usually within a few hours."
        : isOwner && listing.status === "paused"
          ? "This ad is paused. Buyers can't see it until you reactivate it from My ads."
          : isOwner && listing.status === "rejected"
            ? "This ad wasn't approved. Check My ads for the reason."
            : null;

  return (
    <div className="container-x pb-28 pt-5 sm:pt-6 lg:pb-12">
      {statusNote ? (
        <div className="mb-4 rounded-2xl border border-line bg-sand px-4 py-3 text-sm font-medium text-ink-3">{statusNote}</div>
      ) : null}

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/search?category=${listing.category.slug}`} className="hover:text-ink">
              {listing.category.name}
            </Link>
          </li>
          <li aria-hidden className="hidden sm:block">
            /
          </li>
          <li className="hidden max-w-[40ch] truncate text-ink-3 sm:block" aria-current="page">
            {listing.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        {/* Gallery */}
        <div className="lg:col-start-1 lg:row-start-1">
          <Gallery photos={listing.photos} title={listing.title} />
        </div>

        {/* Buying panel + seller (stays in view on desktop) */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <section className="rounded-[20px] border border-line bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <ConditionBadge condition={listing.condition} />
              {listing.isBoosted ? (
                <span className="rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Boosted</span>
              ) : null}
            </div>

            <h1 className="mt-3 text-xl font-bold leading-snug tracking-[-0.01em] sm:text-2xl">{listing.title}</h1>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5">
              <span className="text-3xl font-extrabold tracking-[-0.02em]">{formatNaira(listing.price)}</span>
              {listing.isNegotiable ? <span className="text-sm font-medium text-subtle">Negotiable</span> : null}
            </div>

            <p className="mt-2 text-sm text-muted">
              {listing.location.city}, {listing.location.state} · {timeAgo(listing.publishedAt)} · {listing.viewsCount} views
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {listing.deliveryOptions.map((d) => (
                <span key={d} className="rounded-md bg-sand px-2 py-1 text-xs font-medium text-ink-3">
                  {deliveryLabels[d]}
                </span>
              ))}
            </div>

            <div className="mt-5 hidden lg:block">
              <ItemActions listingId={listing.id} title={listing.title} canBuyNow={listing.canBuyNow} initialSaved={listing.isSaved} isOwner={isOwner} />
            </div>

            {listing.canBuyNow ? (
              <div className="mt-5 rounded-2xl border border-line bg-paper p-4">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <span className="text-brand-500">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  How Buy now protects you
                </p>
                <ol className="mt-3 space-y-3">
                  <Step n={1} title={`You pay ${site.name}`} body="The seller doesn't get the money yet." />
                  <Step n={2} title="Seller delivers" body="Check the item properly." />
                  <Step n={3} title="You confirm, seller gets paid" body="Something wrong? Open a dispute and we step in." />
                </ol>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4 text-sm leading-relaxed text-ink-3">
                <p className="font-bold text-ink">Buy now isn&apos;t available for this seller</p>
                <p className="mt-1 text-xs text-muted">
                  They haven&apos;t verified their ID yet. Chat first, meet in a public place, and never pay before you
                  see the item.
                </p>
              </div>
            )}
          </section>

          <SellerCard seller={listing.seller} />
        </aside>

        {/* Details */}
        <div className="space-y-6 lg:col-start-1 lg:row-start-2">
          <section className="rounded-[20px] border border-line bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <h2 className="text-lg font-extrabold tracking-[-0.01em]">Description</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-3">
              {listing.description.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {listing.specs.length ? (
            <section className="rounded-[20px] border border-line bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
              <h2 className="text-lg font-extrabold tracking-[-0.01em]">Details</h2>
              <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
                {listing.specs.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 border-b border-line py-3 text-sm">
                    <dt className="text-muted">{row.label}</dt>
                    <dd className="text-right font-semibold text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section className="rounded-[20px] border border-line bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <h2 className="text-lg font-extrabold tracking-[-0.01em]">Stay safe</h2>
            <ul className="mt-3 space-y-2.5">
              {safetyTips.map((tip) => (
                <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-ink-3">
                  <span className="mt-0.5 shrink-0 text-brand-500">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
            <Link
              href={`/report?listing=${listing.id}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-danger-600 underline-offset-4 hover:underline"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4.5 17.5v-14M4.5 3.5h9l-1.75 3.5 1.75 3.5h-9" />
              </svg>
              Report this listing
            </Link>
          </section>
        </div>
      </div>

      {/* Similar items */}
      {similar.length ? (
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Similar items</h2>
          <ListingGrid listings={similar} className="mt-5" />
        </section>
      ) : null}

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="max-w-[38%] shrink-0">
            <p className="text-[11px] leading-tight text-muted">{listing.isNegotiable ? "Negotiable" : "Price"}</p>
            <p className="truncate text-[15px] font-extrabold leading-tight tabular-nums sm:text-base">{formatNaira(listing.price)}</p>
          </div>
          <div className="min-w-0 flex-1">
            <ItemActions listingId={listing.id} title={listing.title} canBuyNow={listing.canBuyNow} initialSaved={listing.isSaved} isOwner={isOwner} variant="bar" />
          </div>
        </div>
      </div>
    </div>
  );
}
