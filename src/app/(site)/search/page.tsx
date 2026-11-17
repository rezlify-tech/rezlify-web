import type { Metadata } from "next";
import Link from "next/link";
import { ListingGrid } from "@/components/listing/ListingCard";
import { FiltersPanel } from "@/components/search/FiltersPanel";
import { MobileFilters } from "@/components/search/MobileFilters";
import { Pagination } from "@/components/search/Pagination";
import { SortSelect } from "@/components/search/SortSelect";
import { LoadError } from "@/components/ui/LoadError";
import { searchListings } from "@/lib/server/listings";
import {
  FILTER_KEYS,
  filterLabel,
  findCategory,
  parseFilters,
  toQueryString,
  type SearchFilters,
} from "@/lib/search-params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function headingFor(filters: SearchFilters) {
  if (filters.q) return `Results for “${filters.q}”`;
  return findCategory(filters.category)?.name ?? "All items";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  return {
    title: filters.q ? `${filters.q} for sale` : (findCategory(filters.category)?.name ?? "Search"),
    // Filter combinations shouldn't be indexed; category pages will be.
    robots: { index: false, follow: true },
  };
}

const popular = ["iPhone", "Laptop", "Inverter", "PS5", "Textbooks", "Generator"];

function EmptyState({ hasFilters, q }: { hasFilters: boolean; q?: string }) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-dashed border-line-strong bg-card px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sand text-subtle">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5M8 10.5h5" />
        </svg>
      </span>
      <h2 className="mt-5 text-lg font-extrabold tracking-[-0.01em]">Nothing matches yet</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted">
        {hasFilters ? "Try removing a filter or widening your price range." : "Try a different word or check the spelling."}
      </p>
      {hasFilters ? (
        <Link
          href={`/search${toQueryString({ q })}`}
          className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-3"
        >
          Clear filters
        </Link>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {popular.map((term) => (
          <Link
            key={term}
            href={`/search?q=${encodeURIComponent(term)}`}
            className="rounded-full border border-line bg-card px-3 py-1 text-sm text-ink-3 transition-colors hover:border-ink/30 hover:text-ink"
          >
            {term}
          </Link>
        ))}
      </div>
    </div>
  );
}

function pageFrom(raw: string | string[] | undefined) {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n > 1 ? n : 1;
}

export default async function SearchPage({ searchParams }: Props) {
  const raw = await searchParams;
  const filters = parseFilters(raw);
  const data = await searchListings(filters, pageFrom(raw.page));
  const results = data?.results ?? [];
  const total = data?.total ?? 0;

  const pageHref = (n: number) => {
    const qs = toQueryString(filters);
    if (n <= 1) return `/search${qs}`;
    return `/search${qs ? `${qs}&` : "?"}page=${n}`;
  };

  const active = FILTER_KEYS.filter((k) => k !== "sort" && filters[k]) as (keyof SearchFilters)[];
  const removeHref = (key: keyof SearchFilters) => {
    const next: SearchFilters = { ...filters, [key]: undefined };
    if (key === "category") next.brand = undefined;
    return `/search${toQueryString(next)}`;
  };

  return (
    <div className="container-x py-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-8">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-[20px] border border-line bg-card p-5 shadow-[var(--shadow-card)]">
            <FiltersPanel />
          </div>
        </aside>

        <div className="min-w-0">
          {/* Results header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">{headingFor(filters)}</h1>
              <p className="mt-1 text-sm text-muted">
                {data ? `${total.toLocaleString("en-NG")} ${total === 1 ? "item" : "items"} found` : "\u00a0"}
              </p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <MobileFilters total={total} />
              <SortSelect className="flex-1 sm:w-56 sm:flex-none" />
            </div>
          </div>

          {/* Active filters */}
          {active.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {active.map((key) => (
                <Link
                  key={key}
                  href={removeHref(key)}
                  scroll={false}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-card py-1 pl-3 pr-2 text-sm text-ink-3 transition-colors hover:border-ink/30"
                >
                  {filterLabel(key, filters[key]!)}
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-subtle transition-colors group-hover:bg-sand group-hover:text-ink">
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                      <path d="m4 4 8 8M12 4l-8 8" />
                    </svg>
                    <span className="sr-only">Remove filter</span>
                  </span>
                </Link>
              ))}
              {active.length > 1 ? (
                <Link
                  href={`/search${toQueryString({ q: filters.q })}`}
                  scroll={false}
                  className="px-1 text-sm font-semibold text-ink underline-offset-4 hover:underline"
                >
                  Clear all
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6">
            {data === null ? (
              <LoadError retryHref={pageHref(pageFrom(raw.page))} />
            ) : results.length ? (
              <>
                <ListingGrid listings={results} className="md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" />
                <Pagination page={data.page} lastPage={data.lastPage} hrefFor={pageHref} className="mt-8" />
              </>
            ) : (
              <EmptyState hasFilters={active.some((k) => k !== "q")} q={filters.q} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
