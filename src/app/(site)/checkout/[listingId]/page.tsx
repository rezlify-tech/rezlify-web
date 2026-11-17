import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Checkout } from "@/components/orders/Checkout";
import { LoadError } from "@/components/ui/LoadError";
import { listingHref } from "@/lib/listing-url";
import { TOKEN_COOKIE } from "@/lib/server/laravel";
import { getListing } from "@/lib/server/listings";

export const metadata: Metadata = {
  title: "Buy now",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ listingId: string }> };

export default async function CheckoutPage({ params }: Props) {
  const { listingId } = await params;
  if (!/^[0-9a-z]{26}$/i.test(listingId)) notFound();

  const signedIn = Boolean((await cookies()).get(TOKEN_COOKIE)?.value);
  if (!signedIn) redirect(`/login?next=${encodeURIComponent(`/checkout/${listingId}`)}`);

  const page = await getListing(listingId);
  if (page === "missing") notFound();
  if (!page) {
    return (
      <div className="container-x py-10">
        <LoadError title="We couldn't load this item" retryHref={`/checkout/${listingId}`} />
      </div>
    );
  }

  const { listing, isOwner } = page;
  const unavailable = isOwner
    ? "This is your own ad."
    : listing.status !== "active"
      ? "This item is no longer available."
      : !listing.canBuyNow
        ? "This seller doesn't take Buy now payments. You can still chat with them."
        : null;

  if (unavailable) {
    return (
      <div className="container-x py-10">
        <div className="mx-auto max-w-md rounded-[20px] border border-line bg-card p-6 text-center">
          <h1 className="text-lg font-extrabold">Can&apos;t buy this here</h1>
          <p className="mt-1.5 text-sm text-muted">{unavailable}</p>
          <Link href={listingHref(listing)} className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-3">
            Back to the item
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-5 sm:py-10">
      <Checkout listing={listing} />
    </div>
  );
}
