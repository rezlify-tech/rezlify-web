"use client";

import { FilterSelect } from "@/components/ui/FilterSelect";
import { sortOptions } from "@/lib/search-params";
import { useFilters } from "./useFilters";

export function SortSelect({ className }: { className?: string }) {
  const { current, update } = useFilters();

  return (
    <FilterSelect
      className={className}
      label="Sort by"
      hideLabel
      name="sort"
      placeholder="Sort"
      value={current.sort ?? "newest"}
      onChange={(v) => update({ sort: !v || v === "newest" ? undefined : v })}
      options={sortOptions}
      clearable={false}
    />
  );
}
