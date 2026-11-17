import { Logo, LogoMark } from "@/components/brand/Logo";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Badge, ConditionBadge, ShieldCheck, VerifiedBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ListingGrid, ListingGridSkeleton } from "@/components/listing/ListingCard";
import { mockListings } from "@/lib/mock/listings";

/**
 * TEMPORARY brand preview. Replaced by the real homepage in a later step.
 */

const swatches = [
  { name: "Primary green", token: "primary / brand-500", hex: "#054F31", className: "bg-brand-500" },
  { name: "Green mid", token: "brand-400", hex: "#3A8A60", className: "bg-brand-400" },
  { name: "Green soft", token: "brand-200", hex: "#A3CDB4", className: "bg-brand-200" },
  { name: "Green tint", token: "brand-50", hex: "#EAF4EE", className: "bg-brand-50" },
  { name: "Coin gold", token: "coin", hex: "#F5B52E", className: "bg-coin" },
  { name: "Buy now amber", token: "amber-500", hex: "#F5A524", className: "bg-amber-500" },
  { name: "Ink", token: "ink", hex: "#0B0F0E", className: "bg-ink" },
  { name: "Error red", token: "danger-500", hex: "#E5484D", className: "bg-danger-500" },
  { name: "Line", token: "line", hex: "#E7E5DF", className: "bg-line" },
  { name: "Warm white", token: "paper", hex: "#FAFAF7", className: "bg-paper" },
];

export default function BrandPreview() {
  return (
    <>
      <Header />
    <main className="container-x py-10 sm:py-14">
      <Badge tone="amber">Brand preview, temporary page</Badge>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Header when signed in</h2>
        <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-line shadow-[var(--shadow-card)]">
          <Header user={{ name: "Test User", unreadMessages: 3 }} className="static" />
        </div>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            Buy it.
            <br />
            <span className="text-brand-600">No wahala.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
            Phones, laptops, books, generators and more from verified sellers. Your money is held safely until you
            confirm your item.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="#" size="lg">
              Start selling
            </ButtonLink>
            <ButtonLink href="#" size="lg" variant="outline">
              Browse listings
            </ButtonLink>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 rounded-[var(--radius-card)] border border-line bg-card p-10 shadow-[var(--shadow-card)]">
          <LogoMark className="h-24 w-24" />
          <div className="grid gap-3">
            <Logo />
            <div className="rounded-xl bg-ink p-3">
              <Logo tone="dark" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Colours</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {swatches.map((s) => (
            <div key={s.token} className="overflow-hidden rounded-xl border border-line bg-card">
              <div className={`h-16 ${s.className}`} />
              <div className="p-3">
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="text-xs text-muted">
                  {s.token} · {s.hex}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Buttons</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button>Post an ad</Button>
          <Button variant="buy">Buy now</Button>
          <Button variant="dark">Chat with seller</Button>
          <Button variant="outline">Save</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Report listing</Button>
          <Button loading>Saving</Button>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Badges</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <VerifiedBadge />
          <ConditionBadge condition="brand_new" />
          <ConditionBadge condition="foreign_used" />
          <ConditionBadge condition="nigerian_used" />
          <ConditionBadge condition="faulty" />
          <Badge tone="amber">Boosted</Badge>
          <Badge tone="success">
            <ShieldCheck className="h-3.5 w-3.5" />
            Payment secured
          </Badge>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Listing cards</h2>
        <ListingGrid listings={mockListings} className="mt-4" />
      </section>

      <section className="mt-16">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Loading state</h2>
        <div className="mt-4">
          <ListingGridSkeleton count={4} />
        </div>
      </section>
    </main>
      <Footer />
    </>
  );
}
