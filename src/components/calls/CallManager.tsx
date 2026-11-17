"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChatAvatar } from "@/components/chat/ChatAvatar";
import { ShieldCheck } from "@/components/ui/Badge";
import {
  acceptCall,
  callStoppedElsewhere,
  clearCallError,
  declineCall,
  hangUp,
  receiveCall,
  toggleMute,
  useCall,
  type IncomingCall,
} from "@/lib/calls";
import { usePrivateChannel } from "@/lib/echo";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

function useTimer(since: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [since]);
  if (!since) return "00:00";
  const secs = Math.max(0, Math.floor((now - since) / 1000));
  const h = Math.floor(secs / 3600);
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return h ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function RoundButton({
  label,
  onClick,
  tone,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  tone: "end" | "accept" | "plain";
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={pressed}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-95",
          tone === "end" && "bg-danger-500 text-white hover:bg-danger-600",
          tone === "accept" && "bg-brand-500 text-white hover:bg-brand-600",
          tone === "plain" && (pressed ? "bg-white text-ink" : "bg-white/12 text-white hover:bg-white/20"),
        )}
      >
        {children}
      </button>
      <span className="text-[11px] font-medium text-white/70">{label}</span>
    </div>
  );
}

const PhoneIcon = ({ down = false }: { down?: boolean }) => (
  <svg viewBox="0 0 24 24" className={cn("h-6 w-6", down && "rotate-[135deg]")} fill="currentColor" aria-hidden>
    <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8Z" />
  </svg>
);

const MicIcon = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    {off ? <path d="m4 4 16 16" /> : null}
  </svg>
);

/**
 * Lives on every page: rings for incoming calls and shows the call panel.
 * Calls keep going while you move around the site.
 */
export function CallManager() {
  const me = useSession();
  const call = useCall();
  const timer = useTimer(call.phase === "active" ? call.answeredAt : null);

  usePrivateChannel(me ? `user.${me.id}` : null, {
    "call.incoming": (e: IncomingCall) => receiveCall(e),
    "call.ended": (e: { callId: number; status: string }) => callStoppedElsewhere(e.callId, "ended", e.status),
    "call.accepted": (e: { callId: number }) => callStoppedElsewhere(e.callId, "answered"),
  });

  // Errors (no microphone, busy…) show as a small notice that clears itself.
  useEffect(() => {
    if (!call.error) return;
    const t = window.setTimeout(clearCallError, 6000);
    return () => window.clearTimeout(t);
  }, [call.error]);

  if (call.error && call.phase === "idle") {
    return (
      <div role="alert" className="fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4">
        <p className="flex max-w-md items-start gap-3 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-[var(--shadow-lift)]">
          {call.error}
          <button type="button" onClick={clearCallError} aria-label="Dismiss" className="text-white/60 hover:text-white">
            ✕
          </button>
        </p>
      </div>
    );
  }

  if (call.phase === "idle" || !call.peer) return null;

  const peer = call.peer;
  const statusText =
    call.phase === "outgoing"
      ? "Ringing…"
      : call.phase === "incoming"
        ? "Incoming voice call"
        : call.phase === "connecting"
          ? "Connecting…"
          : call.phase === "active"
            ? timer
            : call.endedText;

  return (
    <div
      className={cn(
        "fixed z-[70] text-white",
        call.phase === "incoming"
          ? "inset-0 flex items-end justify-center bg-ink/60 p-4 backdrop-blur-sm sm:items-center"
          : "inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-6 sm:right-6",
      )}
    >
      <div
        role="dialog"
        aria-label={`Voice call with ${peer.name}`}
        className={cn(
          "animate-fade-up overflow-hidden rounded-[24px] bg-ink shadow-[0_24px_60px_rgb(0_0_0/0.35)]",
          call.phase === "incoming" ? "w-full max-w-sm p-7" : "w-full p-5 sm:w-[320px]",
        )}
      >
        <div className={cn("flex items-center gap-3", call.phase === "incoming" && "flex-col text-center")}>
          <span className="relative">
            {call.phase === "incoming" || call.phase === "outgoing" ? (
              <span className="absolute inset-0 animate-ping rounded-full bg-white/20" aria-hidden />
            ) : null}
            <ChatAvatar
              name={peer.name}
              url={peer.avatarUrl}
              className={call.phase === "incoming" ? "h-24 w-24 text-2xl" : "h-12 w-12"}
            />
          </span>
          <div className="min-w-0">
            <p className={cn("flex items-center gap-1.5 truncate font-bold", call.phase === "incoming" ? "mt-3 justify-center text-xl" : "text-base")}>
              <span className="truncate">{peer.name}</span>
              {peer.isVerified ? (
                <span className="shrink-0 text-brand-300" title="Verified">
                  <ShieldCheck className="h-4 w-4" tick="#0b0f0e" />
                </span>
              ) : null}
            </p>
            <p className={cn("text-sm tabular-nums", call.phase === "active" ? "font-semibold text-brand-200" : "text-white/70")}>{statusText}</p>
            {call.listingTitle ? (
              <p className="mt-1 truncate text-xs text-white/50">About: {call.listingTitle}</p>
            ) : null}
          </div>
        </div>

        {call.phase === "incoming" ? (
          <div className="mt-8 flex justify-center gap-14">
            <RoundButton label="Decline" tone="end" onClick={declineCall}>
              <PhoneIcon down />
            </RoundButton>
            <RoundButton label="Accept" tone="accept" onClick={acceptCall}>
              <PhoneIcon />
            </RoundButton>
          </div>
        ) : call.phase === "ended" ? null : (
          <div className="mt-5 flex items-start justify-center gap-8">
            <RoundButton label={call.muted ? "Unmute" : "Mute"} tone="plain" pressed={call.muted} onClick={toggleMute}>
              <MicIcon off={call.muted} />
            </RoundButton>
            <RoundButton label={call.phase === "outgoing" ? "Cancel" : "End"} tone="end" onClick={() => void hangUp()}>
              <PhoneIcon down />
            </RoundButton>
          </div>
        )}

        {call.phase !== "incoming" && call.conversationId ? (
          <Link href={`/messages/${call.conversationId}`} className="mt-4 block text-center text-xs font-semibold text-white/60 hover:text-white">
            Open chat
          </Link>
        ) : null}
      </div>
    </div>
  );
}
