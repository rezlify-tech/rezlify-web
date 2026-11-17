"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StartChatSheet } from "@/components/chat/StartChatSheet";
import { ShieldCheck } from "@/components/ui/Badge";
import { toggleSaved, useIsSaved } from "@/lib/saved";
import { useSessionStatus } from "@/lib/session";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  title: string;
  canBuyNow: boolean;
  initialSaved: boolean;
  /** The signed-in user posted this ad: show "manage" instead of chat and buy. */
  isOwner?: boolean;
  /** "panel" for the desktop/side panel, "bar" for the sticky mobile bar. */
  variant?: "panel" | "bar";
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", filled && "text-danger-500")} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3.5v11M7.5 8 12 3.5 16.5 8" />
      <path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" />
    </svg>
  );
}

const buyClass =
  "inline-flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-amber-500 px-5 text-[15px] font-bold text-ink transition-colors hover:bg-amber-400";
const chatClass =
  "inline-flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-ink px-5 text-[15px] font-semibold text-white transition-colors hover:bg-ink-3";

/** Compact versions for the sticky mobile bar, so both fit on narrow phones. */
const barBuyClass =
  "inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] bg-amber-500 px-3 text-sm font-bold text-ink transition-colors active:bg-amber-400";
const barChatClass =
  "inline-flex h-11 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-[10px] bg-ink px-3 text-sm font-semibold text-white transition-colors active:bg-ink-3";
const iconBtn =
  "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border border-line-strong bg-card text-ink-3 transition-colors hover:border-ink/30 hover:text-ink";

export function ItemActions({ listingId, title, canBuyNow, initialSaved, isOwner = false, variant = "panel" }: Props) {
  const saved = useIsSaved(listingId, initialSaved);
  const [shared, setShared] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const session = useSessionStatus();
  const router = useRouter();

  function openChat() {
    if (session === "guest") {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setChatOpen(true);
  }

  const sheet = <StartChatSheet listingId={listingId} title={title} open={chatOpen} onClose={() => setChatOpen(false)} />;

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      /* user cancelled */
    }
  }

  const buyHref = `/checkout/${listingId}`;

  if (isOwner) {
    return variant === "bar" ? (
      <Link href="/account/ads" className={cn(barChatClass, "w-full")}>
        Manage in My ads
      </Link>
    ) : (
      <div className="rounded-2xl bg-sand p-4 text-sm">
        <p className="font-bold">This is your ad</p>
        <p className="mt-0.5 text-xs text-muted">Buyers&apos; messages show up in Messages.</p>
        <div className="mt-3 flex gap-2">
          <Link href="/account/ads" className="inline-flex h-10 flex-1 items-center justify-center rounded-[10px] bg-ink text-sm font-semibold text-white hover:bg-ink-3">
            Manage in My ads
          </Link>
          <Link href="/messages" className="inline-flex h-10 flex-1 items-center justify-center rounded-[10px] border border-line-strong bg-card text-sm font-semibold hover:bg-paper">
            Messages
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "bar") {
    return (
      <div className="flex gap-2">
        <button type="button" onClick={openChat} className={barChatClass}>
          Chat
        </button>
        {canBuyNow ? (
          <Link href={buyHref} className={barBuyClass}>
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            Buy now
          </Link>
        ) : null}
        {sheet}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {canBuyNow ? (
        <Link href={buyHref} className={cn(buyClass, "w-full")}>
          <ShieldCheck className="h-4 w-4" />
          Buy now
        </Link>
      ) : null}
      <div className="flex gap-2">
        <button type="button" onClick={openChat} className={chatClass}>
          Chat with seller
        </button>
        <button type="button" aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save"} onClick={() => void toggleSaved(listingId, saved)} className={iconBtn}>
          <HeartIcon filled={saved} />
        </button>
        <button type="button" aria-label="Share" onClick={share} className={iconBtn}>
          <ShareIcon />
        </button>
      </div>
      {shared ? <p className="text-center text-xs font-medium text-muted">Link copied</p> : null}
      {sheet}
    </div>
  );
}
