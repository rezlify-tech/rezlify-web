"use client";

import type { ListingStatus, ListingSummary } from "@/lib/types";

/**
 * The signed-in seller's own ads, through our /api/me/listings routes
 * (which add the login token and call Laravel).
 */

export type MyListing = ListingSummary & {
  status: ListingStatus;
  rejectionReason: string | null;
  viewsCount: number;
  createdAt: string;
};

export type MyTab = "all" | "pending" | "active" | "paused" | "sold";

export type MyCounts = Record<MyTab, number>;

export type MyListingsPage = {
  ads: MyListing[];
  counts: MyCounts;
  page: number;
  lastPage: number;
};

export class MyListingsError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "MyListingsError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { Accept: "application/json", ...init?.headers }, cache: "no-store" });
  } catch {
    throw new MyListingsError("No internet connection. Please check and try again.", 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new MyListingsError(body?.message ?? "Something went wrong. Please try again.", res.status);
  return body as T;
}

export async function fetchMyListings(tab: MyTab, page = 1): Promise<MyListingsPage> {
  const params = new URLSearchParams({ tab });
  if (page > 1) params.set("page", String(page));

  const body = await request<{
    data: MyListing[];
    counts: MyCounts;
    meta: { current_page: number; last_page: number };
  }>(`/api/me/listings?${params}`);

  return { ads: body.data, counts: body.counts, page: body.meta.current_page, lastPage: body.meta.last_page };
}

export async function setListingStatus(
  id: string,
  status: "sold" | "paused" | "active",
  soldVia?: "rezlify" | "elsewhere",
): Promise<MyListing> {
  const body = await request<{ data: MyListing }>(`/api/me/listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, sold_via: soldVia }),
  });
  return body.data;
}

export async function deleteListing(id: string): Promise<void> {
  await request(`/api/me/listings/${id}`, { method: "DELETE" });
}
