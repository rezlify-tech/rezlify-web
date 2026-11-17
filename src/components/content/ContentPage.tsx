import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

/**
 * Layout for help, policy and info pages: a calm header and a readable column.
 * Text inside <Prose> gets sensible heading, paragraph and list styles.
 */
export function ContentPage({
  eyebrow,
  title,
  intro,
  updated,
  wide,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  updated?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="container-x py-8 sm:py-14">
      <div className={cn("mx-auto", wide ? "max-w-5xl" : "max-w-3xl")}>
        <header>
          {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-subtle">{eyebrow}</p> : null}
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl">{title}</h1>
          {intro ? <div className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{intro}</div> : null}
          {updated ? <p className="mt-3 text-xs text-subtle">Last updated {updated}</p> : null}
        </header>
        <div className="mt-8 sm:mt-10">{children}</div>
      </div>
    </div>
  );
}

/** Readable long text: headings, paragraphs, lists and links. */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-[15px] leading-relaxed text-ink-3",
        "[&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:tracking-[-0.01em] [&_h2]:text-ink first:[&_h2]:mt-0",
        "[&_h3]:mt-6 [&_h3]:font-bold [&_h3]:text-ink",
        "[&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5",
        "[&_a]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-ink",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Numbered steps, e.g. how Buy now works. */
export function Steps({ steps }: { steps: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-4 rounded-2xl border border-line bg-card p-4 sm:p-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
          <div>
            <p className="font-bold">{s.title}</p>
            <div className="mt-1 text-sm leading-relaxed text-muted">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** A grid of cards that link to other pages. */
export function LinkCards({ items }: { items: { href: string; title: string; body: string }[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((i) => (
        <li key={i.href + i.title}>
          <Link href={i.href} className="block h-full rounded-2xl border border-line bg-card p-4 transition-colors hover:border-ink/30 hover:bg-paper sm:p-5">
            <p className="font-bold">{i.title}</p>
            <p className="mt-1 text-sm text-muted">{i.body}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Green is only for trust: a short reassurance box. */
export function TrustNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 rounded-2xl bg-brand-50 px-4 py-3.5 text-sm leading-relaxed text-brand-700">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** A closing call to action. */
export function CtaBox({ title, body, href, label }: { title: string; body: string; href: string; label: string }) {
  return (
    <div className="mt-12 flex flex-col items-start gap-4 rounded-[20px] bg-ink p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div>
        <p className="text-lg font-extrabold">{title}</p>
        <p className="mt-1 text-sm text-white/70">{body}</p>
      </div>
      <Link href={href} className="inline-flex h-11 shrink-0 items-center rounded-[10px] bg-white px-5 text-sm font-semibold text-ink hover:bg-sand">
        {label}
      </Link>
    </div>
  );
}
