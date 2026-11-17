"use client";

/**
 * Buy now orders, through our /api/orders routes (which add the login token and call Laravel).
 * Amounts are in kobo.
 */

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "handed_over"
  | "confirmed"
  | "released"
  | "disputed"
  | "cancelled"
  | "refunded";

export type DeliveryMethod = "meetup" | "seller_delivery";

export type DisputeReason = "not_received" | "not_as_described" | "damaged" | "fake" | "other";

export type Order = {
  id: string;
  reference: string;
  role: "buying" | "selling";
  status: OrderStatus;
  listing: { id: string; slug: string; title: string; photoUrl: string | null };
  otherUser: { id: string; name: string; avatarUrl: string | null; isVerified: boolean };
  quantity: number;
  itemAmount: number;
  feeAmount?: number; // seller only
  sellerAmount?: number; // seller only
  deliveryMethod: DeliveryMethod;
  deliveryNote: string | null;
  payment: {
    accountNumber: string;
    bankName: string;
    accountName: string | null;
    amount: number;
    expiresAt: string | null;
  } | null;
  releaseCode: string | null; // buyer only, before confirming
  actions: {
    pay: boolean;
    cancel: boolean;
    handOver: boolean;
    enterCode: boolean;
    refund: boolean;
    confirm: boolean;
    dispute: boolean;
    review: boolean; // buyer can rate (or change their rating)
    replyToReview: boolean; // seller can answer the buyer's review
  };
  review: { id: number; rating: number; comment: string | null; reply: string | null; createdAt: string } | null;
  dispute: {
    reason: DisputeReason;
    reasonLabel: string;
    description: string;
    status: string;
    resolutionNote: string | null;
    openedAt: string;
    resolvedAt: string | null;
  } | null;
  payout: { status: "pending" | "processing" | "successful" | "failed"; sentAt: string | null } | null;
  paidAt: string | null;
  handedOverAt: string | null;
  autoReleaseAt: string | null;
  confirmedAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export const deliveryLabels: Record<DeliveryMethod, string> = {
  meetup: "Meet in person",
  seller_delivery: "Seller delivers",
};

export const disputeReasons: { id: DisputeReason; label: string }[] = [
  { id: "not_received", label: "I didn't get the item" },
  { id: "not_as_described", label: "It's not as described" },
  { id: "damaged", label: "It arrived damaged" },
  { id: "fake", label: "It's fake or a copy" },
  { id: "other", label: "Something else" },
];

type Tone = "neutral" | "amber" | "success" | "danger" | "dark";

/** Short status label for each side, and a colour. Green only where money is safely done. */
export function statusFor(order: Pick<Order, "status" | "role">): { label: string; tone: Tone } {
  const selling = order.role === "selling";
  switch (order.status) {
    case "pending_payment":
      return { label: selling ? "Waiting for payment" : "Awaiting your payment", tone: "amber" };
    case "paid":
      return { label: selling ? "Paid · hand it over" : "Paid · held safely", tone: "dark" };
    case "handed_over":
      return { label: selling ? "Handed over" : "Check your item", tone: "dark" };
    case "confirmed":
      return { label: selling ? "Payout on the way" : "Confirmed", tone: "neutral" };
    case "released":
      return { label: selling ? "Paid out" : "Completed", tone: "success" };
    case "disputed":
      return { label: "Problem reported", tone: "danger" };
    case "refunded":
      return { label: "Refunded", tone: "neutral" };
    case "cancelled":
      return { label: "Cancelled", tone: "neutral" };
  }
}

export class OrderError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Record<string, string[]> = {},
    /** A machine-readable reason from the API, e.g. "email_unverified". */
    public code?: string,
  ) {
    super(message);
    this.name = "OrderError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { Accept: "application/json", ...init?.headers }, cache: "no-store" });
  } catch {
    throw new OrderError("No internet connection. Please check and try again.", 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errors: Record<string, string[]> = body?.errors ?? {};
    const first = Object.values(errors)[0]?.[0];
    throw new OrderError(first ?? body?.message ?? "Something went wrong. Please try again.", res.status, errors, body?.code);
  }
  return body as T;
}

function post<T>(url: string, data?: unknown): Promise<T> {
  return request<T>(url, {
    method: "POST",
    headers: data === undefined ? undefined : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}

export async function placeOrder(input: { listingId: string; delivery: DeliveryMethod; note?: string }): Promise<Order> {
  const body = await post<{ data: Order }>("/api/orders", {
    listing_id: input.listingId,
    delivery_method: input.delivery,
    delivery_note: input.note?.trim() || undefined,
  });
  return body.data;
}

export async function fetchOrder(id: string): Promise<Order> {
  return (await request<{ data: Order }>(`/api/orders/${id}`)).data;
}

export type OrdersPage = { orders: Order[]; page: number; lastPage: number };

export async function fetchMyOrders(role: "buying" | "selling", page = 1): Promise<OrdersPage> {
  const params = new URLSearchParams({ role });
  if (page > 1) params.set("page", String(page));
  const body = await request<{ data: Order[]; meta: { current_page: number; last_page: number } }>(`/api/me/orders?${params}`);
  return { orders: body.data, page: body.meta.current_page, lastPage: body.meta.last_page };
}

export type OrderAction = "cancel" | "simulate-payment" | "handed-over" | "confirm" | "refund";

export async function orderAction(id: string, action: OrderAction): Promise<Order> {
  return (await post<{ data: Order }>(`/api/orders/${id}/${action}`)).data;
}

export async function enterReleaseCode(id: string, code: string): Promise<Order> {
  return (await post<{ data: Order }>(`/api/orders/${id}/release-code`, { code })).data;
}

export async function reportProblem(id: string, reason: DisputeReason, description: string): Promise<Order> {
  return (await post<{ data: Order }>(`/api/orders/${id}/dispute`, { reason, description })).data;
}

export async function leaveReview(id: string, rating: number, comment: string): Promise<void> {
  await post(`/api/orders/${id}/review`, { rating, comment: comment.trim() || undefined });
}

export async function replyToReview(reviewId: number, reply: string): Promise<void> {
  await post(`/api/reviews/${reviewId}/reply`, { reply: reply.trim() });
}
