import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, Prose, Steps, TrustNote } from "@/components/content/ContentPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disputes and refunds",
  description: `What happens when a Buy now order on ${site.name} goes wrong, and how refunds work.`,
  alternates: { canonical: "/help/disputes" },
};

export default function DisputesPage() {
  return (
    <ContentPage
      eyebrow="Help"
      title="Disputes and refunds"
      intro="If a Buy now order goes wrong, the money stays with us until it's sorted out. Here's how that works."
    >
      <TrustNote>While a problem is open, the seller cannot be paid. The money stays with {site.name} until our team decides.</TrustNote>

      <h2 className="mt-10 text-xl font-extrabold tracking-[-0.01em]">Reporting a problem</h2>
      <div className="mt-4">
        <Steps
          steps={[
            {
              title: "Open your order and tap Report a problem",
              body: "Do this before confirming, and before the time to report runs out (usually 48 hours after the seller hands over). Don't give the seller your release code.",
            },
            { title: "Tell us what happened", body: "Choose the reason (not received, not as described, damaged, fake, or something else) and describe it." },
            { title: "Keep your proof", body: "Photos or video of the item, and your chat with the seller. Keep chatting in the app, not on WhatsApp, so we can see it." },
            { title: "We decide", body: "Our team reviews the order, the chat and any proof, may contact you both, then refunds the buyer or pays the seller. Both of you see the decision and the reason." },
          ]}
        />
      </div>

      <Prose className="mt-10">
        <h2>When you get a refund</h2>
        <ul>
          <li>The seller can&apos;t deliver and refunds you from the order.</li>
          <li>Our team decides a dispute in your favour.</li>
          <li>Your payment arrived after the order had already closed.</li>
        </ul>
        <p>Refunds go back to the account you paid from. They&apos;re usually sent within minutes, but your bank may take longer to show it.</p>

        <h2>When the seller gets paid</h2>
        <ul>
          <li>You confirm you&apos;ve got the item, or give the seller your release code.</li>
          <li>No problem is reported in time after the seller hands over.</li>
          <li>Our team decides a dispute in the seller&apos;s favour.</li>
        </ul>
        <p>Once a seller has been paid, the order is complete and can&apos;t be reopened, so only confirm when you&apos;re happy.</p>

        <h2>Sellers: if a problem is reported</h2>
        <p>
          Reply to the buyer in chat and keep your proof: photos before sending, delivery receipts, anything that shows the item&apos;s condition. Our team
          may ask you for it.
        </p>

        <h2>Paid outside {site.name}?</h2>
        <p>
          We can only protect payments made with Buy now. If you paid a seller directly and were scammed, <Link href="/report">report them</Link> so we can
          stop them doing it to others, and contact your bank and the police.
        </p>
      </Prose>
    </ContentPage>
  );
}
