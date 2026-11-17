import { rootCategories } from "@/lib/mock/categories";
import { conditions } from "@/lib/mock/filters";
import { states } from "@/lib/mock/locations";

/** Every filter the search page understands. All values are strings straight from the URL. */
export type SearchFilters = {
  q?: string;
  category?: string;
  brand?: string;
  min_price?: string; // naira
  max_price?: string; // naira
  condition?: string;
  state?: string;
  verified?: string; // "1"
  buy_now?: string; // "1"
  sort?: string; // newest | hot | popular | price_asc | price_desc
};

export const FILTER_KEYS: (keyof SearchFilters)[] = [
  "q",
  "category",
  "brand",
  "min_price",
  "max_price",
  "condition",
  "state",
  "verified",
  "buy_now",
  "sort",
];

export const sortOptions = [
  { id: "newest", label: "Newest first" },
  { id: "hot", label: "In demand" },
  { id: "popular", label: "Most viewed" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
];

/** Turn Next.js searchParams into clean filters (first value only, trimmed, empties dropped). */
export function parseFilters(raw: Record<string, string | string[] | undefined>): SearchFilters {
  const out: SearchFilters = {};
  for (const key of FILTER_KEYS) {
    const v = raw[key];
    const value = (Array.isArray(v) ? v[0] : v)?.trim();
    if (value) out[key] = value;
  }
  return out;
}

export function toQueryString(filters: SearchFilters): string {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const v = filters[key];
    if (v) params.set(key, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Find a category (root or sub) by slug. */
export function findCategory(slug?: string) {
  if (!slug) return null;
  for (const root of rootCategories) {
    if (root.slug === slug) return { name: root.name, slug: root.slug, children: root.children.map((c) => c.slug) };
    const sub = root.children.find((c) => c.slug === slug);
    if (sub) return { name: sub.name, slug: sub.slug, children: [sub.slug] };
  }
  return null;
}

const naira = new Intl.NumberFormat("en-NG");

/** Human labels for the active-filter chips. */
export function filterLabel(key: keyof SearchFilters, value: string): string {
  switch (key) {
    case "q":
      return `“${value}”`;
    case "category":
      return findCategory(value)?.name ?? value;
    case "min_price":
      return `From ₦${naira.format(Number(value))}`;
    case "max_price":
      return `Up to ₦${naira.format(Number(value))}`;
    case "condition":
      return conditions.find((c) => c.value === value)?.label ?? value;
    case "state":
      return states.find((s) => s.slug === value)?.name ?? value;
    case "verified":
      return "Verified sellers";
    case "buy_now":
      return "Buy now available";
    default:
      return value;
  }
}
