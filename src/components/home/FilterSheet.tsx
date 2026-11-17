"use client";

import Form from "next/form";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
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
  "h-12 w-full rounded-[10px] border border-line-strong bg-card px-3 text-base text-ink placeholder:text-subtle transition-colors hover:border-ink/25 focus:border-ink/40 focus:outline-none focus:ring-4 focus:ring-ink/5 sm:h-11 sm:text-sm";

const noop = () => () => {};

/**
 * The homepage filters: full screen on phones, a centred box on computers.
 * Rendered straight into <body>, so animated parents (like the banner) can't trap it.
 * A plain GET form to /search (with whatever was typed in the search box), so the results can be shared.
 */
export function FilterSheet({ open, onClose, query }: { open: boolean; onClose: () => void; query: string }) {
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [state, setState] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const brands = brandsBySubcategory[category] ?? [];
  const brandOptions: SelectOption[] = brands.map((b) => ({ id: b, label: b }));
  const activePreset = pricePresets.findIndex((p) => String(p.min ?? "") === min && String(p.max ?? "") === max);
  const chosen = [category, brand, condition, state, min, max].filter(Boolean).length;
  // Only after the page has loaded in the browser (portals need document.body).
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open, onClose]);

  function reset() {
    setCategory("");
    setBrand("");
    setCondition("");
    setState("");
    setMin("");
    setMax("");
  }

  if (!mounted) return null;

  return createPortal(
    <div className={cn("fixed inset-0 z-[60]", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open} inert={!open}>
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
        className={cn(
          // Phones: the whole screen, sliding up.
          "absolute inset-0 flex h-[100dvh] w-full flex-col bg-card transition-transform duration-300",
          // Computers: a centred box.
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[86dvh] sm:max-w-lg sm:-translate-x-1/2 sm:rounded-[24px] sm:shadow-[var(--shadow-lift)] sm:transition-[opacity,transform]",
          open ? "translate-y-0 sm:-translate-y-1/2 sm:opacity-100" : "translate-y-full sm:-translate-y-[40%] sm:opacity-0",
        )}
      >
        <Form action="/search" className="flex min-h-0 flex-1 flex-col" onSubmit={onClose}>
          {query.trim() ? <input type="hidden" name="q" value={query.trim()} /> : null}

          <div className="flex shrink-0 items-center justify-between border-b border-line px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-5 sm:py-4">
            <h2 id="filter-sheet-title" className="text-lg font-extrabold tracking-[-0.01em]">
              Filters
            </h2>
            <div className="flex items-center gap-1">
              {chosen ? (
                <button type="button" onClick={reset} className="h-9 rounded-[10px] px-3 text-sm font-semibold text-muted hover:bg-sand hover:text-ink">
                  Clear
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-3 hover:bg-sand hover:text-ink"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="m5 5 10 10M15 5 5 15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:space-y-4 sm:px-5">
            {query.trim() ? (
              <p className="rounded-xl bg-sand px-3 py-2 text-sm text-ink-3">
                Searching for <span className="font-semibold text-ink">&ldquo;{query.trim()}&rdquo;</span>
              </p>
            ) : null}

            <FilterSelect
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
              placeholder={brands.length ? "Any brand" : "Pick a category first"}
              anyOption={brands.length ? "Any brand" : undefined}
              value={brand}
              onChange={setBrand}
              options={brandOptions}
              isDisabled={brands.length === 0}
            />

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-muted">Price (₦)</span>
              <div className="flex items-center gap-2">
                <label htmlFor="fs-min" className="sr-only">
                  Minimum price
                </label>
                <input
                  id="fs-min"
                  name="min_price"
                  inputMode="numeric"
                  placeholder="Min"
                  value={min}
                  onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
                  className={field}
                />
                <span className="text-subtle">–</span>
                <label htmlFor="fs-max" className="sr-only">
                  Maximum price
                </label>
                <input
                  id="fs-max"
                  name="max_price"
                  inputMode="numeric"
                  placeholder="Max"
                  value={max}
                  onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
                  className={field}
                />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {pricePresets.map((p, i) => (
                  <button
                    key={p.label}
                    type="button"
                    aria-pressed={activePreset === i}
                    onClick={() => {
                      const on = activePreset === i;
                      setMin(on || !p.min ? "" : String(p.min));
                      setMax(on || !p.max ? "" : String(p.max));
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      activePreset === i ? "border-ink bg-ink text-white" : "border-line bg-card text-muted hover:border-ink/30 hover:text-ink",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FilterSelect label="Condition" name="condition" placeholder="Any" anyOption="Any condition" value={condition} onChange={setCondition} options={conditionOptions} />
              <FilterSelect label="Location" name="state" placeholder="All Nigeria" anyOption="All Nigeria" value={state} onChange={setState} options={stateOptions} />
            </div>
          </div>

          <div className="shrink-0 border-t border-line px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 sm:px-5 sm:pt-4">
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-ink-3"
            >
              Show items
            </button>
          </div>
        </Form>
      </div>
    </div>,
    document.body,
  );
}
