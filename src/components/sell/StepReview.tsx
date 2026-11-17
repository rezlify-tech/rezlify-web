"use client";

import { ListingCard } from "@/components/listing/ListingCard";
import { formatNaira } from "@/lib/format";
import { categoryFields } from "@/lib/mock/category-fields";
import { rootCategories } from "@/lib/mock/categories";
import { conditions } from "@/lib/mock/filters";
import { states } from "@/lib/mock/locations";
import type { ListingCondition, ListingSummary } from "@/lib/types";
import { StepHeading } from "./Fields";
import type { SellForm } from "./types";

type Props = {
  form: SellForm;
  sellerName: string;
  isVerified: boolean;
  onEdit: (step: number) => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 text-sm last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value || "Not set"}</dd>
    </div>
  );
}

function Block({ title, step, onEdit, children }: { title: string; step: number; onEdit: (s: number) => void; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold">{title}</h3>
        <button type="button" onClick={() => onEdit(step)} className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
          Edit
        </button>
      </div>
      <dl className="mt-2">{children}</dl>
    </section>
  );
}

export function StepReview({ form, sellerName, isVerified, onEdit }: Props) {
  const root = rootCategories.find((c) => c.slug === form.rootCategory);
  const sub = root?.children.find((c) => c.slug === form.category);
  const state = states.find((s) => s.slug === form.state);
  const fields = categoryFields[form.category] ?? [];
  const priceKobo = Number(form.price || 0) * 100;

  const highlights = fields
    .map((f) => form.specs[f.key])
    .filter((v): v is string => !!v && v !== "yes")
    .slice(0, 2);

  const preview: ListingSummary = {
    id: "preview",
    slug: "preview",
    title: form.title || "Your item title",
    price: priceKobo,
    isNegotiable: form.negotiable,
    condition: (form.condition || "brand_new") as ListingCondition,
    brand: form.specs.brand ?? null,
    highlights,
    category: { name: sub?.name ?? "", slug: form.category },
    location: { city: form.city || "City", state: state?.name ?? "State" },
    photo: form.photos[0] ? { url: form.photos[0].url, width: null, height: null, blurhash: null } : null,
    photoCount: form.photos.length,
    isBoosted: false,
    canBuyNow: isVerified,
    isSaved: false,
    publishedAt: new Date().toISOString(),
    seller: { id: "me", name: sellerName, avatarUrl: null, isVerified, ratingAvg: 0, ratingCount: 0 },
  };

  return (
    <div>
      <StepHeading title="Check and post" hint="This is how buyers will see your ad." />

      <div className="grid gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
        <div className="pointer-events-none select-none md:sticky md:top-24 md:self-start" aria-label="Preview of your listing">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-subtle">Preview</p>
          <ListingCard listing={preview} />
        </div>

        <div className="space-y-4">
          <Block title="Category" step={0} onEdit={onEdit}>
            <Row label="Category" value={[root?.name, sub?.name].filter(Boolean).join(" › ")} />
          </Block>

          <Block title="Photos" step={1} onEdit={onEdit}>
            <Row label="Photos added" value={`${form.photos.length}`} />
          </Block>

          <Block title="Details" step={2} onEdit={onEdit}>
            <Row label="Title" value={form.title} />
            <Row label="Condition" value={conditions.find((c) => c.value === form.condition)?.label ?? ""} />
            {fields
              .filter((f) => form.specs[f.key])
              .map((f) => (
                <Row key={f.key} label={f.label.replace(/\s*\(.*\)$/, "")} value={form.specs[f.key] === "yes" ? "Yes" : form.specs[f.key]} />
              ))}
          </Block>

          <Block title="Price and location" step={3} onEdit={onEdit}>
            <Row label="Price" value={priceKobo ? `${formatNaira(priceKobo)}${form.negotiable ? " (negotiable)" : ""}` : ""} />
            <Row label="Quantity" value={form.quantity} />
            <Row label="Location" value={[form.city, state?.name].filter(Boolean).join(", ")} />
            <Row
              label="Delivery"
              value={[form.delivery.meetup && "Meet in person", form.delivery.seller_delivery && "I can deliver"].filter(Boolean).join(", ")}
            />
          </Block>

          <p className="text-xs leading-relaxed text-muted">
            By posting, you confirm the item is yours to sell and follows our rules. Ads with fake items or prices are
            removed, and the seller may be banned.
          </p>
        </div>
      </div>
    </div>
  );
}
