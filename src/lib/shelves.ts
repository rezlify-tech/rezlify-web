import type { SearchFilters } from "@/lib/search-params";

/**
 * The tabs on the homepage shelves, in order. The id matches the API's /listings/shelves keys,
 * and each is a normal search, so "See all" opens the same list on the search page.
 */
export type Shelf = { id: string; label: string; filters: SearchFilters };

export const shelves: Shelf[] = [
  { id: "hot", label: "In demand", filters: { sort: "hot" } },
  { id: "popular", label: "Trending", filters: { sort: "popular" } },
  { id: "new", label: "Just listed", filters: { sort: "newest" } },
  { id: "protected", label: "Buy now", filters: { buy_now: "1" } },
  { id: "bargains", label: "Under ₦50k", filters: { max_price: "50000", sort: "newest" } },
  { id: "verified", label: "Verified sellers", filters: { verified: "1" } },
];

/** A shelf with fewer items than this is hidden, so the section always looks full. */
export const MIN_SHELF_ITEMS = 4;
