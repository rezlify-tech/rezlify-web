"use client";

import Form from "next/form";
import { useCallback, useEffect, useState } from "react";
import { site } from "@/lib/site";
import { FilterSheet } from "./FilterSheet";

const examples = [
  "iPhone 13 Pro 256GB",
  "HP EliteBook laptop",
  "3.5kVA lithium inverter",
  "PS5 Slim",
  "CSC 201 textbook",
  "Samsung Galaxy A55",
  "Generator 2.5kVA",
];

/**
 * Big homepage search. The placeholder cycles through real examples until the visitor starts typing.
 * The Filters button opens category, brand, price, condition and location (keeping what was typed).
 */
export function HeroSearch() {
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const typing = query.length > 0;

  useEffect(() => {
    if (typing) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % examples.length), 2600);
    return () => window.clearInterval(id);
  }, [typing]);

  return (
    <>
    <Form action="/search" role="search" className="group relative w-full">
      <div className="relative flex items-center rounded-[14px] border border-line-strong bg-card p-1.5 shadow-[var(--shadow-card)] transition-[border-color,box-shadow] group-focus-within:border-ink/30 group-focus-within:shadow-[var(--shadow-lift)]">
        <label htmlFor="hero-search" className="sr-only">
          Search {site.name}
        </label>
        <svg
          viewBox="0 0 20 20"
          className="ml-2.5 h-[18px] w-[18px] shrink-0 text-subtle sm:ml-3 sm:h-5 sm:w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="8.75" cy="8.75" r="5.75" />
          <path d="m13 13 4 4" />
        </svg>

        <div className="relative min-w-0 flex-1">
          <input
            id="hero-search"
            name="q"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="peer h-10 w-full bg-transparent px-2.5 text-base text-ink outline-none sm:h-11 sm:px-3 sm:text-[15px]"
          />
          {/* Animated placeholder, hidden as soon as there is text */}
          {!typing ? (
            <span
              key={index}
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-2.5 right-1 flex animate-fade-up items-center overflow-hidden text-[15px] text-subtle sm:left-3"
            >
              <span className="truncate">
                <span className="hidden sm:inline">Try </span>&ldquo;{examples[index]}&rdquo;
              </span>
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-label="Filters"
          aria-haspopup="dialog"
          className="mr-1.5 inline-flex h-10 shrink-0 items-center gap-2 rounded-[10px] px-2.5 text-sm font-semibold text-ink-3 transition-colors hover:bg-sand hover:text-ink sm:h-11 sm:px-3"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M3.5 6h8M15.5 6h1M3.5 14h1M8.5 14h8" />
            <circle cx="13.5" cy="6" r="2" />
            <circle cx="6.5" cy="14" r="2" />
          </svg>
          <span className="hidden sm:inline">Filters</span>
        </button>

        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center rounded-[10px] bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-3 sm:h-11 sm:px-6"
        >
          Search
        </button>
      </div>
    </Form>
    <FilterSheet open={filtersOpen} onClose={closeFilters} query={query} />
    </>
  );
}
