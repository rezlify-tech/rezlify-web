"use client";

import { useSyncExternalStore } from "react";
import { onSessionChange, type SessionStatus } from "@/lib/session";

/**
 * Which ads the signed-in person has saved, shared by every heart on the page.
 * Loaded once per sign-in from /api/me/saved/ids, so hearts are right even on cached
 * pages (like the homepage shelves). Taps update instantly and roll back if the call fails.
 */

type State = { ready: boolean; ids: ReadonlySet<string> };

const EMPTY: State = { ready: false, ids: new Set() };
let state: State = EMPTY;
let status: SessionStatus = "loading";
let userId: string | null = null;
let started = false;
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

async function loadIds() {
  try {
    const res = await fetch("/api/me/saved/ids", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return set({ ready: true, ids: new Set() });
    const body = (await res.json()) as { data: string[] };
    set({ ready: true, ids: new Set(body.data) });
  } catch {
    /* offline: keep what the page said */
  }
}

function start() {
  if (started) return;
  started = true;
  onSessionChange((user, s) => {
    status = s;
    if (s === "loading") return;
    const id = user?.id ?? null;
    if (id === userId && state.ready) return;
    userId = id;
    if (id) {
      void loadIds();
    } else {
      set({ ready: true, ids: new Set() });
    }
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

/** Is this ad saved? Uses the page's own answer until the real list has loaded. */
export function useIsSaved(listingId: string, initial: boolean): boolean {
  const s = useSyncExternalStore(subscribe, () => state, () => EMPTY);
  return s.ready ? s.ids.has(listingId) : initial;
}

/** All saved ids (for the Saved page, so removed items disappear at once). */
export function useSavedIds(): State {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

/**
 * Save or unsave. Signed-out visitors are sent to sign in and come back to the same page.
 * Returns false if it didn't go through.
 */
export async function toggleSaved(listingId: string, currentlySaved: boolean): Promise<boolean> {
  start();
  if (status === "guest") {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return false;
  }

  const before = state;
  const ids = new Set(state.ids);
  if (currentlySaved) ids.delete(listingId);
  else ids.add(listingId);
  set({ ready: true, ids });

  try {
    const res = await fetch(`/api/listings/${listingId}/save`, {
      method: currentlySaved ? "DELETE" : "POST",
      headers: { Accept: "application/json" },
    });
    if (res.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }
    if (!res.ok) throw new Error();
    return true;
  } catch {
    set(before);
    return false;
  }
}
