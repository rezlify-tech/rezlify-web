const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Prices come from the API in kobo. 2500000 -> "₦25,000" */
export function formatNaira(kobo: number): string {
  return naira.format(Math.round(kobo / 100));
}

/** Short form for tight spaces. 250000000 -> "₦2.5M" */
export function formatNairaShort(kobo: number): string {
  const value = kobo / 100;
  if (value >= 1_000_000) return `₦${trim(value / 1_000_000)}M`;
  if (value >= 1_000) return `₦${trim(value / 1_000)}K`;
  return `₦${Math.round(value)}`;
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

const monthYear = new Intl.DateTimeFormat("en-NG", { month: "short", year: "numeric" });

/** "Member since Nov 2026" */
export function memberSince(iso: string): string {
  return `Member since ${monthYear.format(new Date(iso))}`;
}

/** "just now", "5 min ago", "3 hours ago", "2 days ago", then a date. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" }).format(new Date(iso));
}
