import type { Metadata } from "next";
import { ContentPage, CtaBox, Prose } from "@/components/content/ContentPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop plans",
  description: `Selling on ${site.name} is free. Shops for businesses are coming soon.`,
  alternates: { canonical: "/pricing" },
};

const free = [
  "Post ads for free",
  "Chat and call buyers in the app",
  "Get verified and take Buy now payments",
  "Reviews and a public seller profile",
];

const soon = [
  "Your own shop page and link (rezlify.com/shop/your-name)",
  "Your logo, banner and business details",
  "Boosted ads that show higher in search",
  "Sales and views reports",
];

export default function PricingPage() {
  return (
    <ContentPage
      eyebrow="Sell"
      title="Selling is free"
      intro="Post ads, chat with buyers and get paid safely without paying anything upfront. Shops for businesses are coming soon."
      wide
    >
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-[20px] border-2 border-ink bg-card p-6">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-subtle">Everyone</p>
          <p className="mt-2 text-3xl font-extrabold">Free</p>
          <p className="mt-1 text-sm text-muted">With Buy now, a small fee comes off the price only when you make a sale. Buyers pay nothing extra.</p>
          <ul className="mt-5 space-y-2 text-sm">
            {free.map((f) => (
              <li key={f} className="flex gap-2.5">
                <span aria-hidden className="font-bold">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[20px] border border-line bg-sand p-6">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-subtle">Shops</p>
          <p className="mt-2 text-3xl font-extrabold">Coming soon</p>
          <p className="mt-1 text-sm text-muted">For businesses that sell a lot. Plans and prices will be announced here.</p>
          <ul className="mt-5 space-y-2 text-sm text-ink-3">
            {soon.map((f) => (
              <li key={f} className="flex gap-2.5">
                <span aria-hidden>•</span>
                {f}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Prose className="mt-10 max-w-3xl">
        <h2>Want a shop early?</h2>
        <p>
          If you sell regularly, email us at <a href={`mailto:${site.support.email}?subject=Shop%20early%20access`}>{site.support.email}</a> with what you
          sell and where. We&apos;ll invite our first shops before launch.
        </p>
      </Prose>

      <CtaBox title="Start selling today" body="It's free and takes about a minute." href="/sell" label="Post an ad" />
    </ContentPage>
  );
}
