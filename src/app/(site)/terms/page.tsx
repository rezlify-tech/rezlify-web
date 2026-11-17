import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, Prose } from "@/components/content/ContentPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const n = site.name;
  return (
    <ContentPage eyebrow="Legal" title="Terms of use" updated="16 November 2026" intro={`The rules for using ${n}. Please read them; by using ${n} you agree to them.`}>
      <Prose>
        <h2>1. Who we are</h2>
        <p>
          {n} ({site.domain}) is operated by {site.owner.legalName}, a company registered in Nigeria (&quot;we&quot;, &quot;us&quot;). {n} is a marketplace:
          we connect buyers and sellers. Unless we say otherwise, we are not the seller of any item listed.
        </p>

        <h2>2. Your account</h2>
        <ul>
          <li>You must be at least 18 years old to use {n}.</li>
          <li>Give accurate details and keep your password private. You&apos;re responsible for what happens on your account.</li>
          <li>One person, one account. Don&apos;t create accounts for someone else or to get around a suspension.</li>
        </ul>

        <h2>3. Posting ads</h2>
        <ul>
          <li>You must own, or have the right to sell, what you list, and describe it honestly: real photos, real condition, real price.</li>
          <li>Don&apos;t list prohibited items, including weapons, drugs, stolen goods, counterfeit or replica items, items that need a licence you don&apos;t have, and anything illegal in Nigeria.</li>
          <li>Don&apos;t put phone numbers, emails or payment details in ads, or ask buyers to pay outside {n}.</li>
          <li>We may review, edit the category of, hide, reject or remove any ad, and may limit how many ads an account can post.</li>
        </ul>

        <h2>4. Buy now (protected payments)</h2>
        <ul>
          <li>When a buyer pays with Buy now, we (through our licensed payment partner) hold the money until the order is completed, refunded or decided by our team.</li>
          <li>The buyer must pay the exact amount within the time shown, or the order is cancelled.</li>
          <li>The seller is paid when the buyer confirms, when the seller enters the buyer&apos;s release code, or automatically if the buyer reports no problem within the time shown on the order after handover.</li>
          <li>Sellers pay a fee on each completed Buy now sale. The current fee is shown to the seller on each order. We may change fees for future orders.</li>
          <li>Payouts go only to the verified bank account in the seller&apos;s own name.</li>
          <li>If a problem is reported, our team reviews the order and decides whether to refund the buyer or pay the seller. See <Link href="/help/disputes">disputes and refunds</Link>. Our decision on where the held money goes is final on {n}; it doesn&apos;t limit any legal rights you have.</li>
          <li>We can only protect payments made through Buy now. Payments made directly between users are at their own risk.</li>
        </ul>

        <h2>5. Verification</h2>
        <p>
          Sellers may verify their identity and bank account through our verification partners. The verified badge means these checks passed; it is not a
          guarantee of any item or of a seller&apos;s conduct.
        </p>

        <h2>6. How to behave</h2>
        <ul>
          <li>No scams, fake reviews, harassment, threats, hate or spam.</li>
          <li>Don&apos;t misuse reports, disputes or reviews.</li>
          <li>Don&apos;t copy, scrape or interfere with {n}, or try to get into accounts that aren&apos;t yours.</li>
        </ul>

        <h2>7. Suspension</h2>
        <p>
          We may hide content, pause ads, hold or refund Buy now payments, or suspend or close accounts that break these terms, put other users at risk or
          that the law requires us to act on. Where it&apos;s safe to, we&apos;ll tell you why.
        </p>

        <h2>8. Our responsibility</h2>
        <p>
          We work hard to keep {n} safe, but we don&apos;t inspect items and can&apos;t guarantee every user or ad. Except for money we hold through Buy now,
          deals are between buyer and seller. To the extent the law allows, we aren&apos;t liable for indirect losses, or for losses from deals made outside
          Buy now.
        </p>

        <h2>9. Changes</h2>
        <p>We may update these terms. If the changes are important, we&apos;ll let you know before they apply. Using {n} after that means you accept them.</p>

        <h2>10. Law</h2>
        <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>

        <h2>11. Contact</h2>
        <p>
          Questions about these terms: <a href={`mailto:${site.support.email}`}>{site.support.email}</a>.
        </p>
      </Prose>
    </ContentPage>
  );
}
