import type { Metadata } from "next";
import { ContentPage, Prose } from "@/components/content/ContentPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const n = site.name;
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy policy"
      updated="16 November 2026"
      intro={`What we collect, why, and the choices you have. ${site.owner.legalName} is responsible for your data on ${n}, in line with the Nigeria Data Protection Act 2023.`}
    >
      <Prose>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Account details:</strong> your name, email, phone number (if you add it) and password (stored scrambled, never readable).</li>
          <li><strong>What you post:</strong> ads, photos, reviews, reports and messages, including chat photos and call records (who called and how long; we don&apos;t record calls).</li>
          <li><strong>Verification (sellers who verify):</strong> your BVN or NIN check result, the name on your ID record, a live selfie check result, and your bank account details for payouts. We keep a protected fingerprint of your ID number to stop it being used on two accounts.</li>
          <li><strong>Orders:</strong> what you bought or sold, amounts, payment and payout records.</li>
          <li><strong>Technical:</strong> device and browser details, IP address, and rough location (state) to show ads near you. Your chosen state is saved on your device.</li>
        </ul>

        <h2>Why we use it</h2>
        <ul>
          <li>To run {n}: your account, ads, chat, calls, orders, payouts and refunds.</li>
          <li>To keep people safe: checking ads for scams, verifying sellers, reviewing reports and disputes, and preventing fraud.</li>
          <li>To contact you about your account and orders, for example when someone messages you or pays.</li>
          <li>To meet legal duties, such as financial and anti-fraud rules.</li>
        </ul>

        <h2>Who can see it</h2>
        <ul>
          <li><strong>Other users</strong> see your public profile: name, city, member since, ratings and your live ads. We never show your email, phone or bank details.</li>
          <li><strong>Our team</strong> can see chats and orders when handling a report or dispute.</li>
          <li>
            <strong>Service providers</strong> who help us run {n}, only for that purpose: identity verification, our payment and banking partner, email
            delivery, and cloud hosting. Some may store data outside Nigeria with appropriate safeguards.
          </li>
          <li><strong>Authorities</strong>, when the law requires it.</li>
        </ul>
        <p>We don&apos;t sell your personal data.</p>

        <h2>How long we keep it</h2>
        <p>
          We keep your data while your account is open. After you close it, we keep what the law requires (for example payment and order records) and
          anything needed to prevent fraud, then delete or anonymise the rest.
        </p>

        <h2>Your rights</h2>
        <p>
          You can ask to see, correct, download or delete your data, or object to how we use it. Email{" "}
          <a href={`mailto:${site.support.email}?subject=Privacy%20request`}>{site.support.email}</a> from your account&apos;s email address. You can also
          complain to the Nigeria Data Protection Commission.
        </p>

        <h2>Security</h2>
        <p>
          We use encryption in transit, keep sign-in tokens out of reach of page scripts, store passwords and sensitive codes scrambled, and limit staff
          access. No system is perfect: tell us straight away if you think your account has been misused.
        </p>

        <h2>Cookies</h2>
        <p>We use a small number of essential cookies and device storage to keep you signed in, remember your state and saved items, and keep the site secure. We don&apos;t use advertising cookies.</p>

        <h2>Changes</h2>
        <p>We&apos;ll update this page when things change, and tell you about important changes.</p>
      </Prose>
    </ContentPage>
  );
}
