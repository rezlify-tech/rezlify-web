"use client";

import { useSyncExternalStore } from "react";
import { getEcho, liveEnabled, socketId } from "@/lib/echo";

/**
 * In-app voice calls (one at a time per tab).
 *
 * Laravel handles ringing and the call record. The voice goes browser to browser (WebRTC);
 * the two browsers set that up by "whispering" to each other on the private call.{id} channel:
 *   caller ──(rings via Laravel)──▶ callee
 *   callee picks up, then whispers "ready"
 *   caller whispers an "offer", callee whispers an "answer", both whisper network "candidates"
 */

/* --------------------------------- types --------------------------------- */

export type CallPeer = { id: string; name: string; avatarUrl: string | null; isVerified: boolean };

export type CallPhase = "idle" | "outgoing" | "incoming" | "connecting" | "active" | "ended";

export type CallState = {
  phase: CallPhase;
  callId: number | null;
  conversationId: number | null;
  peer: CallPeer | null;
  listingTitle: string | null;
  muted: boolean;
  answeredAt: number | null; // ms, when the voice line connected
  endedText: string | null;
  error: string | null;
};

export type IncomingCall = {
  callId: number;
  conversationId: number;
  listingTitle: string | null;
  caller: CallPeer;
  expiresAt: string;
};

type Signal =
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  | { type: "candidate"; candidate: RTCIceCandidateInit };

const IDLE: CallState = {
  phase: "idle",
  callId: null,
  conversationId: null,
  peer: null,
  listingTitle: null,
  muted: false,
  answeredAt: null,
  endedText: null,
  error: null,
};

const RING_MS = 45_000;

/* --------------------------------- store --------------------------------- */

let state: CallState = IDLE;
const listeners = new Set<() => void>();

function set(patch: Partial<CallState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useCall(): CallState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => IDLE,
  );
}

export const callsAvailable = () =>
  liveEnabled && typeof window !== "undefined" && "RTCPeerConnection" in window && !!navigator.mediaDevices?.getUserMedia;

/* ------------------------------ api helpers ------------------------------ */

async function api<T>(url: string, body?: unknown, keepalive = false): Promise<T> {
  const sid = socketId();
  const res = await fetch(url, {
    method: "POST",
    keepalive,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(sid ? { "X-Socket-ID": sid } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.message ?? "Something went wrong."), { status: res.status });
  return data as T;
}

type CallResponse = { call: { id: number; status: string }; iceServers?: RTCIceServer[] };

/* ------------------------------ the engine ------------------------------ */

type Channel = {
  listen: (event: string, cb: (e: never) => void) => Channel;
  listenForWhisper: (event: string, cb: (e: never) => void) => Channel;
  whisper: (event: string, data: unknown) => Channel;
  subscribed: (cb: () => void) => Channel;
};

let pc: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let channel: Channel | null = null;
let channelName: string | null = null;
let iceServers: RTCIceServer[] = [];
let pendingCandidates: RTCIceCandidateInit[] = [];
let offerSent = false;
let isCaller = false;
let ringTimer: number | undefined;
let dropTimer: number | undefined;
let dismissTimer: number | undefined;
let stopTone: (() => void) | null = null;
const remoteAudio = typeof window !== "undefined" ? new Audio() : null;
if (remoteAudio) remoteAudio.autoplay = true;

function whisper(event: string, data: unknown) {
  try {
    channel?.whisper(event, data);
  } catch {
    /* connection dropped; the call will time out or fail cleanly */
  }
}

async function getMic(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });
  } catch {
    throw new Error("Allow microphone access to make calls. Check your browser's site settings.");
  }
}

function joinCallChannel(callId: number): Promise<void> {
  const echo = getEcho();
  if (!echo) return Promise.reject(new Error("Calls need the live connection. Please refresh and try again."));

  channelName = `call.${callId}`;
  channel = echo.private(channelName) as unknown as Channel;

  channel.listenForWhisper("ready", () => {
    if (isCaller) void sendOffer();
  });
  channel.listenForWhisper("signal", (s: Signal) => void onSignal(s));
  channel.listen(".call.accepted", () => {
    if (isCaller && state.phase === "outgoing") {
      stopRinging();
      set({ phase: "connecting" });
    }
  });
  channel.listen(".call.ended", (e: { status: string }) => finish(textFor(e.status, isCaller)));

  return new Promise((resolve) => {
    let done = false;
    channel!.subscribed(() => {
      if (!done) {
        done = true;
        resolve();
      }
    });
    // Don't hang forever if the "subscribed" signal is slow; whispers will still flow once joined.
    window.setTimeout(() => {
      if (!done) {
        done = true;
        resolve();
      }
    }, 4000);
  });
}

function createPeer() {
  pc = new RTCPeerConnection({ iceServers });
  localStream?.getTracks().forEach((t) => pc!.addTrack(t, localStream!));

  pc.onicecandidate = (e) => {
    if (e.candidate) whisper("signal", { type: "candidate", candidate: e.candidate.toJSON() } satisfies Signal);
  };

  pc.ontrack = (e) => {
    if (remoteAudio) {
      remoteAudio.srcObject = e.streams[0] ?? new MediaStream([e.track]);
      void remoteAudio.play().catch(() => undefined);
    }
  };

  pc.onconnectionstatechange = () => {
    const s = pc?.connectionState;
    if (s === "connected") {
      window.clearTimeout(dropTimer);
      stopRinging();
      if (state.phase !== "active") set({ phase: "active", answeredAt: state.answeredAt ?? Date.now() });
    } else if (s === "disconnected") {
      // Short drops (moving between networks) often recover; give it a moment.
      window.clearTimeout(dropTimer);
      dropTimer = window.setTimeout(() => {
        if (pc?.connectionState !== "connected") void hangUp("connection_failed");
      }, 10_000);
    } else if (s === "failed") {
      void hangUp("connection_failed");
    }
  };
}

async function sendOffer() {
  if (offerSent || !isCaller) return;
  offerSent = true;
  stopRinging();
  if (state.phase === "outgoing") set({ phase: "connecting" });
  createPeer();
  const offer = await pc!.createOffer({ offerToReceiveAudio: true });
  await pc!.setLocalDescription(offer);
  whisper("signal", { type: "offer", sdp: offer.sdp ?? "" } satisfies Signal);
}

async function onSignal(s: Signal) {
  try {
    if (s.type === "offer" && !isCaller) {
      if (!pc) createPeer();
      await pc!.setRemoteDescription({ type: "offer", sdp: s.sdp });
      await flushCandidates();
      const answer = await pc!.createAnswer();
      await pc!.setLocalDescription(answer);
      whisper("signal", { type: "answer", sdp: answer.sdp ?? "" } satisfies Signal);
    } else if (s.type === "answer" && isCaller && pc) {
      await pc.setRemoteDescription({ type: "answer", sdp: s.sdp });
      await flushCandidates();
    } else if (s.type === "candidate") {
      if (pc?.remoteDescription) await pc.addIceCandidate(s.candidate).catch(() => undefined);
      else pendingCandidates.push(s.candidate);
    }
  } catch {
    void hangUp("connection_failed");
  }
}

async function flushCandidates() {
  const list = pendingCandidates;
  pendingCandidates = [];
  for (const c of list) await pc?.addIceCandidate(c).catch(() => undefined);
}

function textFor(status: string, iCalled: boolean): string {
  switch (status) {
    case "declined":
      return iCalled ? "Call declined" : "Call ended";
    case "missed":
      return iCalled ? "No answer" : "Missed call";
    case "cancelled":
      return iCalled ? "Call cancelled" : "Missed call";
    case "failed":
      return "Call dropped";
    default:
      return "Call ended";
  }
}

function cleanup() {
  window.clearTimeout(ringTimer);
  window.clearTimeout(dropTimer);
  stopRinging();
  pc?.getSenders().forEach((s) => s.track?.stop());
  pc?.close();
  pc = null;
  localStream?.getTracks().forEach((t) => t.stop());
  localStream = null;
  if (remoteAudio) remoteAudio.srcObject = null;
  if (channelName) getEcho()?.leave(channelName);
  channel = null;
  channelName = null;
  pendingCandidates = [];
  offerSent = false;
}

/** Show "Call ended" for a moment, then close the call panel. */
function finish(text: string) {
  if (state.phase === "idle" || state.phase === "ended") return;
  cleanup();
  set({ phase: "ended", endedText: text, muted: false });
  window.clearTimeout(dismissTimer);
  dismissTimer = window.setTimeout(() => {
    if (state.phase === "ended") set({ ...IDLE });
  }, 2500);
}

/* ------------------------------- tones ------------------------------- */

/** Simple generated tones, so there are no sound files to load. */
function playTone(kind: "ring" | "ringback") {
  stopRinging();
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const freqs = kind === "ring" ? [440, 480] : [400, 450];
    const oscs = freqs.map((f) => {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      o.connect(gain);
      o.start();
      return o;
    });

    const level = kind === "ring" ? 0.12 : 0.06;
    const beat = () => {
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(level, t);
      gain.gain.setValueAtTime(0, t + 0.4);
      gain.gain.setValueAtTime(level, t + 0.6);
      gain.gain.setValueAtTime(0, t + 1.0);
    };
    beat();
    const timer = window.setInterval(beat, 3000);
    if (kind === "ring") navigator.vibrate?.([400, 200, 400]);

    stopTone = () => {
      window.clearInterval(timer);
      oscs.forEach((o) => o.stop());
      void ctx.close();
      navigator.vibrate?.(0);
      stopTone = null;
    };
  } catch {
    stopTone = null; // no sound available; the screen still shows the call
  }
}

function stopRinging() {
  stopTone?.();
}

/* ------------------------------- actions ------------------------------- */

/** The call's phase right now (not narrowed by earlier checks in the same function). */
function currentPhase(): CallPhase {
  return state.phase;
}

/** Ring the other person in a chat. */
export async function startCall(conversationId: number, peer: CallPeer, listingTitle: string | null) {
  if (state.phase !== "idle" && state.phase !== "ended") return;
  if (!callsAvailable()) {
    set({ ...IDLE, error: "Calls need the live connection and a browser that supports calling." });
    return;
  }

  window.clearTimeout(dismissTimer);
  isCaller = true;
  set({ ...IDLE, phase: "outgoing", conversationId, peer, listingTitle });

  try {
    localStream = await getMic();
    const res = await api<CallResponse>(`/api/conversations/${conversationId}/calls`);
    iceServers = res.iceServers ?? [];
    set({ callId: res.call.id });
    await joinCallChannel(res.call.id);
    // Read fresh: the state may have changed while we waited (e.g. they hung up during setup).
    // (TypeScript would otherwise assume it's still what it was checked as at the top.)
    if (currentPhase() !== "outgoing") return;
    playTone("ringback");

    ringTimer = window.setTimeout(() => {
      if (state.phase === "outgoing") void hangUp("no_answer");
    }, RING_MS);
  } catch (e) {
    cleanup();
    set({ ...IDLE, error: e instanceof Error ? e.message : "Couldn't start the call." });
  }
}

/** Someone is calling you (from the live user channel). */
export function receiveCall(c: IncomingCall) {
  if (state.phase !== "idle" && state.phase !== "ended") return; // already busy in this tab
  window.clearTimeout(dismissTimer);
  isCaller = false;
  set({
    ...IDLE,
    phase: "incoming",
    callId: c.callId,
    conversationId: c.conversationId,
    peer: c.caller,
    listingTitle: c.listingTitle,
  });
  playTone("ring");

  const left = Math.max(1000, new Date(c.expiresAt).getTime() - Date.now());
  ringTimer = window.setTimeout(() => {
    if (state.phase === "incoming" && state.callId === c.callId) finish("Missed call");
  }, left);
}

/** The call stopped ringing elsewhere: the caller gave up, or you answered on another tab or device. */
export function callStoppedElsewhere(callId: number, how: "ended" | "answered", status?: string) {
  if (state.callId !== callId || state.phase !== "incoming") return;
  finish(how === "answered" ? "Answered on another device" : textFor(status ?? "missed", false));
}

export async function acceptCall() {
  if (state.phase !== "incoming" || !state.callId) return;
  const callId = state.callId;
  stopRinging();
  window.clearTimeout(ringTimer);
  set({ phase: "connecting" });

  try {
    localStream = await getMic();
    await joinCallChannel(callId);
    const res = await api<CallResponse>(`/api/calls/${callId}/accept`);
    iceServers = res.iceServers ?? [];
    createPeer();
    whisper("ready", {});
  } catch (e) {
    const gone = (e as { status?: number }).status === 410;
    cleanup();
    if (gone) finish("Missed call");
    else set({ ...IDLE, error: e instanceof Error ? e.message : "Couldn't answer the call." });
    void api(`/api/calls/${callId}/end`, { reason: "connection_failed" }).catch(() => undefined);
  }
}

export async function declineCall() {
  if (state.phase !== "incoming" || !state.callId) return;
  const callId = state.callId;
  finish("Call declined");
  await api(`/api/calls/${callId}/decline`).catch(() => undefined);
}

/** Hang up, cancel while ringing, or give up (no answer / dropped). */
export async function hangUp(reason: "hung_up" | "no_answer" | "connection_failed" = "hung_up") {
  const callId = state.callId;
  if (state.phase === "idle" || state.phase === "ended") return;

  const text =
    reason === "no_answer" ? "No answer" : reason === "connection_failed" ? "Call dropped" : state.phase === "outgoing" ? "Call cancelled" : "Call ended";
  finish(text);
  if (callId) await api(`/api/calls/${callId}/end`, { reason }).catch(() => undefined);
}

export function toggleMute() {
  const muted = !state.muted;
  localStream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
  set({ muted });
}

export function clearCallError() {
  if (state.error) set({ error: null });
}

// Closing or refreshing the tab mid-call ends it for the other person too.
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    if (state.callId && state.phase !== "idle" && state.phase !== "ended") {
      void api(`/api/calls/${state.callId}/end`, { reason: "hung_up" }, true).catch(() => undefined);
    }
  });
}
