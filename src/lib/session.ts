"use client";

import { useSyncExternalStore } from "react";
import { disconnectLive } from "@/lib/echo";

/**
 * The signed-in user on the website.
 * The token itself lives in an httpOnly cookie (set by /api/auth/*); this store only keeps
 * the user's public details so the header, My ads and sell flow can show the right thing.
 */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  /** They uploaded their own photo (vs. none, or their Google photo). */
  hasUploadedAvatar?: boolean;
  bio?: string | null;
  state?: string | null; // slug
  city?: string | null;
  /** Emails about new chat messages. */
  emailChat?: boolean;
  isVerified: boolean;
  role: "user" | "moderator" | "admin";
  isStaff: boolean; // moderator or admin
  emailVerified: boolean;
  hasPassword: boolean;
  googleLinked: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string; // ISO
};

export type SessionStatus = "loading" | "authenticated" | "guest";

type State = { status: SessionStatus; user: SessionUser | null };

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "AuthError";
  }
}

let state: State = { status: "loading", user: null };
const SERVER_STATE: State = { status: "loading", user: null };
let loadPromise: Promise<SessionUser | null> | null = null;
const listeners = new Set<() => void>();

function setState(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

function load(): Promise<SessionUser | null> {
  if (!loadPromise) {
    loadPromise = fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        const data = res.ok ? await res.json() : null;
        const user: SessionUser | null = data?.user ?? null;
        setState({ status: user ? "authenticated" : "guest", user });
        return user;
      })
      .catch(() => {
        setState({ status: "guest", user: null });
        return null;
      });
  }
  return loadPromise;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (state.status === "loading") void load();
  return () => {
    listeners.delete(listener);
  };
}

function useStore(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

/** Current user, or null (also null while still loading). */
export function useSession(): SessionUser | null {
  return useStore().user;
}

/** "loading" until we know, then "authenticated" or "guest". */
export function useSessionStatus(): SessionStatus {
  return useStore().status;
}

/** Wait until we know whether someone is signed in. */
/** Fetch the signed-in user again (e.g. after verification turns on the Verified badge). */
export function refreshSession(): Promise<SessionUser | null> {
  loadPromise = null;
  return load();
}

export function ensureSession(): Promise<SessionUser | null> {
  return state.status === "loading" ? load() : Promise.resolve(state.user);
}

async function post(path: string, body?: unknown): Promise<SessionUser> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new AuthError("No internet connection. Please check and try again.", 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errors: Record<string, string[]> = data?.errors ?? {};
    const first = Object.values(errors)[0]?.[0];
    throw new AuthError(first ?? data?.message ?? "Something went wrong. Please try again.", res.status, errors);
  }

  const user = data.user as SessionUser;
  loadPromise = Promise.resolve(user);
  setState({ status: "authenticated", user });
  return user;
}

export function signInWithPassword(email: string, password: string) {
  return post("/api/auth/login", { email, password });
}

export function register(input: { name: string; email: string; phone?: string; password: string }) {
  return post("/api/auth/register", input);
}

export function signInWithGoogle(credential: string) {
  return post("/api/auth/google", { credential });
}

export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
  disconnectLive();
  loadPromise = Promise.resolve(null);
  setState({ status: "guest", user: null });
}

/** Run `fn` whenever the signed-in user changes (sign in, sign out). For stores outside React. */
export function onSessionChange(fn: (user: SessionUser | null, status: SessionStatus) => void): () => void {
  const listener = () => fn(state.user, state.status);
  listeners.add(listener);
  if (state.status === "loading") void load();
  else listener();
  return () => {
    listeners.delete(listener);
  };
}

/** Only allow redirects to our own pages. */
export function safeNext(next: string | null | undefined, fallback = "/account/ads") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
