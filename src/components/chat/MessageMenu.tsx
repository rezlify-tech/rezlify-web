"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat";
import { cn } from "@/lib/utils";

export type MenuAction = "reply" | "copy" | "delete" | "report";

export type MenuTarget = {
  message: ChatMessage;
  /** Where to open on a computer (the mouse position). Null on phones: opens as a bottom sheet. */
  at: { x: number; y: number } | null;
};

const icons: Record<MenuAction, React.ReactNode> = {
  reply: <path d="M9.5 6 4 11.5 9.5 17M4.5 11.5H14a6 6 0 0 1 6 6v1" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
    </>
  ),
  delete: <path d="M5 7h14M10 11v6M14 11v6M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7M9.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7" />,
  report: <path d="M5.5 20.5v-16M5.5 4.5h11l-2 4 2 4h-11" />,
};

const labels: Record<MenuAction, string> = {
  reply: "Reply",
  copy: "Copy text",
  delete: "Delete for everyone",
  report: "Report message",
};

/**
 * The menu for one message: right-click on a computer opens it at the mouse;
 * press-and-hold on a phone opens it as a sheet from the bottom.
 */
export function MessageMenu({
  target,
  actions,
  onPick,
  onClose,
}: {
  target: MenuTarget;
  actions: MenuAction[];
  onPick: (action: MenuAction) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // Keep the menu on screen near the mouse.
  useLayoutEffect(() => {
    if (!target.at || !ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    const left = Math.min(target.at.x, window.innerWidth - width - 8);
    const top = target.at.y + height > window.innerHeight - 8 ? target.at.y - height : target.at.y;
    setPos({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onScroll = () => target.at && onClose();
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onClose);
    document.addEventListener("scroll", onScroll, true);
    ref.current?.querySelector<HTMLButtonElement>("button[data-item]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onClose);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [onClose, target.at]);

  const m = target.message;
  const preview = m.deleted ? "Deleted message" : m.image && !m.body ? "Photo" : (m.body ?? "");

  const items = actions.map((a) => (
    <button
      key={a}
      type="button"
      data-item
      role="menuitem"
      onClick={() => onPick(a)}
      className={cn(
        "flex w-full items-center gap-3 px-4 text-left font-medium transition-colors focus:outline-none",
        target.at ? "py-2.5 text-sm hover:bg-sand focus:bg-sand" : "py-3.5 text-[15px] active:bg-sand",
        a === "delete" || a === "report" ? "text-danger-600" : "text-ink",
      )}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {icons[a]}
      </svg>
      {labels[a]}
    </button>
  ));

  if (target.at) {
    return (
      <div className="fixed inset-0 z-[65]" onMouseDown={onClose} onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}>
        <div
          ref={ref}
          role="menu"
          aria-label="Message options"
          onMouseDown={(e) => e.stopPropagation()}
          style={pos ? { left: pos.left, top: pos.top } : { left: target.at.x, top: target.at.y, visibility: "hidden" }}
          className="absolute w-56 overflow-hidden rounded-xl border border-line bg-card py-1 shadow-[var(--shadow-lift)] animate-fade-up"
        >
          {items}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-end bg-ink/40" onClick={onClose}>
      <div
        ref={ref}
        role="menu"
        aria-label="Message options"
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[24px] bg-card pb-[max(env(safe-area-inset-bottom),12px)] pt-3 shadow-[var(--shadow-lift)] animate-fade-up"
      >
        <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-line" aria-hidden />
        <p className="mx-4 mb-2 line-clamp-2 rounded-xl bg-sand px-3 py-2 text-sm text-ink-3">{preview}</p>
        {items}
        <button type="button" onClick={onClose} className="mt-1 w-full border-t border-line py-3.5 text-[15px] font-semibold text-muted">
          Cancel
        </button>
      </div>
    </div>
  );
}
