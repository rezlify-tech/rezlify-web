"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Bank } from "@/lib/verification";
import { cn } from "@/lib/utils";

/** Banks most sellers use, shown first. */
const POPULAR = ["opay", "palmpay", "moniepoint", "access", "guaranty", "zenith", "united bank for africa", "first bank", "kuda"];

/**
 * Searchable bank list: the provider returns hundreds of banks, so a plain dropdown is too long.
 * Type to filter; popular banks are at the top.
 */
export function BankPicker({
  banks,
  value,
  onChange,
  disabled,
}: {
  banks: Bank[];
  value: Bank | null;
  onChange: (bank: Bank) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const match = (b: Bank) => !term || b.name.toLowerCase().includes(term);
    const popular = POPULAR.map((p) => banks.find((b) => b.name.toLowerCase().includes(p))).filter(
      (b): b is Bank => Boolean(b) && match(b!),
    );
    const rest = banks.filter((b) => match(b) && !popular.includes(b));
    return { popular: term ? [] : popular, rest: term ? [...popular, ...rest] : rest };
  }, [banks, q]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(b: Bank) {
    onChange(b);
    setOpen(false);
    setQ("");
  }

  const row = (b: Bank) => (
    <li key={b.code}>
      <button
        type="button"
        onClick={() => pick(b)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-sand",
          value?.code === b.code ? "font-semibold text-ink" : "text-ink-3",
        )}
      >
        {b.name}
        {value?.code === b.code ? <span aria-hidden>✓</span> : null}
      </button>
    </li>
  );

  return (
    <div ref={ref} className="relative">
      <span className="mb-1.5 block text-sm font-semibold">Bank</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-12 w-full items-center justify-between gap-2 rounded-[10px] border border-line-strong bg-card px-3.5 text-left text-base text-ink transition-colors hover:border-ink/25 disabled:bg-sand disabled:text-subtle sm:text-[15px]"
      >
        <span className={cn("truncate", !value && "text-subtle")}>{value?.name ?? "Choose your bank"}</span>
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-line bg-card shadow-[var(--shadow-lift)] animate-fade-up">
          <div className="border-b border-line p-2">
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search banks"
              className="h-10 w-full rounded-lg bg-sand px-3 text-base text-ink placeholder:text-subtle focus:outline-none sm:text-sm"
            />
          </div>
          <ul className="scrollbar-visible max-h-72 overflow-y-auto p-1">
            {list.popular.length ? (
              <>
                <li className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-subtle">Popular</li>
                {list.popular.map(row)}
                <li className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-subtle">All banks</li>
              </>
            ) : null}
            {list.rest.map(row)}
            {!list.rest.length && !list.popular.length ? <li className="px-3 py-6 text-center text-sm text-muted">No bank matches “{q}”.</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
