"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ShieldCheck } from "@/components/ui/Badge";
import {
  ChatError,
  blockUser,
  canDeleteMessage,
  deleteMessage,
  fetchThread,
  markRead,
  notifyChatRead,
  presence,
  sendPhoto,
  sendText,
  unblockUser,
  usePolling,
  type ChatMessage,
  type Conversation,
} from "@/lib/chat";
import { callsAvailable, startCall, useCall } from "@/lib/calls";
import { usePrivateChannel, useLiveConnected } from "@/lib/echo";
import { formatNaira } from "@/lib/format";
import { listingHref } from "@/lib/listing-url";
import { useSession } from "@/lib/session";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./ChatAvatar";
import { MessageMenu, type MenuAction, type MenuTarget } from "./MessageMenu";

/** A message being sent: shown straight away, swapped for the real one when the server confirms. */
type Pending = {
  tempId: string;
  body: string;
  replyTo?: NonNullable<ChatMessage["replyTo"]>;
  file?: File;
  previewUrl?: string;
  failed?: boolean;
  createdAt: string;
};

const timeFmt = new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long" });

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return dayFmt.format(d);
}

/** "Missed voice call", "Voice call · 02:34": a small centred note instead of a bubble. */
function CallNote({ m, meId }: { m: ChatMessage; meId: string | undefined }) {
  const missed = m.call?.status === "missed" && m.call.callerId !== meId;
  return (
    <div className="flex justify-center">
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1",
          missed ? "bg-danger-50 text-danger-600 ring-danger-500/20" : "bg-card text-ink-3 ring-line",
        )}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8Z" />
        </svg>
        {m.call?.callerId === meId ? m.body?.replace("Missed voice call", "No answer") : m.body}
        <span className="font-normal text-subtle">{timeFmt.format(new Date(m.createdAt))}</span>
      </span>
    </div>
  );
}

/** Buy now updates: a centred card with a link to the order, not a bubble from either person. */
function OrderNote({ m }: { m: ChatMessage }) {
  return (
    <div className="flex justify-center px-2">
      <Link
        href={`/orders/${m.order?.id}`}
        className="block max-w-sm rounded-2xl bg-card px-4 py-3 text-center ring-1 ring-line transition-colors hover:bg-paper"
      >
        <span className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
          Buy now
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-ink-3">{m.body}</span>
        <span className="mt-1.5 block text-xs font-bold text-ink underline underline-offset-2">View order</span>
      </Link>
    </div>
  );
}

/** Short text of a message, for quotes. */
function previewOf(m: ChatMessage): string {
  if (m.deleted) return "Deleted message";
  if (m.image) return m.body ? `Photo: ${m.body}` : "Photo";
  return (m.body ?? "").slice(0, 120);
}

/** The quoted message shown at the top of a reply. */
function Quote({
  reply,
  isMine,
  name,
  onClick,
}: {
  reply: NonNullable<ChatMessage["replyTo"]>;
  isMine: boolean;
  name: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mx-1.5 mt-1.5 block w-[calc(100%-0.75rem)] min-w-40 rounded-xl border-l-[3px] px-2.5 py-1.5 text-left text-[13px] leading-snug",
        isMine ? "border-white/60 bg-white/10 text-white/80 hover:bg-white/15" : "border-brand-500 bg-sand text-ink-3 hover:bg-line",
      )}
    >
      <span className={cn("block text-xs font-bold", isMine ? "text-white" : "text-ink")}>{name}</span>
      <span className="line-clamp-2">{reply.preview}</span>
    </button>
  );
}

/** Press and hold (phones) without moving: opens the message menu. */
function useLongPress(onLongPress: () => void, ms = 450) {
  const timer = useRef<number | undefined>(undefined);
  const start = useRef<{ x: number; y: number } | null>(null);
  const cancel = () => {
    window.clearTimeout(timer.current);
    start.current = null;
  };
  return {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
      timer.current = window.setTimeout(() => {
        navigator.vibrate?.(15);
        onLongPress();
        start.current = null;
      }, ms);
    },
    onTouchMove: (e: React.TouchEvent) => {
      const t = e.touches[0];
      if (start.current && Math.hypot(t.clientX - start.current.x, t.clientY - start.current.y) > 10) cancel();
    },
    onTouchEnd: cancel,
    onTouchCancel: cancel,
  };
}

function Bubble({
  m,
  seen,
  isLastMine,
  otherName,
  highlighted,
  onMenu,
  onQuoteClick,
}: {
  m: ChatMessage;
  seen: boolean;
  isLastMine: boolean;
  otherName: string;
  highlighted: boolean;
  onMenu: (target: MenuTarget) => void;
  onQuoteClick: (id: number) => void;
}) {
  const press = useLongPress(() => onMenu({ message: m, at: null }));
  const quoteName = m.replyTo ? (m.replyTo.senderId === m.senderId ? (m.isMine ? "You" : otherName) : m.isMine ? otherName : "You") : "";

  return (
    <div id={`msg-${m.id}`} className={cn("group flex scroll-mt-24 flex-col", m.isMine ? "items-end" : "items-start")}>
      <div className={cn("flex max-w-[86%] items-center gap-1 sm:max-w-[74%]", m.isMine ? "flex-row-reverse" : "flex-row")}>
        <div
          {...press}
          onContextMenu={(e) => {
            e.preventDefault();
            // Touch screens fire this too after a long press; the long-press already handled it.
            if (window.matchMedia("(pointer: fine)").matches) onMenu({ message: m, at: { x: e.clientX, y: e.clientY } });
          }}
          className={cn(
            "min-w-0 overflow-hidden rounded-2xl text-[15px] leading-relaxed transition-shadow [-webkit-touch-callout:none] max-lg:select-none",
            m.isMine ? "rounded-br-md bg-ink text-white" : "rounded-bl-md border border-line bg-card text-ink",
            highlighted && "ring-4 ring-amber-400/70",
          )}
        >
          {m.deleted ? (
            <p className="flex items-center gap-1.5 px-3.5 py-2 text-sm italic opacity-70">
              <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <circle cx="10" cy="10" r="7" />
                <path d="m5.2 14.8 9.6-9.6" />
              </svg>
              {m.isMine ? "You deleted this message" : "This message was deleted"}
            </p>
          ) : (
            <>
              {m.replyTo ? <Quote reply={m.replyTo} isMine={m.isMine} name={quoteName} onClick={() => onQuoteClick(m.replyTo!.id)} /> : null}
              {m.image ? (
                <a href={m.image.url} target="_blank" rel="noreferrer" className="block" draggable={false}>
                  <Image
                    src={m.image.url}
                    alt="Photo"
                    width={m.image.width ?? 600}
                    height={m.image.height ?? 600}
                    sizes="(max-width: 640px) 80vw, 360px"
                    draggable={false}
                    className={cn("max-h-80 w-auto object-cover", m.replyTo && "mt-1.5")}
                  />
                </a>
              ) : null}
              {m.body ? <p className="whitespace-pre-wrap break-words px-3.5 py-2">{m.body}</p> : null}
            </>
          )}
        </div>

        {/* Computers: a small button for people who don't think to right-click. */}
        {!m.deleted ? (
          <button
            type="button"
            aria-label="Message options"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              onMenu({ message: m, at: { x: m.isMine ? r.left - 200 : r.right, y: r.bottom } });
            }}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full text-subtle opacity-0 transition-opacity hover:bg-sand hover:text-ink focus:opacity-100 group-hover:opacity-100 lg:flex"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
              <circle cx="4.5" cy="10" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="15.5" cy="10" r="1.5" />
            </svg>
          </button>
        ) : null}
      </div>
      <span className="mt-1 px-1 text-[11px] text-subtle">
        {timeFmt.format(new Date(m.createdAt))}
        {m.isMine && isLastMine && !m.deleted ? (seen ? " · Seen" : " · Sent") : null}
      </span>
      {m.flagged && !m.isMine && !m.deleted ? (
        <p className="mt-1 max-w-[82%] rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-ink-3 sm:max-w-[70%]">
          <span className="font-bold text-ink">Be careful.</span> This message may ask you to pay or talk outside {site.name}.
          Never send money before you see the item. Use Buy now where available so your money is protected.
        </p>
      ) : null}
    </div>
  );
}

function PendingBubble({ p, onRetry, onDiscard }: { p: Pending; onRetry: () => void; onDiscard: () => void }) {
  return (
    <div className="flex flex-col items-end">
      <div className={cn("max-w-[82%] overflow-hidden rounded-2xl rounded-br-md bg-ink text-white sm:max-w-[70%]", !p.failed && "opacity-70")}>
        {p.replyTo ? <Quote reply={p.replyTo} isMine name="Reply" /> : null}
        {p.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.previewUrl} alt="" className="max-h-80 w-auto object-cover" />
        ) : null}
        {p.body ? <p className="whitespace-pre-wrap break-words px-3.5 py-2 text-[15px] leading-relaxed">{p.body}</p> : null}
      </div>
      {p.failed ? (
        <span className="mt-1 flex gap-3 px-1 text-[11px] font-semibold text-danger-600">
          Not sent
          <button type="button" onClick={onRetry} className="underline underline-offset-2">
            Retry
          </button>
          <button type="button" onClick={onDiscard} className="text-muted underline underline-offset-2">
            Delete
          </button>
        </span>
      ) : (
        <span className="mt-1 px-1 text-[11px] text-subtle">Sending…</span>
      )}
    </div>
  );
}

export function ChatThread({ id }: { id: number }) {
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [text, setText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [menu, setMenu] = useState<MenuTarget | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const highlightTimer = useRef<number | undefined>(undefined);
  const me = useSession();
  const live = useLiveConnected();
  const activeCall = useCall();
  const typingTimer = useRef<number | undefined>(undefined);
  const lastTypingSent = useRef(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);
  const keepOffsetFromBottom = useRef<number | null>(null);

  const lastId = messages.length ? messages[messages.length - 1].id : 0;

  /* ------------------------------- loading ------------------------------- */

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setMessages([]);
    setPending([]);
    fetchThread(id)
      .then((res) => {
        if (!alive) return;
        setConversation(res.conversation);
        setMessages(res.messages);
        setHasMore(res.hasMore);
        setStatus("ready");
        stickToBottom.current = true;
        notifyChatRead();
      })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ChatError && e.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(`/messages/${id}`)}`);
          return;
        }
        setStatus(e instanceof ChatError && e.status === 404 ? "missing" : "error");
        setError(e instanceof Error ? e.message : "We couldn't open this chat.");
      });
    return () => {
      alive = false;
    };
  }, [id, router]);

  // Check for new messages every few seconds (instant delivery comes with Reverb).
  const refresh = useCallback(async () => {
    if (status !== "ready") return;
    try {
      const res = await fetchThread(id, { after: lastId || undefined });
      setConversation(res.conversation);
      if (res.messages.length) {
        setMessages((current) => [...current, ...res.messages.filter((m) => !current.some((c) => c.id === m.id))]);
        notifyChatRead();
      }
    } catch {
      /* try again on the next tick */
    }
  }, [id, lastId, status]);

  // With the live connection up, this is only a safety net.
  usePolling(refresh, live ? 30_000 : 4_000, status === "ready");

  /* ------------------------------- live updates ------------------------------- */

  type LiveMessage = { conversationId: number; message: Omit<ChatMessage, "isMine"> };
  type LiveRead = { conversationId: number; userId: string; lastReadId: number | null };

  const whisper = usePrivateChannel(
    status === "ready" ? `conversation.${id}` : null,
    {
      "message.sent": (e: LiveMessage) => {
        const m: ChatMessage = { ...e.message, isMine: e.message.senderId === me?.id };
        setMessages((current) => (current.some((c) => c.id === m.id) ? current : [...current, m]));
        if (!m.isMine) {
          setTyping(false);
          // You're looking at the chat, so it's read. That turns their "Sent" into "Seen".
          if (document.visibilityState === "visible") {
            markRead(id)
              .then(notifyChatRead)
              .catch(() => undefined);
          }
        }
      },
      "conversation.read": (e: LiveRead) => {
        if (e.userId === me?.id) return;
        setConversation((c) => (c ? { ...c, theirLastReadId: e.lastReadId } : c));
      },
      "message.deleted": (e: { messageId: number }) => markDeleted(e.messageId),
    },
    {
      typing: () => {
        setTyping(true);
        window.clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => setTyping(false), 3500);
      },
    },
  );

  useEffect(
    () => () => {
      window.clearTimeout(typingTimer.current);
      window.clearTimeout(highlightTimer.current);
    },
    [],
  );

  /** Tell the other person you're typing, at most every 2.5 seconds. */
  function signalTyping() {
    const now = Date.now();
    if (now - lastTypingSent.current < 2500) return;
    lastTypingSent.current = now;
    whisper("typing", {});
  }

  async function loadOlder() {
    if (!messages.length) return;
    setLoadingOlder(true);
    const el = scrollRef.current;
    keepOffsetFromBottom.current = el ? el.scrollHeight - el.scrollTop : null;
    try {
      const res = await fetchThread(id, { before: messages[0].id });
      setMessages((current) => [...res.messages.filter((m) => !current.some((c) => c.id === m.id)), ...current]);
      setHasMore(res.hasMore);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Couldn't load older messages.");
      keepOffsetFromBottom.current = null;
    } finally {
      setLoadingOlder(false);
    }
  }

  /* ------------------------------- scrolling ------------------------------- */

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (keepOffsetFromBottom.current !== null) {
      // Older messages were added on top: keep what you were reading in place.
      el.scrollTop = el.scrollHeight - keepOffsetFromBottom.current;
      keepOffsetFromBottom.current = null;
    } else if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, pending, status]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  /* -------------------------------- sending -------------------------------- */

  async function deliver(p: Pending) {
    try {
      const sent = p.file ? await sendPhoto(id, p.file, p.body, p.replyTo?.id) : await sendText(id, p.body, p.replyTo?.id);
      setPending((current) => current.filter((x) => x.tempId !== p.tempId));
      setMessages((current) => (current.some((m) => m.id === sent.id) ? current : [...current, sent]));
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    } catch (e) {
      setPending((current) => current.map((x) => (x.tempId === p.tempId ? { ...x, failed: true } : x)));
      setNotice(e instanceof Error ? e.message : "Message not sent.");
    }
  }

  function queue(body: string, file?: File) {
    const quoting = replyingTo;
    setReplyingTo(null);
    const p: Pending = {
      tempId: `${Date.now()}-${Math.random()}`,
      body,
      replyTo: quoting ? { id: quoting.id, senderId: quoting.senderId, preview: previewOf(quoting) } : undefined,
      file,
      previewUrl: file ? URL.createObjectURL(file) : undefined,
      createdAt: new Date().toISOString(),
    };
    stickToBottom.current = true;
    setNotice("");
    setPending((current) => [...current, p]);
    void deliver(p);
  }

  function submit() {
    const body = text.trim();
    if (!body) return;
    setText("");
    queue(body);
    textRef.current?.focus();
  }

  function retry(p: Pending) {
    const again = { ...p, failed: false };
    setPending((current) => current.map((x) => (x.tempId === p.tempId ? again : x)));
    void deliver(again);
  }

  function discard(p: Pending) {
    if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    setPending((current) => current.filter((x) => x.tempId !== p.tempId));
  }

  /** Swap a message (and any quotes of it) for "deleted". */
  function markDeleted(messageId: number) {
    setMessages((current) =>
      current.map((m) => {
        if (m.id === messageId) return { ...m, deleted: true, body: null, image: null, flagged: false, canDelete: false };
        if (m.replyTo?.id === messageId) return { ...m, replyTo: { ...m.replyTo, preview: "Deleted message" } };
        return m;
      }),
    );
    setReplyingTo((r) => (r?.id === messageId ? null : r));
  }

  /** Jump to the quoted message and flash it. */
  function jumpTo(messageId: number) {
    const el = document.getElementById(`msg-${messageId}`);
    if (!el) {
      setNotice(hasMore ? "That message is further up. Tap \u201cLoad earlier messages\u201d to find it." : "That message is no longer here.");
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(messageId);
    window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlightId(null), 1600);
  }

  function actionsFor(m: ChatMessage): MenuAction[] {
    if (m.deleted) return [];
    const list: MenuAction[] = [];
    if (!conversation?.iBlockedThem) list.push("reply");
    if (m.body) list.push("copy");
    if (m.isMine && (m.canDelete ?? true) && canDeleteMessage(m)) list.push("delete");
    if (!m.isMine) list.push("report");
    return list;
  }

  async function pick(action: MenuAction) {
    const target = menu?.message;
    setMenu(null);
    if (!target) return;

    if (action === "reply") {
      setReplyingTo(target);
      textRef.current?.focus();
    } else if (action === "copy") {
      try {
        await navigator.clipboard.writeText(target.body ?? "");
        setNotice("Copied.");
      } catch {
        setNotice("Couldn't copy. Press and hold the text to select it instead.");
      }
    } else if (action === "delete") {
      if (!window.confirm("Delete this message for everyone? They'll see \u201cThis message was deleted\u201d.")) return;
      try {
        await deleteMessage(id, target.id);
        markDeleted(target.id);
      } catch (e) {
        setNotice(e instanceof Error ? e.message : "Couldn't delete that message.");
      }
    } else if (action === "report") {
      router.push(`/report?message=${target.id}&conversation=${id}`);
    }
  }

  async function toggleBlock() {
    if (!conversation) return;
    const name = conversation.otherUser.name;
    setMenuOpen(false);
    try {
      if (conversation.iBlockedThem) {
        await unblockUser(conversation.otherUser.id);
        setConversation({ ...conversation, iBlockedThem: false });
        setNotice(`You unblocked ${name}.`);
      } else {
        if (!window.confirm(`Block ${name}? They won't be able to message you.`)) return;
        await blockUser(conversation.otherUser.id);
        setConversation({ ...conversation, iBlockedThem: true });
        setNotice(`You blocked ${name}.`);
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "That didn't work.");
    }
  }

  // Grow the text box with what you type, up to about 5 lines.
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [text]);

  /* --------------------------------- views --------------------------------- */

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-ink border-r-transparent" aria-hidden />
      </div>
    );
  }

  if (status !== "ready" || !conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-extrabold">{status === "missing" ? "Chat not found" : "We couldn't open this chat"}</p>
        <p className="mt-1 text-sm text-muted">{status === "missing" ? "It may have been removed." : error}</p>
        <Link href="/messages" className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-3">
          Back to messages
        </Link>
      </div>
    );
  }

  const other = conversation.otherUser;
  const status2 = presence(other.lastSeenAt);
  const listing = conversation.listing;
  const lastMine = [...messages].reverse().find((m) => m.isMine && !m.call && !m.order);
  const canCall = !conversation.iBlockedThem && activeCall.phase === "idle";
  const seenUpTo = conversation.theirLastReadId ?? 0;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      {/* Who and what (on phones this is the top of a full-screen chat, below the notch) */}
      <div className="shrink-0 border-b border-line bg-card pt-[env(safe-area-inset-top)] lg:pt-0">
        <div className="flex items-center gap-2 px-2 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <Link href="/messages" className="flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-3 hover:bg-sand lg:hidden" aria-label="Back to messages">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12.5 4.5 7 10l5.5 5.5" />
            </svg>
          </Link>
          <ChatAvatar name={other.name} url={other.avatarUrl} online={status2 === "Online"} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate font-bold">
              <span className="truncate">{other.name}</span>
              {other.isVerified ? (
                <span className="shrink-0 text-brand-500" title="Verified">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              ) : null}
            </p>
            <p className={cn("truncate text-xs", typing ? "font-semibold text-brand-600" : "text-muted")}>
              {typing ? "typing…" : (status2 ?? (other.isVerified ? "Verified seller" : "Not verified yet"))}
            </p>
          </div>
          <button
            type="button"
            disabled={!canCall}
            onClick={() => {
              if (!callsAvailable()) {
                setNotice("Calls need the live connection. Make sure Reverb is running, then refresh.");
                return;
              }
              void startCall(conversation.id, other, listing?.title ?? null);
            }}
            aria-label={`Voice call ${other.name}`}
            title={conversation.iBlockedThem ? "Unblock to call" : "Voice call"}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-3 transition-colors hover:bg-sand hover:text-ink disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
              <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8Z" />
            </svg>
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="More options"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-3 hover:bg-sand"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden>
                <circle cx="10" cy="4.5" r="1.6" />
                <circle cx="10" cy="10" r="1.6" />
                <circle cx="10" cy="15.5" r="1.6" />
              </svg>
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-xl border border-line bg-card py-1 shadow-[var(--shadow-lift)]">
                <button type="button" onClick={toggleBlock} className="block w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-sand">
                  {conversation.iBlockedThem ? `Unblock ${other.name.split(" ")[0]}` : `Block ${other.name.split(" ")[0]}`}
                </button>
                <Link href={`/report?user=${other.id}&conversation=${conversation.id}`} className="block px-4 py-2.5 text-sm font-medium text-danger-600 hover:bg-danger-50">
                  Report
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {listing ? (
          <Link href={listingHref(listing)} className="flex items-center gap-3 border-t border-line bg-paper px-4 py-2.5 transition-colors hover:bg-sand">
            <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sand">
              {listing.photoUrl ? <Image src={listing.photoUrl} alt="" width={40} height={40} className="h-full w-full object-cover" /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{listing.title}</span>
              <span className="text-xs text-muted">
                {formatNaira(listing.price)}
                {!listing.isAvailable ? <span className="ml-2 font-semibold text-danger-600">{listing.status === "sold" ? "Sold" : "No longer available"}</span> : null}
              </span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-ink underline-offset-2">View ad</span>
          </Link>
        ) : null}
      </div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain bg-paper px-3 py-4 sm:px-5">
        <p className="mx-auto max-w-sm rounded-xl bg-card px-3 py-2 text-center text-[11px] leading-relaxed text-muted ring-1 ring-line">
          <span className="font-semibold text-ink">Stay safe:</span> keep chats and payments on {site.name}. Meet in a public place and check the item before you pay.
        </p>

        {hasMore ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={loadOlder}
              disabled={loadingOlder}
              className="h-8 rounded-full bg-card px-3 text-xs font-semibold text-ink-3 ring-1 ring-line hover:text-ink disabled:opacity-60"
            >
              {loadingOlder ? "Loading…" : "Load earlier messages"}
            </button>
          </div>
        ) : null}

        {messages.map((m, i) => {
          const newDay = i === 0 || dayLabel(messages[i - 1].createdAt) !== dayLabel(m.createdAt);
          return (
            <div key={m.id}>
              {newDay ? (
                <p className="my-2 text-center text-[11px] font-semibold uppercase tracking-wide text-subtle">{dayLabel(m.createdAt)}</p>
              ) : null}
              {m.call ? (
                <CallNote m={m} meId={me?.id} />
              ) : m.order ? (
                <OrderNote m={m} />
              ) : (
                <Bubble
                  m={m}
                  isLastMine={m.id === lastMine?.id}
                  seen={m.isMine && m.id <= seenUpTo}
                  otherName={other.name.split(" ")[0]}
                  highlighted={highlightId === m.id}
                  onMenu={(t) => actionsFor(t.message).length && setMenu(t)}
                  onQuoteClick={jumpTo}
                />
              )}
            </div>
          );
        })}

        {pending.map((p) => (
          <PendingBubble key={p.tempId} p={p} onRetry={() => retry(p)} onDiscard={() => discard(p)} />
        ))}

        {typing ? (
          <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-card px-3.5 py-3" aria-label={`${other.name} is typing`}>
            {[0, 150, 300].map((d) => (
              <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-subtle" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-line bg-card px-2 pb-[max(env(safe-area-inset-bottom),0.625rem)] pt-2.5 sm:px-4 sm:py-3">
        {notice ? (
          <p className="mb-2 flex items-start justify-between gap-3 rounded-lg bg-sand px-3 py-2 text-xs font-medium text-ink-3">
            {notice}
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss" className="text-subtle hover:text-ink">
              ✕
            </button>
          </p>
        ) : null}

        {replyingTo && !conversation.iBlockedThem ? (
          <div className="mb-2 flex items-center gap-3 rounded-xl border-l-[3px] border-brand-500 bg-sand py-2 pl-3 pr-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-ink">Replying to {replyingTo.isMine ? "yourself" : other.name.split(" ")[0]}</p>
              <p className="truncate text-[13px] text-ink-3">{previewOf(replyingTo)}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              aria-label="Cancel reply"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-subtle hover:bg-line hover:text-ink"
            >
              ✕
            </button>
          </div>
        ) : null}

        {conversation.iBlockedThem ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-sand px-4 py-3 text-sm">
            <span className="text-ink-3">You blocked {other.name}.</span>
            <button type="button" onClick={toggleBlock} className="font-semibold underline underline-offset-2">
              Unblock
            </button>
          </div>
        ) : (
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) {
                  setNotice("Photos must be 10MB or smaller.");
                  return;
                }
                queue(text.trim(), file);
                setText("");
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Send a photo"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-ink-3 transition-colors hover:bg-sand hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
                <circle cx="9" cy="10" r="1.6" />
                <path d="m20.5 16-4.8-4.8a1 1 0 0 0-1.4 0L6.5 19" />
              </svg>
            </button>
            <label htmlFor="chat-text" className="sr-only">
              Message
            </label>
            <textarea
              id="chat-text"
              ref={textRef}
              rows={1}
              value={text}
              maxLength={2000}
              onChange={(e) => {
                setText(e.target.value);
                if (e.target.value.trim()) signalTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape" && replyingTo) {
                  setReplyingTo(null);
                  return;
                }
                // Enter sends on computers; on phones the keyboard's Enter adds a new line.
                if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Write a message"
              className="max-h-[132px] min-h-11 min-w-0 flex-1 resize-none rounded-[22px] border border-line-strong bg-paper px-4 py-2.5 text-base leading-snug sm:rounded-[10px] sm:px-3.5 sm:text-[15px] text-ink placeholder:text-subtle focus:border-ink/40 focus:outline-none focus:ring-4 focus:ring-ink/5"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              aria-label="Send"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-ink text-white transition-colors hover:bg-ink-3 disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
        )}
      </div>
      {menu ? <MessageMenu target={menu} actions={actionsFor(menu.message)} onPick={pick} onClose={closeMenu} /> : null}
    </div>
  );
}
