"use client";

import { useState } from "react";
import { FilterSelect, type SelectGroup, type SelectOption } from "@/components/ui/FilterSelect";
import { rootCategories } from "@/lib/mock/categories";
import { brandsBySubcategory, conditions, pricePresets } from "@/lib/mock/filters";
import { states } from "@/lib/mock/locations";
import { cn } from "@/lib/utils";
import { useFilters } from "./useFilters";

const categoryGroups: SelectGroup[] = rootCategories.map((root) => ({
  label: root.name,
  options: [
    { id: root.slug, label: `All ${root.name}` },
    ...root.children.map((sub) => ({ id: sub.slug, label: sub.name })),
  ],
}));

const stateOptions: SelectOption[] = states.map((s) => ({ id: s.slug, label: s.name }));

const input =
  "h-11 w-full rounded-[10px] border border-line-strong bg-card px-3 text-sm text-ink placeholder:text-subtle transition-colors hover:border-ink/25 focus:border-ink/40 focus:outline-none focus:ring-4 focus:ring-ink/5";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-5 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-subtle">{title}</h3>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-ink bg-ink text-white" : "border-line bg-card text-muted hover:border-ink/30 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl px-1 py-1.5 text-left"
    >
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-ink" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

/** Min/max price, applied when the visitor presses Enter or leaves the field. */
function PriceRange({ min, max, onApply }: { min?: string; max?: string; onApply: (min?: string, max?: string) => void }) {
  const [lo, setLo] = useState(min ?? "");
  const [hi, setHi] = useState(max ?? "");

  const apply = () => {
    if ((lo || undefined) !== min || (hi || undefined) !== max) onApply(lo || undefined, hi || undefined);
  };

  const activePreset = pricePresets.findIndex((p) => String(p.min ?? "") === (min ?? "") && String(p.max ?? "") === (max ?? ""));

  return (
    <div>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <label htmlFor="f-min" className="sr-only">
          Minimum price
        </label>
        <input
          id="f-min"
          inputMode="numeric"
          placeholder="Min ₦"
          value={lo}
          onChange={(e) => setLo(e.target.value.replace(/\D/g, ""))}
          onBlur={apply}
          className={input}
        />
        <span className="text-subtle">–</span>
        <label htmlFor="f-max" className="sr-only">
          Maximum price
        </label>
        <input
          id="f-max"
          inputMode="numeric"
          placeholder="Max ₦"
          value={hi}
          onChange={(e) => setHi(e.target.value.replace(/\D/g, ""))}
          onBlur={apply}
          className={input}
        />
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {pricePresets.map((p, i) => (
          <Chip
            key={p.label}
            active={activePreset === i}
            onClick={() =>
              activePreset === i
                ? onApply(undefined, undefined)
                : onApply(p.min ? String(p.min) : undefined, p.max ? String(p.max) : undefined)
            }
          >
            {p.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function FiltersPanel({ className }: { className?: string }) {
  const { current, update, clearAll, activeCount } = useFilters();
  const brands = brandsBySubcategory[current.category ?? ""] ?? [];

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold tracking-[-0.01em]">Filters</h2>
        {activeCount > 0 ? (
          <button type="button" onClick={clearAll} className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
            Clear all ({activeCount})
          </button>
        ) : null}
      </div>

      <Section title="Category">
        <FilterSelect
          label="Category"
          hideLabel
          name="category"
          placeholder="All categories"
          anyOption="All categories"
          value={current.category ?? ""}
          onChange={(v) => update({ category: v || undefined })}
          groups={categoryGroups}
        />
        {brands.length ? (
          <FilterSelect
            className="mt-3"
            label="Brand"
            hideLabel
            name="brand"
            placeholder="Any brand"
            anyOption="Any brand"
            value={current.brand ?? ""}
            onChange={(v) => update({ brand: v || undefined })}
            options={brands.map((b) => ({ id: b, label: b }))}
          />
        ) : null}
      </Section>

      <Section title="Price">
        <PriceRange
          key={`${current.min_price ?? ""}-${current.max_price ?? ""}`}
          min={current.min_price}
          max={current.max_price}
          onApply={(min, max) => update({ min_price: min, max_price: max })}
        />
      </Section>

      <Section title="Condition">
        <div className="flex flex-wrap gap-2">
          {conditions.map((c) => (
            <Chip
              key={c.value}
              active={current.condition === c.value}
              onClick={() => update({ condition: current.condition === c.value ? undefined : c.value })}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Location">
        <FilterSelect
          label="Location"
          hideLabel
          name="state"
          placeholder="All Nigeria"
          anyOption="All Nigeria"
          value={current.state ?? ""}
          onChange={(v) => update({ state: v || undefined })}
          options={stateOptions}
        />
      </Section>

      <Section title="Safety">
        <div className="space-y-2">
          <Toggle
            label="Verified sellers only"
            hint="ID-checked sellers"
            checked={current.verified === "1"}
            onChange={(v) => update({ verified: v ? "1" : undefined })}
          />
          <Toggle
            label="Buy now available"
            hint="Pay safely, money held until you confirm"
            checked={current.buy_now === "1"}
            onChange={(v) => update({ buy_now: v ? "1" : undefined })}
          />
        </div>
      </Section>
    </div>
  );
}
