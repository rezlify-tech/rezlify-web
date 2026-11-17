import Link from "next/link";

/** Shown when the API can't be reached, instead of a blank page or a crash. */
export function LoadError({
  title = "We couldn't load this right now",
  body = "Please check your connection and try again in a moment.",
  retryHref,
}: {
  title?: string;
  body?: string;
  retryHref: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-dashed border-line-strong bg-card px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sand text-subtle">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 9.5a13 13 0 0 1 18 0M6 13a8.5 8.5 0 0 1 12 0M9.5 16.5a3.5 3.5 0 0 1 5 0" />
          <path d="m3 3 18 18" />
        </svg>
      </span>
      <h2 className="mt-5 text-lg font-extrabold tracking-[-0.01em]">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>
      <Link
        href={retryHref}
        className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-3"
      >
        Try again
      </Link>
    </div>
  );
}
