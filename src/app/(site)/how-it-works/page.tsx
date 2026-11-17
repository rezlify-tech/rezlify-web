import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, CtaBox, Prose, Steps, TrustNote } from "@/components/content/ContentPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "How Buy now works",
  description: `Pay safely on ${site.name}. Your money is held until you confirm you've got the item.`,
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <ContentPage
      eyebrow="Buy now"
      title="Pay safely. Get what you paid for."
      intro={`With Buy now, ${site.name} holds your money until you confirm you've got the item. The seller can't touch it before then.`}
    >
      <h2 className="text-lg font-extrabold">For buyers</h2>
      <div className="mt-4">
        <Steps
          steps={[
            { title: "Tap Buy now", body: "Choose to meet in person or have the seller deliver. Buyers pay no extra fee." },
            { title: "Transfer to the account shown", body: "Each order gets its own account number. Pay the exact amount within the time shown (usually 30 minutes)." },
            {
              title: "Get the item and check it",
              body: "At a meetup, check it properly first. Then give the seller your 6-digit release code from your order. That code pays them, so only share it when you're happy.",
            },
            {
              title: "Confirm, or report a problem",
              body: "Tap \"I've received it\" and the seller is paid. If something's wrong, tap \"Report a problem\" and we hold the money while we look into it.",
            },
          ]}
        />
      </div>

      <h2 className="mt-12 text-lg font-extrabold">For sellers</h2>
      <div className="mt-4">
        <Steps
          steps={[
            { title: "Get verified", body: <>Verify your ID and add your bank account on the <Link href="/verify" className="font-semibold text-ink underline">verify page</Link>. Your ads then show Buy now.</> },
            { title: "We tell you when they've paid", body: "You'll see it in chat, by email and in your orders. Don't hand anything over before the order says Paid." },
            { title: "Hand over or send the item", body: "At a meetup, ask for the buyer's code and enter it. For delivery, mark it as sent." },
            {
              title: "Get paid to your bank",
              body: "The money goes to your bank when the buyer confirms, or automatically if they report nothing in time (usually 48 hours after handover). A small fee comes off the price.",
            },
          ]}
        />
      </div>

      <div className="mt-12">
        <Prose>
          <h2>What if something goes wrong?</h2>
          <ul>
            <li>
              <strong>The seller can't deliver:</strong> they refund you in full from the order, and the money goes straight back to your bank.
            </li>
            <li>
              <strong>The item isn't what was described, is damaged or fake:</strong> report a problem before confirming. Our team reviews the chat and any proof,
              then refunds you or pays the seller. See <Link href="/help/disputes">disputes and refunds</Link>.
            </li>
            <li>
              <strong>You didn&apos;t pay in time:</strong> the order closes and the item goes back on sale. If your money arrived late, we refund it.
            </li>
          </ul>
        </Prose>
      </div>

      <div className="mt-8">
        <TrustNote>
          {site.name} will never ask you to pay into a personal account, to pay a &quot;deposit&quot; outside the app, or to share your release code before you have the item.
        </TrustNote>
      </div>

      <CtaBox title="Ready to buy safely?" body="Look for the Buy now badge on ads." href="/search?buy_now=1" label="See Buy now items" />
    </ContentPage>
  );
}
