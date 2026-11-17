"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { FILTER_KEYS, toQueryString, type SearchFilters } from "@/lib/search-params";

/** Read the current filters from the URL and update them (instantly, without scrolling to the top). */
export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const current = useMemo(() => {
    const out: SearchFilters = {};
    for (const key of FILTER_KEYS) {
      const v = params.get(key);
      if (v) out[key] = v;
    }
    return out;
  }, [params]);

  const update = useCallback(
    (patch: Partial<SearchFilters>) => {
      const next: SearchFilters = { ...current, ...patch };
      // A new category means the old brand may not apply any more.
      if ("category" in patch && patch.category !== current.category && !("brand" in patch)) {
        delete next.brand;
      }
      router.push(`${pathname}${toQueryString(next)}`, { scroll: false });
    },
    [current, pathname, router],
  );

  const clearAll = useCallback(() => {
    router.push(`${pathname}${toQueryString({ q: current.q })}`, { scroll: false });
  }, [current.q, pathname, router]);

  const activeCount = FILTER_KEYS.filter((k) => k !== "q" && k !== "sort" && current[k]).length;

  return { current, update, clearAll, activeCount };
}
