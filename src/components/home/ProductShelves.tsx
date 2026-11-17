"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { formatNaira } from "@/lib/format";
import { listingHref } from "@/lib/listing-url";
import { states } from "@/lib/mock/locations";
import { detectNearState, popularStates, setNearState, stateName, useNearState } from "@/lib/near-you";
import { toQueryString } from "@/lib/search-params";
import { MIN_SHELF_ITEMS, shelves } from "@/lib/shelves";
import type { ListingSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

function ShelfCard({ l }: { l: ListingSummary }) {
  return (
    <li className="w-[128px] shrink-0 snap-start sm:w-[144px]">
      <Link href={listingHref(l)} className="group block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-sand ring-1 ring-line">
          {l.photo ? (
            <Image
              src={l.photo.url}
              alt=""
              fill
              sizes="144px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : null}
        </div>
        <p className="mt-1.5 text-sm font-extrabold">{formatNaira(l.price)}</p>
        <p className="truncate text-xs text-muted group-hover:text-ink">{l.title}</p>
      </Link>
    </li>
  );
}

const NEAR = "near";

type NearData = Record<string, ListingSummary[] | "error">;

/**
 * Homepage shelves: small tabs, one row of small cards.
 * "Near you" comes first: ads in the visitor's state (they pick it once; it's remembered on the device).
 * Other tabs with too few items are left out.
 */
export function ProductShelves({ data }: { data: Record<string, ListingSummary[]> }) {
  const available = shelves.filter((s) => (data[s.id]?.length ?? 0) >= MIN_SHELF_ITEMS);
  const nearState = useNearState();
  const near = nearState?.slug ?? null;
  const [activeId, setActiveId] = useState<string | undefined>(available[0]?.id ?? NEAR);
  const [picking, setPicking] = useState(false);
  const [nearData, setNearData] = useState<NearData>({});
  const touched = useRef(false);
  const rowRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  // First visit: guess their state from their connection (once per device).
  useEffect(() => {
    void detectNearState();
  }, []);

  // Once we know their state (picked or guessed), start on "Near you", unless they've tapped another tab.
  useEffect(() => {
    if (near && !touched.current) setActiveId(NEAR);
  }, [near]);

  // Load ads for their state once per state.
  useEffect(() => {
    if (activeId !== NEAR || !near || nearData[near]) return;
    let cancelled = false;
    fetch(`/api/listings?state=${encodeURIComponent(near)}&sort=newest`, { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((body: { data: ListingSummary[] }) => !cancelled && setNearData((d) => ({ ...d, [near]: body.data.slice(0, 12) })))
      .catch(() => !cancelled && setNearData((d) => ({ ...d, [near]: "error" })));
    return () => {
      cancelled = true;
    };
  }, [activeId, near, nearData]);

  const onNear = activeId === NEAR;
  const nearItems = near ? nearData[near] : undefined;
  const active = available.find((s) => s.id === activeId);
  const items: ListingSummary[] = onNear ? (Array.isArray(nearItems) ? nearItems : []) : active ? data[active.id] : [];

  function choose(id: string) {
    touched.current = true;
    setActiveId(id);
    setPicking(false);
  }

  function updateEdges() {
    const el = rowRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  }

  useEffect(() => {
    rowRef.current?.scrollTo({ left: 0 });
    updateEdges();
  }, [activeId, near, items.length]);

  const tabs = [{ id: NEAR, label: "Near you" }, ...available.map((s) => ({ id: s.id, label: s.label }))];
  const seeAll = onNear ? (near ? `/search?state=${near}` : null) : active ? `/search${toQueryString(active.filters)}` : null;
  const showPicker = onNear && (!near || picking);

  const arrow =
    "absolute top-[52px] hidden h-9 w-9 items-center justify-center rounded-full border border-line bg-card shadow-[var(--shadow-card)] transition-colors hover:bg-sand sm:flex";

  return (
    <section aria-label="Popular items" className="rounded-[20px] border border-line bg-card px-4 py-4 shadow-[var(--shadow-card)] sm:px-5">
      <div className="flex items-center gap-3">
        <div
          className="no-scrollbar -ml-1 flex min-w-0 flex-1 gap-1 overflow-x-auto pl-1 pr-6 [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)]"
          role="tablist"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === activeId}
              onClick={() => choose(t.id)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] font-semibold transition-colors",
                t.id === activeId ? "bg-ink text-white" : "text-ink-3 hover:bg-sand hover:text-ink",
              )}
            >
              {t.id === NEAR ? (
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M10 17.5s5.5-5 5.5-9.5a5.5 5.5 0 0 0-11 0c0 4.5 5.5 9.5 5.5 9.5Z" />
                  <circle cx="10" cy="8" r="1.8" />
                </svg>
              ) : null}
              {t.label}
            </button>
          ))}
        </div>
        {seeAll && !showPicker ? (
          <Link href={seeAll} className="shrink-0 text-[13px] font-semibold text-ink underline-offset-4 hover:underline">
            See all
          </Link>
        ) : null}
      </div>

      {onNear && near && !picking ? (
        <p className="mt-2.5 text-xs text-muted">
          {nearState?.detected ? "We think you're in " : "In "}
          <span className="font-semibold text-ink">{stateName(near)}</span>
          {" · "}
          <button type="button" onClick={() => setPicking(true)} className="font-semibold text-ink underline underline-offset-2">
            {nearState?.detected ? "Not right?" : "Change"}
          </button>
        </p>
      ) : null}

      {showPicker ? (
        <StatePicker
          current={near}
          onPick={(slug) => {
            setNearState(slug);
            setPicking(false);
          }}
          onCancel={near ? () => setPicking(false) : undefined}
        />
      ) : onNear && near && nearItems === undefined ? (
        <ul className="mt-3 flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="w-[128px] shrink-0 sm:w-[144px]">
              <span className="skeleton block aspect-square rounded-xl" />
              <span className="skeleton mt-2 block h-4 w-16 rounded" />
            </li>
          ))}
        </ul>
      ) : onNear && near && items.length === 0 ? (
        <div className="mt-3 rounded-xl bg-sand px-4 py-6 text-center text-sm">
          <p className="font-semibold">{nearItems === "error" ? "We couldn't load ads near you." : `No ads in ${stateName(near)} yet.`}</p>
          <button type="button" onClick={() => setPicking(true)} className="mt-1 text-xs font-semibold text-ink underline underline-offset-2">
            Try another state
          </button>
        </div>
      ) : (

      <div className="relative mt-3">
        <ul
          ref={rowRef}
          onScroll={updateEdges}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:-mx-0 sm:scroll-px-0 sm:px-0"
        >
          {items.map((l) => (
            <ShelfCard key={l.id} l={l} />
          ))}
        </ul>

        {!edges.start ? (
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => rowRef.current?.scrollBy({ left: -rowRef.current.clientWidth * 0.8, behavior: "smooth" })}
            className={cn(arrow, "-left-3")}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M12.5 4.5 7 10l5.5 5.5" />
            </svg>
          </button>
        ) : null}
        {!edges.end ? (
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => rowRef.current?.scrollBy({ left: rowRef.current.clientWidth * 0.8, behavior: "smooth" })}
            className={cn(arrow, "-right-3")}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M7.5 4.5 13 10l-5.5 5.5" />
            </svg>
          </button>
        ) : null}
      </div>
      )}
    </section>
  );
}

/** "Where are you?": quick picks for the biggest states, and a list for the rest. */
function StatePicker({ current, onPick, onCancel }: { current: string | null; onPick: (slug: string) => void; onCancel?: () => void }) {
  return (
    <div className="mt-3 rounded-xl bg-sand p-4">
      <p className="text-sm font-semibold">Where are you? We&apos;ll show ads close by.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {popularStates.map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => onPick(slug)}
            className={cn(
              "h-9 rounded-full px-3.5 text-sm font-semibold transition-colors",
              current === slug ? "bg-ink text-white" : "bg-card text-ink-3 ring-1 ring-line hover:text-ink",
            )}
          >
            {stateName(slug)}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <FilterSelect
          label="Other states"
          name="near_state"
          placeholder="Other states"
          hideLabel
          clearable={false}
          value=""
          onChange={(v) => v && onPick(v)}
          options={states.map((st) => ({ id: st.slug, label: st.name }))}
          className="w-full sm:w-64"
        />
        {onCancel ? (
          <button type="button" onClick={onCancel} className="h-10 px-2 text-sm font-semibold text-muted hover:text-ink">
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
