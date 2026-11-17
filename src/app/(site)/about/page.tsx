import type { Metadata } from "next";
import { ContentPage, CtaBox, Prose } from "@/components/content/ContentPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `About ${site.name}`,
  description: site.description,
  alternates: { canonical: "/about" },
};

const points = [
  { title: "Know who you're dealing with", body: "Sellers can verify their ID, face and bank account. The green shield means they passed." },
  { title: "Pay without the fear", body: "Buy now holds your money until you confirm you've got the item. No more paying and praying." },
  { title: "Real people watching", body: "Risky ads are checked before they go live, and every report is reviewed by our team." },
];

export default function AboutPage() {
  return (
    <ContentPage eyebrow="About" title={`${site.headline.lead} ${site.headline.accent}`} intro={site.description}>
      <div className="grid gap-3 sm:grid-cols-3">
        {points.map((p) => (
          <div key={p.title} className="rounded-2xl border border-line bg-card p-5">
            <p className="font-bold">{p.title}</p>
            <p className="mt-1.5 text-sm text-muted">{p.body}</p>
          </div>
        ))}
      </div>

      <Prose className="mt-10">
        <h2>Why we built {site.name}</h2>
        <p>
          Buying second-hand in Nigeria shouldn&apos;t feel like a gamble. Too many people have paid for a phone that never came, or met a buyer whose
          &quot;transfer&quot; never landed. {site.name} is a place to buy and sell where the safe way is also the easy way.
        </p>
        <h2>Who we are</h2>
        <p>
          {site.name} is built and run by{" "}
          <a href={site.owner.url} target="_blank" rel="noopener noreferrer">
            {site.owner.legalName}
          </a>
          , a Nigerian technology company.
        </p>
      </Prose>

      <CtaBox title="Got something to sell?" body="Posting is free." href="/sell" label="Post an ad" />
    </ContentPage>
  );
}
