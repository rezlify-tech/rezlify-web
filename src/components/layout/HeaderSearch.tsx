"use client";

import { useSearchParams } from "next/navigation";
import { SearchBar } from "./SearchBar";

/** Header search that keeps the current query (e.g. on /search?q=mac+book) in the box. */
export function HeaderSearch({ className, id }: { className?: string; id?: string }) {
  const q = useSearchParams().get("q") ?? "";
  return <SearchBar key={q} defaultValue={q} className={className} id={id} />;
}
