"use client";

export type Review = {
  id: number;
  rating: number;
  comment: string | null;
  reviewer: { name: string; avatarUrl: string | null };
  item: { id: string; slug: string; title: string } | null;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
};

export type ReviewSummary = { average: number; count: number; stars: Record<"1" | "2" | "3" | "4" | "5", number> };

export type ReviewsPage = { reviews: Review[]; summary: ReviewSummary; page: number; lastPage: number };

export async function fetchSellerReviews(sellerId: string, page = 1): Promise<ReviewsPage> {
  let res: Response;
  try {
    res = await fetch(`/api/users/${sellerId}/reviews${page > 1 ? `?page=${page}` : ""}`, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("No internet connection. Please try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? "We couldn't load reviews.");
  return { reviews: body.data, summary: body.summary, page: body.meta.current_page, lastPage: body.meta.last_page };
}
