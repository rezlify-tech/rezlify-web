import Form from "next/form";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

/**
 * Plain GET form to /search?q=..., so it works even before JavaScript loads.
 * next/form adds instant client-side navigation on top.
 */
export function SearchBar({
  className,
  defaultValue,
  size = "md",
  id = "site-search",
}: {
  className?: string;
  defaultValue?: string;
  size?: "md" | "lg";
  id?: string;
}) {
  const lg = size === "lg";

  return (
    <Form action="/search" role="search" className={cn("relative w-full", className)}>
      <label htmlFor={id} className="sr-only">
        Search {site.name}
      </label>
      <svg
        viewBox="0 0 20 20"
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-subtle",
          lg ? "left-4 h-5 w-5" : "left-3.5 h-[18px] w-[18px]",
        )}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="8.75" cy="8.75" r="5.75" />
        <path d="m13 13 4 4" />
      </svg>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={lg ? "What are you looking for today?" : "Search phones, laptops, books, generators…"}
        autoComplete="off"
        enterKeyHint="search"
        className={cn(
          "w-full rounded-[10px] border border-line-strong bg-card text-ink placeholder:text-subtle transition-colors hover:border-ink/25 focus:border-ink/40 focus:outline-none focus:ring-4 focus:ring-ink/5",
          lg ? "h-14 rounded-xl pl-12 pr-28 text-base shadow-[var(--shadow-card)] sm:h-16 sm:pr-32 sm:text-lg" : "h-11 pl-10 pr-24 text-[15px]",
        )}
      />
      <button
        type="submit"
        className={cn(
          "absolute inline-flex items-center font-semibold text-white transition-colors",
          lg
            ? "right-1.5 top-1.5 h-11 rounded-[10px] bg-ink px-5 text-[15px] hover:bg-ink-3 sm:right-2 sm:top-2 sm:h-12 sm:px-6"
            : "right-1 top-1 h-9 rounded-[8px] bg-ink px-4 text-sm hover:bg-ink-3",
        )}
      >
        Search
      </button>
    </Form>
  );
}
