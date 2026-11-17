"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck } from "@/components/ui/Badge";
import { fetchInbox, presence, usePolling, type Conversation, type InboxFilter } from "@/lib/chat";
import { useLiveConnected, usePrivateChannel } from "@/lib/echo";
import { timeAgo } from "@/lib/format";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./ChatAvatar";

const filters: { id: InboxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "buying", label: "Buying" },
  { id: "selling", label: "Selling" },
  { id: "unread", label: "Unread" },
];

function Row({ c, active }: { c: Conversation; active: boolean }) {
  const online = presence(c.otherUser.lastSeenAt) === "Online";

  return (
    <li>
      <Link
        href={`/messages/${c.id}`}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex gap-3 border-b border-line px-4 py-3.5 transition-colors",
          active ? "bg-sand" : "hover:bg-paper",
        )}
      >
        <span className="relative h-12 w-12 shrink-0">
          <span className="block h-12 w-12 overflow-hidden rounded-xl bg-sand">
            {c.listing?.photoUrl ? (
              <Image src={c.listing.photoUrl} alt="" width={48} height={48} className="h-full w-full object-cover" />
            ) : null}
          </span>
          <ChatAvatar name={c.otherUser.name} url={c.otherUser.avatarUrl} online={online} className="absolute -bottom-1.5 -right-1.5 h-6 w-6 text-[9px] ring-2 ring-card rounded-full" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={cn("flex min-w-0 items-center gap-1 truncate text-sm", c.unread ? "font-extrabold text-ink" : "font-semibold text-ink")}>
              <span className="truncate">{c.otherUser.name}</span>
              {c.otherUser.isVerified ? (
                <span className="shrink-0 text-brand-500" title="Verified">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </span>
            <span className="ml-auto shrink-0 text-[11px] text-subtle">{timeAgo(c.updatedAt)}</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            <span className={cn("mr-1 rounded px-1 py-px text-[10px] font-bold uppercase", c.role === "selling" ? "bg-primary-soft text-brand-700" : "bg-sand text-ink-3")}>
              {c.role === "selling" ? "Selling" : "Buying"}
            </span>
            {c.listing?.title ?? "Ad removed"}
          </span>
          <span className="mt-1 flex items-center gap-2">
            <span className={cn("truncate text-[13px]", c.unread ? "font-semibold text-ink" : "text-muted")}>
              {c.lastMessage ? `${c.lastMessage.isMine ? "You: " : ""}${c.lastMessage.preview}` : "No messages yet"}
            </span>
            {c.unread ? <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-danger-500" aria-label="Unread" /> : null}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** The list of chats. On desktop it sits beside the open chat; on phones it's its own screen. */
export function ChatInbox({ selectedId }: { selectedId?: number }) {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [items, setItems] = useState<Conversation[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetchInbox(filter);
      setItems(res.conversations);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load your chats.");
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live: any new message or read reloads the list (bundled, so a burst means one reload).
  const me = useSession();
  const live = useLiveConnected();
  const reloadTimer = useRef<number | undefined>(undefined);
  const soon = () => {
    window.clearTimeout(reloadTimer.current);
    reloadTimer.current = window.setTimeout(() => void load(), 300);
  };
  useEffect(() => () => window.clearTimeout(reloadTimer.current), []);
  usePrivateChannel(me ? `user.${me.id}` : null, { "message.sent": soon, "conversation.read": soon });

  // Backup check, much less often when the live connection is up.
  usePolling(load, live ? 60_000 : 15_000);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line px-4 pb-3 pt-4">
        <h1 className="text-xl font-extrabold tracking-[-0.02em]">Messages</h1>
        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setItems(null);
                setFilter(f.id);
              }}
              className={cn(
                "h-8 shrink-0 rounded-full px-3 text-xs font-semibold transition-colors",
                filter === f.id ? "bg-ink text-white" : "bg-sand text-ink-3 hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {error && !items ? (
          <div className="p-6 text-center">
            <p className="text-sm text-danger-600">{error}</p>
            <button type="button" onClick={load} className="mt-3 text-sm font-semibold underline underline-offset-2">
              Try again
            </button>
          </div>
        ) : items === null ? (
          <ul aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex gap-3 border-b border-line px-4 py-3.5">
                <span className="skeleton h-12 w-12 rounded-xl" />
                <span className="flex flex-1 flex-col gap-2 pt-1">
                  <span className="skeleton h-3.5 w-1/2 rounded" />
                  <span className="skeleton h-3 w-3/4 rounded" />
                </span>
              </li>
            ))}
          </ul>
        ) : items.length ? (
          <ul>
            {items.map((c) => (
              <Row key={c.id} c={c} active={c.id === selectedId} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand text-subtle">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
                <path d="M4.5 6.5A2 2 0 0 1 6.5 4.5h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4.5 3.5v-3.5h0a2 2 0 0 1-1-1.7V6.5Z" />
              </svg>
            </span>
            <p className="mt-4 font-extrabold">{filter === "unread" ? "You're all caught up" : "No chats yet"}</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {filter === "unread" ? "New messages will show up here." : "Find something you like and tap Chat with seller."}
            </p>
            {filter !== "unread" ? (
              <Link href="/search" className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-3">
                Browse items
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
