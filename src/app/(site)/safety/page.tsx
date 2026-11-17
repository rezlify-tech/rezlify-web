import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, CtaBox, Prose, TrustNote } from "@/components/content/ContentPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Safety tips",
  description: `How to buy and sell safely on ${site.name}, and how to spot a scam.`,
  alternates: { canonical: "/safety" },
};

const redFlags = [
  "Asks you to pay a deposit, \"logistics fee\" or \"customs fee\" before you see the item.",
  "Wants you to pay into a personal account or Opay/Palmpay instead of using Buy now.",
  "Moves the chat to WhatsApp or Telegram straight away.",
  "Price is far below what everyone else is charging.",
  "Pressure: \"many people want it, pay now or lose it\".",
  "Asks for your release code before you have the item.",
  "Asks for your password, OTP, BVN or card details.",
];

export default function SafetyPage() {
  return (
    <ContentPage eyebrow="Stay safe" title="Safety tips" intro="Most scams follow the same few patterns. Know them and you'll spot them straight away.">
      <TrustNote>
        The safest way to pay is Buy now: {site.name} holds your money until you confirm you&apos;ve got the item. <Link href="/how-it-works" className="font-semibold underline">How it works</Link>
      </TrustNote>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold tracking-[-0.01em]">Red flags</h2>
        <ul className="mt-4 space-y-2">
          {redFlags.map((f) => (
            <li key={f} className="flex gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger-50 text-xs font-bold text-danger-600">!</span>
              {f}
            </li>
          ))}
        </ul>
      </section>

      <Prose className="mt-10">
        <h2>When buying</h2>
        <ul>
          <li>Use Buy now whenever you can. Never send money to a stranger before you&apos;ve seen the item.</li>
          <li>Meet in a busy public place in the daytime: a mall, a bank, a busy café. Bring someone along for expensive items.</li>
          <li>Check the item properly before you pay or share your release code. Turn it on, test it, compare serial numbers.</li>
          <li>For phones: make sure iCloud or the Google account is signed out, and that the IMEI on the box matches the phone (dial *#06#).</li>
          <li>Keep the conversation in {site.name} chat. It&apos;s your proof if something goes wrong.</li>
        </ul>

        <h2>When selling</h2>
        <ul>
          <li>Don&apos;t hand over the item until the order says Paid. A screenshot of a transfer is not proof of payment.</li>
          <li>At a meetup, take the buyer&apos;s release code and enter it before you leave.</li>
          <li>Never pay anyone to &quot;receive&quot; money, and never share an OTP.</li>
          <li>Be wary of buyers who overpay and ask for the difference back.</li>
        </ul>

        <h2>If something feels wrong</h2>
        <p>
          Stop, don&apos;t pay, and <Link href="/report">report it</Link>. You can report an ad from its page, a person from their profile, or a message by
          pressing and holding it in chat. If you&apos;re in danger, contact the police first.
        </p>
      </Prose>

      <CtaBox title="Seen something suspicious?" body="Reports are anonymous. Our team checks every one." href="/report" label="Report a scam" />
    </ContentPage>
  );
}
