import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, LinkCards, Prose } from "@/components/content/ContentPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Help centre",
  description: `Answers to common questions about buying and selling on ${site.name}.`,
  alternates: { canonical: "/help" },
};

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is it free to post an ad?",
    a: "Yes. Posting ads, chatting and calling are free. With Buy now, a small fee comes off the price only when you make a sale.",
  },
  {
    q: "Why is my ad \"under review\"?",
    a: "Some ads are checked by our team before going live, for example when they include a phone number, mention paying outside the app, or the price looks too good to be true. Most are reviewed quickly. If it's not approved, you'll see why in My ads and by email.",
  },
  {
    q: "How do I get the Buy now badge on my ads?",
    a: <>Get verified: check your ID, take a live selfie and add your bank account on the <Link href="/verify">verify page</Link>. It takes about 2 minutes.</>,
  },
  {
    q: "I paid but the order still says \"waiting for payment\"",
    a: "Transfers usually show within a minute. Make sure you sent the exact amount to the account shown on the order, before the timer ran out. If money arrives after the order closes, we refund it automatically. Still stuck? Contact us with your order reference.",
  },
  {
    q: "What's the release code?",
    a: "A 6-digit code on the buyer's order. The buyer gives it to the seller only after checking the item; entering it pays the seller. Never share it before you have the item.",
  },
  {
    q: "When do sellers get paid?",
    a: "As soon as the buyer confirms, or enters the code at a meetup. If the buyer doesn't report a problem in time after handover (usually 48 hours), the money is released automatically.",
  },
  {
    q: "How do I mark an item as sold?",
    a: <>In <Link href="/account/ads">My ads</Link>, tap Mark sold. Items bought with Buy now are marked sold automatically.</>,
  },
  {
    q: "Can I delete a message I sent?",
    a: "Yes, within an hour of sending: press and hold it (or right-click on a computer) and choose Delete.",
  },
  {
    q: "How do I block someone?",
    a: "Open the chat, tap the menu at the top and choose Block. They won't be able to message or call you.",
  },
];

export default function HelpPage() {
  return (
    <ContentPage eyebrow="Help" title="How can we help?" intro="Quick answers to common questions. Can't find yours? We're happy to help.">
      <LinkCards
        items={[
          { href: "/how-it-works", title: "How Buy now works", body: "Paying safely, release codes and getting paid." },
          { href: "/help/disputes", title: "Disputes and refunds", body: "What to do if an order goes wrong." },
          { href: "/safety", title: "Safety tips", body: "Spot scams and meet safely." },
          { href: "/report", title: "Report a scam", body: "Tell us about an ad, person or message." },
        ]}
      />

      <h2 className="mt-12 text-xl font-extrabold tracking-[-0.01em]">Common questions</h2>
      <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
        {faqs.map((f) => (
          <details key={f.q} className="group px-4 sm:px-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
              {f.q}
              <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-subtle transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="m5 7.5 5 5 5-5" />
              </svg>
            </summary>
            <Prose className="pb-4 [&_p]:mt-0">
              <p>{f.a}</p>
            </Prose>
          </details>
        ))}
      </div>

      <Prose className="mt-10">
        <h2>Still need help?</h2>
        <p>
          <Link href="/contact">Contact us</Link> and include your order reference (like {site.orderPrefix}-7KQ2M9) if it&apos;s about an order.
        </p>
      </Prose>
    </ContentPage>
  );
}
