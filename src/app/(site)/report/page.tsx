import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ContentPage, Prose, Steps, TrustNote } from "@/components/content/ContentPage";
import { ReportForm, type ReportType } from "@/components/report/ReportForm";
import { listingHref } from "@/lib/listing-url";
import { TOKEN_COOKIE } from "@/lib/server/laravel";
import { getListing } from "@/lib/server/listings";
import { getSellerPage } from "@/lib/server/sellers";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Report",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ listing?: string; user?: string; message?: string; conversation?: string }> };

const ULID = /^[0-9a-z]{26}$/i;

export default async function ReportPage({ searchParams }: Props) {
  const sp = await searchParams;

  let type: ReportType;
  let id: string;
  if (sp.listing && ULID.test(sp.listing)) [type, id] = ["listing", sp.listing];
  else if (sp.user && ULID.test(sp.user)) [type, id] = ["user", sp.user];
  else if (sp.message && /^\d+$/.test(sp.message)) [type, id] = ["message", sp.message];
  else return <HowToReport />;

  const self = `/report?${new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][])}`;
  if (!(await cookies()).get(TOKEN_COOKIE)?.value) redirect(`/login?next=${encodeURIComponent(self)}`);

  // What's being reported, in words, and where to go back to.
  let subject = "a chat message";
  let back = sp.conversation && /^\d+$/.test(sp.conversation) ? `/messages/${sp.conversation}` : "/messages";
  if (type === "listing") {
    const page = await getListing(id);
    if (page === "missing") notFound();
    subject = page ? page.listing.title : "this ad";
    back = page ? listingHref(page.listing) : "/";
  } else if (type === "user") {
    const page = await getSellerPage(id);
    if (page === "missing") notFound();
    subject = page ? page.seller.name : "this person";
    back = `/u/${id}`;
  }

  return (
    <div className="container-x py-6 sm:py-10">
      <div className="mx-auto max-w-lg">
        <Link href={back} className="text-sm font-semibold text-muted hover:text-ink">
          ← Back
        </Link>
        <ReportForm type={type} id={id} subject={subject} back={back} />
      </div>
    </div>
  );
}

/** /report on its own (e.g. from the footer): how to report, since a report needs something to point at. */
function HowToReport() {
  return (
    <ContentPage eyebrow="Stay safe" title="Report a scam" intro="Reports are anonymous and every one is checked by our team. Report from the thing that's wrong, so we can see it.">
      <Steps
        steps={[
          { title: "An ad", body: "Open the ad and tap \"Report this ad\" under the safety tips." },
          { title: "A person", body: "Open their profile (tap their name on an ad) and tap \"Report this seller\"." },
          { title: "A chat message", body: "Press and hold the message (right-click on a computer) and choose Report." },
        ]}
      />
      <div className="mt-8">
        <TrustNote>When 3 different people report the same ad, it's hidden straight away until our team reviews it.</TrustNote>
      </div>
      <Prose className="mt-8">
        <h2>Problem with an order?</h2>
        <p>
          Open the order and tap <strong>Report a problem</strong>. That holds the money while we look into it. See{" "}
          <Link href="/help/disputes">disputes and refunds</Link>.
        </p>
        <h2>Paid someone outside {site.name}?</h2>
        <p>
          Report their ad or profile so we can stop them, and contact your bank straight away. You can also email{" "}
          <a href={`mailto:${site.support.email}?subject=Scam%20report`}>{site.support.email}</a> with any details.
        </p>
      </Prose>
    </ContentPage>
  );
}
