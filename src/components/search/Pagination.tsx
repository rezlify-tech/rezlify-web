import Link from "next/link";
import { cn } from "@/lib/utils";

/** Previous / page numbers / next. hrefFor(n) builds the link for page n. */
export function Pagination({
  page,
  lastPage,
  hrefFor,
  className,
}: {
  page: number;
  lastPage: number;
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (lastPage <= 1) return null;

  // 1 … 4 5 [6] 7 8 … 20
  const pages: (number | "gap")[] = [];
  for (let n = 1; n <= lastPage; n++) {
    if (n === 1 || n === lastPage || Math.abs(n - page) <= 1) pages.push(n);
    else if (pages[pages.length - 1] !== "gap") pages.push("gap");
  }

  const arrow = "inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-line bg-card px-3.5 text-sm font-semibold transition-colors";

  return (
    <nav aria-label="Pages" className={cn("flex items-center justify-between gap-3", className)}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(arrow, "text-ink hover:border-ink/30")}>
          <span aria-hidden>←</span> Previous
        </Link>
      ) : (
        <span className={cn(arrow, "pointer-events-none text-subtle opacity-50")}>
          <span aria-hidden>←</span> Previous
        </span>
      )}

      <ol className="hidden items-center gap-1 sm:flex">
        {pages.map((n, i) =>
          n === "gap" ? (
            <li key={`gap-${i}`} className="px-1.5 text-sm text-subtle">
              …
            </li>
          ) : (
            <li key={n}>
              <Link
                href={hrefFor(n)}
                aria-current={n === page ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 min-w-10 items-center justify-center rounded-[10px] px-2 text-sm font-semibold tabular-nums transition-colors",
                  n === page ? "bg-ink text-white" : "text-ink-3 hover:bg-sand hover:text-ink",
                )}
              >
                {n}
              </Link>
            </li>
          ),
        )}
      </ol>
      <p className="text-sm text-muted sm:hidden">
        Page {page} of {lastPage}
      </p>

      {page < lastPage ? (
        <Link href={hrefFor(page + 1)} className={cn(arrow, "text-ink hover:border-ink/30")}>
          Next <span aria-hidden>→</span>
        </Link>
      ) : (
        <span className={cn(arrow, "pointer-events-none text-subtle opacity-50")}>
          Next <span aria-hidden>→</span>
        </span>
      )}
    </nav>
  );
}
