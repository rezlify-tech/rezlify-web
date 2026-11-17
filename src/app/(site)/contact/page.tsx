import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, LinkCards, Prose } from "@/components/content/ContentPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Get in touch with the ${site.name} team.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <ContentPage eyebrow="Help" title="Contact us" intro="We're a small team and we read every message.">
      <a
        href={`mailto:${site.support.email}`}
        className="flex items-center justify-between gap-4 rounded-[20px] bg-ink p-6 text-white transition-colors hover:bg-ink-3"
      >
        <span>
          <span className="block text-sm text-white/70">Email us</span>
          <span className="mt-0.5 block text-lg font-extrabold sm:text-xl">{site.support.email}</span>
        </span>
        <span aria-hidden className="text-2xl">→</span>
      </a>

      <Prose className="mt-8">
        <h2>To help us help you faster</h2>
        <ul>
          <li>Write from the email address on your {site.name} account.</li>
          <li>For an order, include the reference (like {site.orderPrefix}-7KQ2M9).</li>
          <li>For an ad, include its link.</li>
        </ul>
        <p>
          A problem with an order? The fastest way is <strong>Report a problem</strong> on the order itself. It holds the money straight away. See{" "}
          <Link href="/help/disputes">disputes and refunds</Link>.
        </p>
      </Prose>

      <div className="mt-10">
        <LinkCards
          items={[
            { href: "/help", title: "Help centre", body: "Answers to common questions." },
            { href: "/report", title: "Report a scam", body: "Ads, people or messages." },
          ]}
        />
      </div>
    </ContentPage>
  );
}
