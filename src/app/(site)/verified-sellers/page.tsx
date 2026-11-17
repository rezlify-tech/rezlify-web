import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, CtaBox, Prose, TrustNote } from "@/components/content/ContentPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Verified sellers",
  description: `What the verified badge on ${site.name} means, and how to get it.`,
  alternates: { canonical: "/verified-sellers" },
};

export default function VerifiedSellersPage() {
  return (
    <ContentPage
      eyebrow="Trust"
      title="Verified sellers"
      intro="The green shield means we've checked who this seller is. It's the quickest way to know who you're dealing with."
    >
      <TrustNote>A verified seller has passed an ID check, a live selfie check and a bank account check, all in their own name.</TrustNote>

      <Prose className="mt-8">
        <h2>What we check</h2>
        <ul>
          <li>
            <strong>Their ID:</strong> their BVN or NIN, checked with the official records.
          </li>
          <li>
            <strong>That it&apos;s really them:</strong> a live selfie, matched to the photo on their ID record.
          </li>
          <li>
            <strong>Their bank account:</strong> the account name must match their ID. Buy now payments only ever go to this account.
          </li>
        </ul>

        <h2>What it doesn&apos;t mean</h2>
        <p>
          Verification tells you who the seller is. It doesn&apos;t guarantee the item. Always check the item, read their reviews, and use Buy now so your money is
          protected until you&apos;re happy.
        </p>

        <h2>Want the badge?</h2>
        <p>
          It takes about 2 minutes and you&apos;ll need your BVN or NIN and your phone camera. Verified sellers can take Buy now payments and show up in the
          Verified sellers filter. <Link href="/verify">Get verified</Link>.
        </p>
      </Prose>

      <CtaBox title="Shop from verified sellers" body="Only ads from sellers who passed our checks." href="/search?verified=1" label="Browse verified sellers" />
    </ContentPage>
  );
}
