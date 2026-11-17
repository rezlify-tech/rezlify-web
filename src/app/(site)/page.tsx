import Link from "next/link";
import { Discover } from "@/components/home/Discover";
import { ListingGrid } from "@/components/listing/ListingCard";
import { LoadError } from "@/components/ui/LoadError";
import { freshListings } from "@/lib/server/listings";

export default async function HomePage() {
  const listings = await freshListings(12);

  return (
    <>
      <Discover />

      <section className="container-x pb-12 pt-10 sm:pb-16 sm:pt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">Fresh listings</h2>
            <p className="mt-1 text-sm text-muted">Just posted by sellers across Nigeria.</p>
          </div>
          <Link href="/search" className="shrink-0 text-sm font-semibold text-ink underline-offset-4 hover:underline">
            See all
          </Link>
        </div>

        {listings === null ? (
          <div className="mt-6">
            <LoadError title="We couldn't load fresh listings" retryHref="/" />
          </div>
        ) : listings.length ? (
          <ListingGrid listings={listings} className="mt-6" />
        ) : (
          <div className="mt-6 rounded-[20px] border border-dashed border-line-strong bg-card px-6 py-14 text-center">
            <h3 className="text-lg font-extrabold tracking-[-0.01em]">No ads yet</h3>
            <p className="mt-1.5 text-sm text-muted">Be the first to sell something here.</p>
            <Link
              href="/sell"
              className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-3"
            >
              Post an ad
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
