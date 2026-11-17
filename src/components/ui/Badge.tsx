import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "success" | "amber" | "danger" | "dark";

const tones: Record<Tone, string> = {
  neutral: "bg-sand text-ink-3 ring-line",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  success: "bg-success-50 text-success-700 ring-success-200",
  amber: "bg-amber-500/12 text-amber-600 ring-amber-500/30",
  danger: "bg-danger-50 text-danger-600 ring-danger-500/25",
  dark: "bg-ink text-white ring-ink",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Shield with a tick. `tick` sets the tick colour (white by default; use a brand colour on white shields). */
export function ShieldCheck({ className, tick = "#fff" }: { className?: string; tick?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("h-4 w-4", className)} aria-hidden>
      <path
        d="M10 1.5 17 4v5.1c0 4.3-3 7.6-7 8.9-4-1.3-7-4.6-7-8.9V4l7-2.5Z"
        fill="currentColor"
      />
      <path d="m6.8 9.9 2.2 2.2 4.3-4.4" fill="none" stroke={tick} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Shown next to sellers who passed the ID check. */
export function VerifiedBadge({ compact, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <span className={cn("inline-flex text-brand-500", className)} title="Verified seller">
        <ShieldCheck />
        <span className="sr-only">Verified seller</span>
      </span>
    );
  }
  return (
    <Badge tone="brand" className={className}>
      <ShieldCheck className="h-3.5 w-3.5" />
      Verified seller
    </Badge>
  );
}

const conditionLabels: Record<string, string> = {
  brand_new: "Brand new",
  foreign_used: "Foreign used",
  nigerian_used: "Nigerian used",
  refurbished: "Refurbished",
  faulty: "Faulty",
};

export function ConditionBadge({ condition, className }: { condition: string; className?: string }) {
  return (
    <Badge tone={condition === "brand_new" ? "dark" : condition === "faulty" ? "danger" : "neutral"} className={className}>
      {conditionLabels[condition] ?? condition}
    </Badge>
  );
}
