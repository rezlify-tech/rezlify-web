"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSessionStatus } from "@/lib/session";
import { cn } from "@/lib/utils";
import { ChatInbox } from "./ChatInbox";
import { ChatThread } from "./ChatThread";

/**
 * Messages layout.
 * Computers: one card with the chats on the left and the open chat on the right.
 * Phones: the list is a normal page; an open chat covers the whole screen (like WhatsApp),
 * so the site header and search don't take space from the conversation.
 */
export function ChatShell({ selectedId }: { selectedId?: number }) {
  const status = useSessionStatus();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") {
      const next = selectedId ? `/messages/${selectedId}` : "/messages";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [status, selectedId, router]);

  // On phones, stop the page behind a full-screen chat from scrolling.
  useEffect(() => {
    if (!selectedId) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => {
      document.documentElement.style.overflow = mq.matches ? "hidden" : "";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.style.overflow = "";
    };
  }, [selectedId]);

  if (status !== "authenticated") {
    return (
      <div className="flex h-[60dvh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink border-r-transparent" aria-hidden />
      </div>
    );
  }

  return (
    <div className="lg:container-x lg:py-6">
      <div
        className={cn(
          "grid min-w-0 grid-cols-1 bg-card",
          // Computers: a fixed-height card with two columns.
          "lg:h-[calc(100dvh-8.5rem)] lg:min-h-[480px] lg:grid-cols-[340px_minmax(0,1fr)] lg:overflow-hidden lg:rounded-[20px] lg:border lg:border-line lg:shadow-[var(--shadow-card)]",
        )}
      >
        {/* Chats list: the whole page on phones (when no chat is open), the left column on computers. */}
        <aside className={cn("min-w-0 lg:block lg:min-h-0 lg:border-r lg:border-line", selectedId ? "hidden" : "block min-h-[60dvh]")}>
          <ChatInbox selectedId={selectedId} />
        </aside>

        {/* Open chat: full screen on phones, the right column on computers. */}
        <section
          className={cn(
            "min-w-0",
            selectedId
              ? "fixed inset-0 z-50 flex h-[100dvh] flex-col overscroll-contain bg-card lg:static lg:z-auto lg:block lg:h-auto lg:min-h-0"
              : "hidden lg:block lg:min-h-0",
          )}
        >
          {selectedId ? (
            <ChatThread key={selectedId} id={selectedId} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-paper px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-subtle ring-1 ring-line">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
                  <path d="M4.5 6.5A2 2 0 0 1 6.5 4.5h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4.5 3.5v-3.5h0a2 2 0 0 1-1-1.7V6.5Z" />
                </svg>
              </span>
              <p className="mt-4 font-extrabold">Pick a chat</p>
              <p className="mt-1 max-w-xs text-sm text-muted">Your conversations with buyers and sellers show up here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
