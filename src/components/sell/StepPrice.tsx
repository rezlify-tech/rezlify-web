"use client";

import Link from "next/link";
import { ShieldCheck } from "@/components/ui/Badge";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { states } from "@/lib/mock/locations";
import { cn } from "@/lib/utils";
import { FieldError, StepHeading, Switch } from "./Fields";
import { fieldClass, labelClass, type Errors, type SellForm } from "./types";

type Props = {
  form: SellForm;
  errors: Errors;
  set: <K extends keyof SellForm>(key: K, value: SellForm[K]) => void;
  isVerified: boolean;
};

const grouped = new Intl.NumberFormat("en-NG");

function Check({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
        checked ? "border-ink bg-card ring-1 ring-ink" : "border-line bg-card hover:border-ink/30",
      )}
    >
      <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", checked ? "border-ink bg-ink text-white" : "border-line-strong")}>
        {checked ? (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m3.5 8.5 3 3 6-7" />
          </svg>
        ) : null}
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </button>
  );
}

export function StepPrice({ form, errors, set, isVerified }: Props) {
  const cities = states.find((s) => s.slug === form.state)?.cities ?? [];

  return (
    <div className="space-y-6">
      <StepHeading title="Price and location" hint="Set a fair price. Check similar items if you're not sure." />

      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div>
          <label htmlFor="sell-price" className={labelClass}>
            Price
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-muted">₦</span>
            <input
              id="sell-price"
              inputMode="numeric"
              value={form.price ? grouped.format(Number(form.price)) : ""}
              onChange={(e) => set("price", e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="0"
              className={`${fieldClass} pl-8 text-base font-semibold`}
            />
          </div>
          <FieldError message={errors.price} />
        </div>
        <div>
          <label htmlFor="sell-qty" className={labelClass}>
            Quantity
          </label>
          <input
            id="sell-qty"
            inputMode="numeric"
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value.replace(/\D/g, "").slice(0, 4))}
            className={fieldClass}
          />
          <FieldError message={errors.quantity} />
        </div>
      </div>

      <Switch label="Price is negotiable" hint="Buyers can send you offers in chat." checked={form.negotiable} onChange={(v) => set("negotiable", v)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FilterSelect
            label="State"
            name="state"
            placeholder="Choose state"
            value={form.state}
            onChange={(v) => {
              set("state", v);
              set("city", "");
            }}
            options={states.map((s) => ({ id: s.slug, label: s.name }))}
          />
          <FieldError message={errors.state} />
        </div>
        <div>
          <FilterSelect
            label="City / area"
            name="city"
            placeholder={form.state ? "Choose city" : "Choose a state first"}
            value={form.city}
            onChange={(v) => set("city", v)}
            options={cities.map((c) => ({ id: c, label: c }))}
            isDisabled={!form.state}
          />
          <FieldError message={errors.city} />
        </div>
      </div>

      <div>
        <p className={labelClass}>How can buyers get it?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Check
            checked={form.delivery.meetup}
            onChange={(v) => set("delivery", { ...form.delivery, meetup: v })}
            label="Meet in person"
            hint="Buyer checks the item when you meet."
          />
          <Check
            checked={form.delivery.seller_delivery}
            onChange={(v) => set("delivery", { ...form.delivery, seller_delivery: v })}
            label="I can deliver"
            hint="You send it to the buyer."
          />
        </div>
        <FieldError message={errors.delivery} />
      </div>

      {isVerified ? (
        <p className="flex items-start gap-2 rounded-2xl bg-primary-soft px-4 py-3 text-sm text-brand-700">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          You&apos;re verified, so buyers will see a Buy now button and can pay safely.
        </p>
      ) : (
        <div className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm">
          <p className="font-semibold">Want a Buy now button?</p>
          <p className="mt-0.5 text-muted">
            Verified sellers get Buy now, safe payments and more trust.{" "}
            <Link href="/verify" className="font-semibold text-ink underline underline-offset-4">
              Get verified
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
