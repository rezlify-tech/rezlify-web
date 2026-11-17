/**
 * Shapes the frontend expects from the Laravel API.
 * Laravel's API resources (ListingSummaryResource, ListingDetailResource) return exactly these.
 */

export type ListingStatus = "draft" | "pending_review" | "active" | "sold" | "paused" | "rejected" | "removed";

export type ListingCondition = "brand_new" | "foreign_used" | "nigerian_used" | "refurbished" | "faulty";

export type Photo = {
  url: string;
  width: number | null;
  height: number | null;
  blurhash: string | null;
};

export type SellerSummary = {
  id: string;
  name: string;
  avatarUrl: string | null;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
};

/** What a listing card needs. The full product page gets more. */
export type ListingSummary = {
  id: string;
  slug: string;
  title: string;
  price: number; // kobo
  isNegotiable: boolean;
  condition: ListingCondition;
  brand: string | null; // from the seller's form, e.g. "Apple"
  highlights: string[]; // 2-3 key specs chosen by the API, e.g. ["256GB", "Battery 88%"]
  category: { name: string; slug: string };
  location: { city: string; state: string };
  photo: Photo | null;
  photoCount: number;
  isBoosted: boolean;
  canBuyNow: boolean;
  isSaved: boolean;
  publishedAt: string; // ISO
  seller: SellerSummary;
};

export type SpecRow = { label: string; value: string };

/** Everything the item page needs. */
export type ListingDetail = ListingSummary & {
  description: string;
  photos: Photo[];
  specs: SpecRow[];
  viewsCount: number;
  deliveryOptions: ("meetup" | "seller_delivery")[];
  status: ListingStatus;
  seller: SellerSummary & {
    memberSince: string; // ISO
    activeListings: number;
    city: string;
    state: string;
    shopSlug: string | null;
  };
};
