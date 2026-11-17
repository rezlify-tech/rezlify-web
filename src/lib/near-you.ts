"use client";

import { useSyncExternalStore } from "react";
import { states } from "@/lib/mock/locations";

/**
 * The visitor's state for the "Near you" shelf, kept on this device (no account needed).
 *  - First visit: we guess it from their connection (/api/geo) and say so ("We think you're in Lagos").
 *  - They can change it any time; a state they pick themselves always wins and is never re-guessed.
 */

const KEY = "rz_state";
const SOURCE_KEY = "rz_state_source"; // "picked" | "detected"
const CHECKED_KEY = "rz_state_checked"; // we've already tried guessing on this device

export type NearState = { slug: string; detected: boolean } | null;

const listeners = new Set<() => void>();
let snapshot: NearState = null;
let snapshotKey = "";

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read(): NearState {
  const s = storage();
  const slug = s?.getItem(KEY) ?? null;
  const source = s?.getItem(SOURCE_KEY) ?? "picked";
  const key = `${slug}|${source}`;
  // Same answer → same object, so React doesn't re-render for nothing.
  if (key !== snapshotKey) {
    snapshotKey = key;
    snapshot = slug && states.some((st) => st.slug === slug) ? { slug, detected: source === "detected" } : null;
  }
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => (e.key === KEY || e.key === SOURCE_KEY) && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function save(slug: string | null, source: "picked" | "detected") {
  const s = storage();
  if (s) {
    if (slug) {
      s.setItem(KEY, slug);
      s.setItem(SOURCE_KEY, source);
    } else {
      s.removeItem(KEY);
      s.removeItem(SOURCE_KEY);
    }
  }
  listeners.forEach((l) => l());
}

/** The visitor's state (always null on the server). */
export function useNearState(): NearState {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** They chose it themselves. */
export function setNearState(slug: string | null) {
  save(slug, "picked");
}

let detecting = false;

/** Guess the state once per device, only if they haven't got one yet. */
export async function detectNearState(): Promise<void> {
  const s = storage();
  if (detecting || !s || s.getItem(KEY) || s.getItem(CHECKED_KEY)) return;
  detecting = true;
  try {
    const res = await fetch("/api/geo", { cache: "no-store" });
    const body = res.ok ? ((await res.json()) as { state: string | null }) : { state: null };
    s.setItem(CHECKED_KEY, "1");
    // Don't overwrite a choice they made while we were checking.
    if (body.state && !s.getItem(KEY) && states.some((st) => st.slug === body.state)) {
      save(body.state, "detected");
    }
  } catch {
    /* offline: try again next visit */
  } finally {
    detecting = false;
  }
}

export function stateName(slug: string): string {
  return states.find((s) => s.slug === slug)?.name ?? slug;
}

/** Where most buyers are, shown as quick picks. */
export const popularStates = ["lagos", "fct-abuja", "rivers", "oyo", "kano", "ondo"];
