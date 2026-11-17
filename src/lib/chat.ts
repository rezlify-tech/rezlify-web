"use client";

import { useEffect, useState } from "react";
import { socketId, usePrivateChannel } from "@/lib/echo";

/**
 * Chat with the Laravel API, through our own /api routes (which add the login token).
 */

export type ChatListing = {
  id: string;
  slug: string;
  title: string;
  price: number; // kobo
  status: string;
  isAvailable: boolean;
  photoUrl: string | null;
};

export type ChatUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  isVerified: boolean;
  lastSeenAt: string | null;
};

export type Conversation = {
  id: number;
  role: "buying" | "selling";
  listing: ChatListing | null;
  otherUser: ChatUser;
  lastMessage: { preview: string; isMine: boolean; createdAt: string } | null;
  unread: boolean;
  theirLastReadId: number | null;
  iBlockedThem: boolean;
  updatedAt: string;
};

export type ChatMessage = {
  id: number;
  type: "text" | "image" | "offer" | "system";
  body: string | null;
  image: { url: string; width: number | null; height: number | null } | null;
  /** Voice call notes: "Missed voice call", "Voice call · 02:34". */
  call: { status: string; durationSeconds: number; callerId: string | null } | null;
  /** Buy now updates ("Paid…", "Order complete…"): a note that links to the order. */
  order?: { id: string; status: string | null } | null;
  /** The message this one replies to, shown as a quote. */
  replyTo: { id: number; senderId: string; preview: string } | null;
  /** Deleted for everyone: body and image are empty. */
  deleted: boolean;
  /** From the API: you can still delete this one (your own, recent). */
  canDelete?: boolean;
  senderId: string;
  isMine: boolean;
  flagged: boolean;
  createdAt: string;
};

export type InboxFilter = "all" | "buying" | "selling" | "unread";

export class ChatError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Record<string, string[]> = {},
    /** A machine-readable reason from the API, e.g. "email_unverified". */
    public code?: string,
  ) {
    super(message);
    this.name = "ChatError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    const sid = socketId();
    res = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...(sid ? { "X-Socket-ID": sid } : {}), ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ChatError("No internet connection. Please check and try again.", 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errors: Record<string, string[]> = body?.errors ?? {};
    const first = Object.values(errors)[0]?.[0];
    throw new ChatError(first ?? body?.message ?? "Something went wrong. Please try again.", res.status, errors, body?.code);
  }
  return body as T;
}

const json = (data: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export async function fetchInbox(filter: InboxFilter = "all") {
  const res = await request<{ data: Conversation[]; unreadTotal: number }>(`/api/conversations?filter=${filter}`);
  return { conversations: res.data, unreadTotal: res.unreadTotal };
}

export async function fetchThread(id: number, opts: { before?: number; after?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.before) params.set("before", String(opts.before));
  if (opts.after) params.set("after", String(opts.after));
  return request<{ conversation: Conversation; messages: ChatMessage[]; hasMore: boolean }>(`/api/conversations/${id}?${params}`);
}

export async function startConversation(listingId: string, body: string) {
  const res = await request<{ data: Conversation }>("/api/conversations", json({ listing_id: listingId, body }));
  return res.data;
}

export async function sendText(id: number, body: string, replyTo?: number) {
  const res = await request<{ data: ChatMessage }>(`/api/conversations/${id}/messages`, json({ body, reply_to: replyTo }));
  return res.data;
}

export async function sendPhoto(id: number, file: File, caption?: string, replyTo?: number) {
  const data = new FormData();
  data.set("image", await shrink(file), "photo.jpg");
  if (caption?.trim()) data.set("body", caption.trim());
  if (replyTo) data.set("reply_to", String(replyTo));
  const res = await request<{ data: ChatMessage }>(`/api/conversations/${id}/messages`, { method: "POST", body: data });
  return res.data;
}

/** Delete your own message for everyone (within an hour of sending). */
export async function deleteMessage(conversationId: number, messageId: number) {
  const res = await request<{ data: ChatMessage }>(`/api/conversations/${conversationId}/messages/${messageId}`, { method: "DELETE" });
  return res.data;
}

/** How long after sending you can delete for everyone (matches the API's CHAT_UNSEND_MINUTES). */
export const UNSEND_MINUTES = 60;

export function canDeleteMessage(m: ChatMessage, now = Date.now()) {
  return (
    m.isMine &&
    !m.deleted &&
    (m.type === "text" || m.type === "image") &&
    now - new Date(m.createdAt).getTime() < UNSEND_MINUTES * 60_000
  );
}

export async function markRead(id: number) {
  await request(`/api/conversations/${id}/read`, { method: "POST" });
}

export async function blockUser(userId: string) {
  await request(`/api/users/${userId}/block`, { method: "POST" });
}

export async function unblockUser(userId: string) {
  await request(`/api/users/${userId}/block`, { method: "DELETE" });
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await request<{ count: number }>("/api/conversations/unread-count");
  return res.count;
}

/** Make a photo smaller before sending (max 1600px, JPEG). Keeps the original if the browser can't. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/* ------------------------------ shared helpers ------------------------------ */

/** "Online", "Active 5 min ago", "Active yesterday" … */
export function presence(lastSeenAt: string | null, now = Date.now()): string | null {
  if (!lastSeenAt) return null;
  const mins = Math.floor((now - new Date(lastSeenAt).getTime()) / 60_000);
  if (mins < 3) return "Online";
  if (mins < 60) return `Active ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Active ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Active yesterday";
  if (days < 7) return `Active ${days} days ago`;
  return null;
}

/** Runs `fn` every `ms` while the tab is visible (and once when it comes back into view). */
export function usePolling(fn: () => void, ms: number, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === "visible") fn();
    };
    const timer = window.setInterval(tick, ms);
    const onVisible = () => {
      if (document.visibilityState === "visible") fn();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fn, ms, enabled]);
}

/** The unread chats count for the header badge: updates live, and checks every 30 seconds as a backup. */
export function useUnreadCount(userId: string | null): number {
  const [count, setCount] = useState(0);
  const enabled = userId !== null;

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = () =>
      fetchUnreadCount()
        .then((n) => alive && setCount(n))
        .catch(() => undefined);
    void load();
    const timer = window.setInterval(() => document.visibilityState === "visible" && load(), 30_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("rezlify:chat-read", onFocus);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("rezlify:chat-read", onFocus);
    };
  }, [enabled]);

  // Live: a new message or a read in another tab changes the count.
  const refresh = () => {
    fetchUnreadCount()
      .then(setCount)
      .catch(() => undefined);
  };
  usePrivateChannel(userId ? `user.${userId}` : null, {
    "message.sent": refresh,
    "conversation.read": refresh,
  });

  return enabled ? count : 0;
}

/** Tell the header badge to refresh (after opening a chat). */
export function notifyChatRead() {
  window.dispatchEvent(new Event("rezlify:chat-read"));
}
