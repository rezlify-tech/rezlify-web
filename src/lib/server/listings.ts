import { cookies } from "next/headers";
import { cache } from "react";
import type { SearchFilters } from "@/lib/search-params";
import type { ListingDetail, ListingSummary } from "@/lib/types";
import { TOKEN_COOKIE, laravel } from "./laravel";

/**
 * Listings from the Laravel API, for server components (home, search, item page).
 * Sends the visitor's login token when there is one, so "saved" hearts and
 * owner previews are right. Returns null when the API can't be reached.
 */

export type SearchResult = {
  results: ListingSummary[];
  total: number;
  page: number;
  lastPage: number;
};

export type ListingPage = {
  listing: ListingDetail;
  similar: ListingSummary[];
  isOwner: boolean;
};

type Paginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
};

async function token() {
  return (await cookies()).get(TOKEN_COOKIE)?.value ?? null;
}

export async function searchListings(filters: SearchFilters, page = 1): Promise<SearchResult | null> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));

  try {
    const res = await laravel(`/listings?${params}`, { token: await token() });
    if (!res.ok) return null;
    const body = (await res.json()) as Paginated<ListingSummary>;
    return {
      results: body.data,
      total: body.meta.total,
      page: body.meta.current_page,
      lastPage: body.meta.last_page,
    };
  } catch {
    return null;
  }
}

/** Every homepage shelf in one call (the API caches it for a minute). Null when the API can't be reached. */
export async function homepageShelves(): Promise<Record<string, ListingSummary[]> | null> {
  try {
    const res = await laravel("/listings/shelves");
    if (!res.ok) return null;
    const body = (await res.json()) as { data: Record<string, ListingSummary[]> };
    return body.data;
  } catch {
    return null;
  }
}

/** Newest live ads for the homepage. */
export async function freshListings(limit = 12): Promise<ListingSummary[] | null> {
  const result = await searchListings({ sort: "newest" });
  return result ? result.results.slice(0, limit) : null;
}

/**
 * One listing for the item page. "missing" when it doesn't exist (or isn't public),
 * null when the API can't be reached. Cached per request, so the page and its
 * metadata share one API call.
 */
export const getListing = cache(async (id: string): Promise<ListingPage | "missing" | null> => {
  if (!/^[0-9a-z]{26}$/i.test(id)) return "missing";

  try {
    const res = await laravel(`/listings/${id}`, { token: await token() });
    if (res.status === 404) return "missing";
    if (!res.ok) return null;
    const body = (await res.json()) as { data: ListingDetail; similar: ListingSummary[]; isOwner: boolean };
    return { listing: body.data, similar: body.similar, isOwner: body.isOwner };
  } catch {
    return null;
  }
});
