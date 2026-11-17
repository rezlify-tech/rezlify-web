"use client";

import Form from "next/form";
import { useState } from "react";
import { FilterSelect, type SelectGroup, type SelectOption } from "@/components/ui/FilterSelect";
import { rootCategories } from "@/lib/mock/categories";
import { brandsBySubcategory, conditions, pricePresets } from "@/lib/mock/filters";
import { states } from "@/lib/mock/locations";
import { cn } from "@/lib/utils";

const categoryGroups: SelectGroup[] = rootCategories.map((root) => ({
  label: root.name,
  options: root.children.map((sub) => ({ id: sub.slug, label: sub.name })),
}));

const conditionOptions: SelectOption[] = conditions.map((c) => ({ id: c.value, label: c.label }));
const stateOptions: SelectOption[] = states.map((s) => ({ id: s.slug, label: s.name }));

const field =
  "h-11 w-full rounded-[10px] border border-line-strong bg-card px-3 text-sm text-ink placeholder:text-subtle transition-colors hover:border-ink/25 focus:border-ink/40 focus:outline-none focus:ring-4 focus:ring-ink/5";

/**
 * Guided filters: category, brand (depends on category), price, condition, location.
 * A plain GET form to /search, so the result page URL can be shared.
 */
export function QuickFinder({ className }: { className?: string }) {
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [state, setState] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const brands = brandsBySubcategory[category] ?? [];
  const brandOptions: SelectOption[] = brands.map((b) => ({ id: b, label: b }));

  function applyPreset(p: { min?: number; max?: number }) {
    setMin(p.min ? String(p.min) : "");
    setMax(p.max ? String(p.max) : "");
  }

  const activePreset = pricePresets.findIndex((p) => String(p.min ?? "") === min && String(p.max ?? "") === max);

  return (
    <section
      aria-labelledby="quick-finder-title"
      className={cn("rounded-[20px] border border-line bg-card p-4 shadow-[var(--shadow-card)] sm:p-5", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="quick-finder-title" className="text-base font-extrabold tracking-[-0.01em]">
          Find it fast
        </h2>
        <p className="hidden text-xs text-subtle sm:block">Pick what you need, we&apos;ll show matching items.</p>
      </div>

      <Form action="/search" className="mt-3">
        <div className="grid grid-flow-row-dense grid-cols-2 gap-3 lg:grid-flow-row lg:grid-cols-[1.35fr_1fr_1.5fr_1fr_1fr_auto] lg:items-end">
          <FilterSelect
            className="col-span-2 lg:col-span-1"
            label="Category"
            name="category"
            placeholder="All categories"
            anyOption="All categories"
            value={category}
            onChange={(v) => {
              setCategory(v);
              setBrand("");
            }}
            groups={categoryGroups}
          />

          <FilterSelect
            label="Brand"
            name="brand"
            placeholder={brands.length ? "Any brand" : "Pick a category"}
            value={brand}
            onChange={setBrand}
            options={brandOptions}
            isDisabled={brands.length === 0}
          />

          <div className="col-span-2 lg:col-span-1">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Price (₦)</span>
            <div className="flex items-center gap-2">
              <label htmlFor="qf-min" className="sr-only">
                Minimum price
              </label>
              <input
                id="qf-min"
                name="min_price"
                inputMode="numeric"
                placeholder="Min"
                value={min}
                onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
                className={field}
              />
              <span className="text-subtle">–</span>
              <label htmlFor="qf-max" className="sr-only">
                Maximum price
              </label>
              <input
                id="qf-max"
                name="max_price"
                inputMode="numeric"
                placeholder="Max"
                value={max}
                onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
                className={field}
              />
            </div>
          </div>

          <FilterSelect
            label="Condition"
            name="condition"
            placeholder="Any condition"
            anyOption="Any condition"
            value={condition}
            onChange={setCondition}
            options={conditionOptions}
          />

          <FilterSelect
            className="col-span-2 lg:col-span-1"
            label="Location"
            name="state"
            placeholder="All Nigeria"
            anyOption="All Nigeria"
            value={state}
            onChange={setState}
            options={stateOptions}
          />

          <button
            type="submit"
            className="col-span-2 inline-flex h-11 items-center justify-center rounded-[10px] bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-ink-3 lg:col-span-1"
          >
            Show items
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {pricePresets.map((p, i) => (
            <button
              key={p.label}
              type="button"
              aria-pressed={activePreset === i}
              onClick={() => (activePreset === i ? applyPreset({}) : applyPreset(p))}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                activePreset === i
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-card text-muted hover:border-ink/30 hover:text-ink",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Form>
    </section>
  );
}
