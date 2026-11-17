import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ShieldCheck } from "@/components/ui/Badge";
import { site } from "@/lib/site";
import { CurrentYear } from "./CurrentYear";

const columns = [
  {
    title: "Buy",
    links: [
      { label: "Browse all categories", href: "/categories" },
      { label: "How Buy now works", href: "/how-it-works" },
      { label: "Verified sellers", href: "/verified-sellers" },
      { label: "Safety tips", href: "/safety" },
    ],
  },
  {
    title: "Sell",
    links: [
      { label: "Post an ad", href: "/sell" },
      { label: "Get verified", href: "/verify" },
      { label: "Open a shop", href: "/shops/open" },
      { label: "Shop plans", href: "/pricing" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Help centre", href: "/help" },
      { label: "Report a scam", href: "/report" },
      { label: "Disputes and refunds", href: "/help/disputes" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: `About ${site.name}`, href: "/about" },
      { label: "Terms of use", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
    ],
  },
] as const;

const socials = [
  { label: "Instagram", href: site.socials.instagram },
  { label: "TikTok", href: site.socials.tiktok },
  { label: "X", href: site.socials.x },
  { label: "Facebook", href: site.socials.facebook },
] as const;

export function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white">
      {/* Safety line */}
      <div className="border-b border-white/10">
        <div className="container-x flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div>
              <p className="font-semibold">Never pay outside {site.name}.</p>
              <p className="mt-0.5 text-sm text-white/60">
                Use Buy now so your money is held safely until you confirm your
                item.
              </p>
            </div>
          </div>
          <Link
            href="/safety"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-[10px] border border-white/15 px-4 text-sm font-semibold transition-colors hover:bg-white/5"
          >
            Safety tips
          </Link>
        </div>
      </div>

      {/* Links */}
      <div className="container-x grid gap-10 py-12 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <Link
            href="/"
            aria-label={`${site.name} home`}
            className="inline-flex"
          >
            <Logo tone="dark" />
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            {site.description}
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center rounded-[10px] bg-white/5 px-3 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/75 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CurrentYear /> {site.name}. All rights reserved.
          </p>
          <p>
            A{" "}
            <a
              href={site.owner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/75 underline-offset-4 hover:text-white hover:underline"
            >
              {site.owner.name}
            </a>{" "}
            product
          </p>
        </div>
      </div>
    </footer>
  );
}
