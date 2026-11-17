import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatAvatar } from "@/components/chat/ChatAvatar";
import { ListingGrid } from "@/components/listing/ListingCard";
import { AllReviewsButton } from "@/components/reviews/AllReviewsButton";
import { SellerRating } from "@/components/reviews/SellerRating";
import { Pagination } from "@/components/search/Pagination";
import { ShieldCheck } from "@/components/ui/Badge";
import { LoadError } from "@/components/ui/LoadError";
import { memberSince, timeAgo } from "@/lib/format";
import { listingHref } from "@/lib/listing-url";
import { getSellerPage, latestReviews } from "@/lib/server/sellers";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
};

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Lowest price" },
  { id: "price_desc", label: "Highest price" },
  { id: "popular", label: "Most viewed" },
] as const;

const lastActiveText = {
  online: "Online now",
  today: "Active today",
  this_week: "Active this week",
  a_while_ago: "Not active recently",
} as const;

function readQuery(sp: { page?: string; sort?: string }) {
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const sort = SORTS.some((s) => s.id === sp.sort) ? (sp.sort as string) : "newest";
  return { page, sort };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const { page, sort } = readQuery(await searchParams);
  const data = await getSellerPage(id, page, sort);
  if (data === "missing") return { title: "Seller not found" };
  if (!data) return { title: "Seller" };

  const { seller } = data;
  const where = seller.city ? ` in ${seller.city}` : "";
  return {
    title: `${seller.name}${seller.isVerified ? " · Verified seller" : ""}`,
    description: `${seller.activeListings} item${seller.activeListings === 1 ? "" : "s"} for sale by ${seller.name}${where} on ${site.name}.`,
    alternates: { canonical: `/u/${seller.id}` },
  };
}

export default async function SellerPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { page, sort } = readQuery(await searchParams);
  const [data, reviews] = await Promise.all([getSellerPage(id, page, sort), latestReviews(id)]);

  if (data === "missing") notFound();
  if (!data) {
    return (
      <div className="container-x py-10">
        <LoadError title="We couldn't load this seller" retryHref={`/u/${id}`} />
      </div>
    );
  }

  const { seller, listings } = data;
  const hrefFor = (p: number, s = sort) => {
    const q = new URLSearchParams();
    if (s !== "newest") q.set("sort", s);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return `/u/${seller.id}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="container-x py-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
        {/* About the seller */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-[20px] border border-line bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <ChatAvatar name={seller.name} url={seller.avatarUrl} className="h-16 w-16 text-lg" />
                {seller.isVerified ? (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white ring-2 ring-card" title="Verified seller">
                    <ShieldCheck className="h-3.5 w-3.5" tick="var(--color-brand-500)" />
                  </span>
                ) : null}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold tracking-[-0.01em]">{seller.name}</h1>
                {seller.memberSince ? <p className="text-xs text-muted">{memberSince(seller.memberSince)}</p> : null}
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  {seller.lastActive ? (
                    <>
                      <span className={cn("h-1.5 w-1.5 rounded-full", seller.lastActive === "online" ? "bg-brand-500" : "bg-line-strong")} />
                      {lastActiveText[seller.lastActive]}
                    </>
                  ) : null}
                  {seller.city ? <span>{seller.lastActive ? "· " : ""}{seller.city}{seller.state ? `, ${seller.state}` : ""}</span> : null}
                </p>
              </div>
            </div>

            {seller.bio ? <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-3">{seller.bio}</p> : null}

            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="sr-only">Rating</dt>
                <dd>
                  <SellerRating sellerId={seller.id} sellerName={seller.name} avg={seller.ratingAvg} count={seller.ratingCount} />
                </dd>
              </div>
              <div className="rounded-xl bg-sand px-2 py-2.5">
                <dt className="text-[11px] text-muted">Sold here</dt>
                <dd className="mt-0.5 text-sm font-bold">{seller.completedSales}</dd>
              </div>
              <div className="rounded-xl bg-sand px-2 py-2.5">
                <dt className="text-[11px] text-muted">Live ads</dt>
                <dd className="mt-0.5 text-sm font-bold">{seller.activeListings}</dd>
              </div>
            </dl>

            {seller.isVerified ? (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-brand-700">
                <ShieldCheck className="mt-px h-4 w-4 shrink-0" />
                ID and bank account verified by {site.name}. Pay with Buy now and your money is held until you confirm the item.
              </p>
            ) : (
              <p className="mt-4 rounded-xl bg-sand px-3 py-2.5 text-xs leading-relaxed text-muted">
                This seller hasn&apos;t verified their ID yet. Meet in a public place and check the item before paying.
              </p>
            )}
          </section>

          <Link
            href={`/report?user=${seller.id}`}
            className="inline-flex items-center gap-2 px-1 text-sm font-semibold text-danger-600 underline-offset-4 hover:underline"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4.5 17.5v-14M4.5 3.5h9l-1.75 3.5 1.75 3.5h-9" />
            </svg>
            Report this seller
          </Link>

          {reviews.length ? (
            <section className="rounded-[20px] border border-line bg-card p-5">
              <h2 className="font-extrabold">What buyers say</h2>
              <ul className="mt-3 space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="text-sm">
                    <p className="flex items-center gap-1 text-amber-500" aria-label={`${r.rating} out of 5`}>
                      {"★★★★★".slice(0, r.rating)}
                      <span className="text-line-strong">{"★★★★★".slice(r.rating)}</span>
                      <span className="ml-1 text-xs text-subtle">{timeAgo(r.createdAt)}</span>
                    </p>
                    {r.comment ? <p className="mt-1 line-clamp-3 leading-relaxed text-ink-3">{r.comment}</p> : null}
                    <p className="mt-1 text-xs text-muted">
                      {r.reviewer.name}
                      {r.item ? (
                        <>
                          {" · "}
                          <Link href={listingHref(r.item)} className="hover:underline">
                            {r.item.title}
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
              {seller.ratingCount > reviews.length ? (
                <div className="mt-4">
                  <AllReviewsButton sellerId={seller.id} sellerName={seller.name} count={seller.ratingCount} />
                </div>
              ) : null}
            </section>
          ) : null}
        </aside>

        {/* Their ads */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl font-extrabold tracking-[-0.01em]">
              {data.total} item{data.total === 1 ? "" : "s"} for sale
            </h2>
            {data.total > 1 ? (
              <nav className="flex gap-1.5 overflow-x-auto" aria-label="Sort">
                {SORTS.map((s) => (
                  <Link
                    key={s.id}
                    href={hrefFor(1, s.id)}
                    scroll={false}
                    aria-current={sort === s.id ? "true" : undefined}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-semibold transition-colors",
                      sort === s.id ? "bg-ink text-white" : "bg-card text-ink-3 ring-1 ring-line hover:text-ink",
                    )}
                  >
                    {s.label}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>

          {listings.length ? (
            <ListingGrid listings={listings} className="mt-4 lg:grid-cols-3" />
          ) : (
            <div className="mt-4 rounded-[20px] border border-dashed border-line-strong bg-card px-6 py-12 text-center">
              <p className="font-bold">No live ads right now</p>
              <p className="mt-1 text-sm text-muted">Check back later.</p>
            </div>
          )}

          <Pagination page={data.page} lastPage={data.lastPage} hrefFor={(p) => hrefFor(p)} className="mt-6" />
        </section>
      </div>
    </div>
  );
}
