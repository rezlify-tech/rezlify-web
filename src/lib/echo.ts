"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { useEffect, useRef, useState } from "react";

/**
 * One live connection to Reverb for the whole tab.
 * Turned off (and the chat falls back to checking every few seconds)
 * when NEXT_PUBLIC_REVERB_APP_KEY isn't set.
 */

type EchoInstance = Echo<"reverb">;

let echo: EchoInstance | null = null;
let connected = false;
const statusListeners = new Set<(on: boolean) => void>();

export const liveEnabled = Boolean(process.env.NEXT_PUBLIC_REVERB_APP_KEY);

function setConnected(on: boolean) {
  connected = on;
  statusListeners.forEach((l) => l(on));
}

export function getEcho(): EchoInstance | null {
  if (!liveEnabled || typeof window === "undefined") return null;
  if (echo) return echo;

  (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http";
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? (scheme === "https" ? 443 : 8080));

  echo = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY!,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? "localhost",
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
    // Our own route adds the login token and asks Laravel (the token never reaches the browser).
    authEndpoint: "/api/broadcasting/auth",
  });

  const pusher = (echo.connector as unknown as { pusher: Pusher }).pusher;
  pusher.connection.bind("state_change", (states: { current: string }) => setConnected(states.current === "connected"));
  setConnected(pusher.connection.state === "connected");

  return echo;
}

/** The live connection's ID, so Laravel doesn't echo our own actions back to this tab. */
export function socketId(): string | undefined {
  return echo?.socketId() ?? undefined;
}

/** True while the live connection is up. */
export function useLiveConnected(): boolean {
  const [on, setOn] = useState(connected);
  useEffect(() => {
    getEcho();
    statusListeners.add(setOn);
    setOn(connected);
    return () => {
      statusListeners.delete(setOn);
    };
  }, []);
  return on;
}

type Handlers = Record<string, (payload: never) => void>;

/** How many components are listening to each channel, so we only leave when the last one goes. */
const subscribers = new Map<string, number>();

/**
 * Listen to a private channel while the component is on screen.
 * `events` uses Laravel's broadcastAs() names, e.g. { "message.sent": (e) => … }.
 * `whispers` are browser-to-browser signals such as "typing".
 * Returns a function to send a whisper on the same channel.
 */
export function usePrivateChannel(
  name: string | null,
  events: Handlers,
  whispers: Handlers = {},
): (event: string, data: unknown) => void {
  // Keep the latest handlers without re-subscribing on every render.
  const eventsRef = useRef(events);
  const whispersRef = useRef(whispers);
  useEffect(() => {
    eventsRef.current = events;
    whispersRef.current = whispers;
  });

  const channelRef = useRef<ReturnType<EchoInstance["private"]> | null>(null);
  const eventNames = Object.keys(events).join("|");
  const whisperNames = Object.keys(whispers).join("|");

  useEffect(() => {
    const e = getEcho();
    if (!e || !name) return;

    const channel = e.private(name);
    channelRef.current = channel;
    subscribers.set(name, (subscribers.get(name) ?? 0) + 1);

    const added: { event: string; whisper: boolean; fn: (p: never) => void }[] = [];
    for (const event of eventNames.split("|").filter(Boolean)) {
      const fn = (payload: never) => eventsRef.current[event]?.(payload);
      channel.listen(`.${event}`, fn);
      added.push({ event, whisper: false, fn });
    }
    for (const event of whisperNames.split("|").filter(Boolean)) {
      const fn = (payload: never) => whispersRef.current[event]?.(payload);
      channel.listenForWhisper(event, fn);
      added.push({ event, whisper: true, fn });
    }

    return () => {
      channelRef.current = null;
      // Only remove our own listeners; others (e.g. the header badge) may share this channel.
      for (const a of added) {
        if (a.whisper) channel.stopListeningForWhisper(a.event, a.fn);
        else channel.stopListening(`.${a.event}`, a.fn);
      }
      const left = (subscribers.get(name) ?? 1) - 1;
      if (left <= 0) {
        subscribers.delete(name);
        e.leave(name);
      } else {
        subscribers.set(name, left);
      }
    };
  }, [name, eventNames, whisperNames]);

  return (event, data) => {
    try {
      (channelRef.current as unknown as { whisper: (e: string, d: unknown) => void } | null)?.whisper(event, data);
    } catch {
      /* not connected: whispers are best-effort */
    }
  };
}

/** Close the live connection (on sign-out). */
export function disconnectLive() {
  echo?.disconnect();
  echo = null;
  setConnected(false);
}
