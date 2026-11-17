import { cookies } from "next/headers";
import { cache } from "react";
import type { ListingSummary } from "@/lib/types";
import { TOKEN_COOKIE, laravel } from "./laravel";

export type SellerProfile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  memberSince: string | null;
  city: string | null;
  state: string | null;
  ratingAvg: number;
  ratingCount: number;
  activeListings: number;
  completedSales: number;
  lastActive: "online" | "today" | "this_week" | "a_while_ago" | null;
  shopSlug: string | null;
};

export type SellerPage = {
  seller: SellerProfile;
  listings: ListingSummary[];
  page: number;
  lastPage: number;
  total: number;
};

export type ReviewPreview = {
  id: number;
  rating: number;
  comment: string | null;
  reviewer: { name: string };
  item: { id: string; slug: string; title: string } | null;
  reply: string | null;
  createdAt: string;
};

/** A seller's public page. "missing" if they don't exist or are suspended, null if the API is down. */
export const getSellerPage = cache(async (id: string, page = 1, sort = "newest"): Promise<SellerPage | "missing" | null> => {
  if (!/^[0-9a-z]{26}$/i.test(id)) return "missing";
  const token = (await cookies()).get(TOKEN_COOKIE)?.value ?? null;
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (sort !== "newest") params.set("sort", sort);

  try {
    const res = await laravel(`/users/${id}?${params}`, { token });
    if (res.status === 404) return "missing";
    if (!res.ok) return null;
    const body = (await res.json()) as {
      data: ListingSummary[];
      seller: SellerProfile;
      meta: { current_page: number; last_page: number; total: number };
    };
    return { seller: body.seller, listings: body.data, page: body.meta.current_page, lastPage: body.meta.last_page, total: body.meta.total };
  } catch {
    return null;
  }
});

/** The newest few reviews, for the profile page. Empty if none or the API is down. */
export async function latestReviews(id: string): Promise<ReviewPreview[]> {
  try {
    const res = await laravel(`/users/${id}/reviews`);
    if (!res.ok) return [];
    const body = (await res.json()) as { data: ReviewPreview[] };
    return body.data.slice(0, 3);
  } catch {
    return [];
  }
}
