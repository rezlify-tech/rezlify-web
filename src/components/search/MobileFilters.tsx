"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FiltersPanel } from "./FiltersPanel";
import { useFilters } from "./useFilters";

/** "Filters" button for phones and tablets that opens the filters in a bottom sheet. */
export function MobileFilters({ total }: { total: number }) {
  const [open, setOpen] = useState(false);
  const { activeCount } = useFilters();

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-4 text-sm font-semibold text-ink transition-colors hover:border-ink/30 lg:hidden"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M3 5.5h14M6 10h8M8.5 14.5h3" />
        </svg>
        Filters
        {activeCount ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[11px] text-white">{activeCount}</span>
        ) : null}
      </button>

      <div className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")} inert={!open}>
        <button
          type="button"
          aria-label="Close filters"
          onClick={() => setOpen(false)}
          className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          className={cn(
            "absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[24px] bg-card shadow-[var(--shadow-lift)] transition-transform duration-300 ease-out",
            open ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="flex justify-center pb-1 pt-3">
            <span className="h-1.5 w-10 rounded-full bg-line-strong" aria-hidden />
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3">{open ? <FiltersPanel /> : null}</div>
          <div className="border-t border-line p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-ink-3"
            >
              Show {total} {total === 1 ? "item" : "items"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
