import Link from "next/link";
import { HeroSearch } from "./HeroSearch";
import { ParticleField } from "./ParticleField";
import { site } from "@/lib/site";

const popular = [
  "iPhone",
  "Laptop",
  "Inverter",
  "PS5",
  "Textbooks",
  "Generator",
];

/** Light banner with the headline, search and the interactive particle field. */
export function HeroBanner() {
  return (
    <section className="relative isolate overflow-hidden rounded-[20px] border border-line bg-card shadow-[var(--shadow-card)]">
      {/* Background: soft green glow + interactive green particles */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-24 -top-32 h-[420px] w-[560px] rounded-full bg-[radial-gradient(closest-side,var(--color-brand-100),transparent)]" />
        <div className="absolute -bottom-48 left-1/4 h-[360px] w-[520px] rounded-full bg-[radial-gradient(closest-side,var(--color-brand-50),transparent)]" />
        <ParticleField colorVar="--color-brand-500" />
        {/* Keep the left side calm behind the text */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-card)_0%,color-mix(in_oklab,var(--color-card)_75%,transparent)_40%,transparent_72%)]" />
      </div>

      <div className="relative px-5 py-7 sm:px-10 sm:py-10 lg:py-12">
        <h1 className="animate-fade-up text-[36px] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-[56px]">
          {site.headline.lead}{" "}
          <span className="text-primary">{site.headline.accent}</span>
        </h1>

        <p
          className="animate-fade-up mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base"
          style={{ animationDelay: "80ms" }}
        >
          Phones, laptops, books, generators and more. Pay on {site.name} and
          <i className="text-primary"> your money is held until you confirm.</i>
        </p>

        <div
          className="animate-fade-up mt-6 max-w-lg"
          style={{ animationDelay: "160ms" }}
        >
          <HeroSearch />
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-subtle">Popular:</span>
            {popular.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-line bg-card/80 px-3 py-1 text-sm text-ink-3 backdrop-blur-sm transition-colors hover:border-ink/30 hover:text-ink"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
