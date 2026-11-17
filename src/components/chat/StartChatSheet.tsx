"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChatError, startConversation } from "@/lib/chat";
import { cn } from "@/lib/utils";

const quick = ["Is this still available?", "What's your last price?", "Where can we meet?", "Can you deliver?"];

/** "Chat with seller": pick a ready-made question or write your own, then go straight into the chat. */
export function StartChatSheet({
  listingId,
  title,
  open,
  onClose,
}: {
  listingId: string;
  title: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [text, setText] = useState(quick[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  async function send() {
    const body = text.trim();
    if (!body) {
      setError("Write a message first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const conversation = await startConversation(listingId, body);
      router.push(`/messages/${conversation.id}`);
    } catch (e) {
      if (e instanceof ChatError && e.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (e instanceof ChatError && e.code === "email_unverified") {
        router.push(`/verify-email?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setError(e instanceof Error ? e.message : "Message not sent. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className={cn("fixed inset-0 z-[60]", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open} inert={!open}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-chat-title"
        className={cn(
          "absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg rounded-t-[24px] bg-card p-5 shadow-[var(--shadow-lift)] transition-transform duration-300 sm:bottom-auto sm:top-1/2 sm:rounded-[24px] sm:p-6",
          open ? "translate-y-0 sm:-translate-y-1/2" : "translate-y-full sm:translate-y-[60%] sm:opacity-0",
        )}
      >
        <span className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
        <h2 id="start-chat-title" className="text-lg font-extrabold tracking-[-0.01em]">
          Message the seller
        </h2>
        <p className="mt-0.5 truncate text-sm text-muted">About: {title}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {quick.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setText(q);
                textRef.current?.focus();
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                text === q ? "border-ink bg-ink text-white" : "border-line bg-card text-ink-3 hover:border-ink/30 hover:text-ink",
              )}
            >
              {q}
            </button>
          ))}
        </div>

        <label htmlFor="start-chat-text" className="sr-only">
          Your message
        </label>
        <textarea
          id="start-chat-text"
          ref={textRef}
          rows={3}
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-4 w-full resize-none rounded-[12px] border border-line-strong bg-paper px-3.5 py-3 text-[15px] leading-relaxed text-ink placeholder:text-subtle focus:border-ink/40 focus:outline-none focus:ring-4 focus:ring-ink/5"
          placeholder="Write your message"
        />

        {error ? (
          <p role="alert" className="mt-3 rounded-xl bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="h-12 rounded-[10px] px-5 text-[15px] font-semibold text-muted hover:bg-sand hover:text-ink">
            Cancel
          </button>
          <button
            type="button"
            onClick={send}
            disabled={busy}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[10px] bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-ink-3 disabled:opacity-60"
          >
            {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : null}
            Send message
          </button>
        </div>
        <p className="mt-3 text-center text-[11px] text-subtle">Never pay before you see the item. Use Buy now where available.</p>
      </div>
    </div>
  );
}
