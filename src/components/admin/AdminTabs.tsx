"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin/listings", label: "Ads", adminOnly: false },
  { href: "/admin/orders", label: "Orders", adminOnly: false },
  { href: "/admin/reports", label: "Reports", adminOnly: false },
  { href: "/admin/users", label: "Users", adminOnly: false },
  { href: "/admin/settings", label: "Settings", adminOnly: true },
];

/** Switch between the staff pages. Settings shows for admins only. */
export function AdminTabs({ isAdmin = false }: { isAdmin?: boolean }) {
  const path = usePathname();
  return (
    <nav className="mt-4 inline-flex max-w-full overflow-x-auto rounded-xl bg-sand p-1" aria-label="Staff pages">
      {tabs.filter((t) => isAdmin || !t.adminOnly).map((t) => {
        const active = path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded-lg px-4 text-sm font-semibold transition-colors",
              active ? "bg-card text-ink shadow-[var(--shadow-card)]" : "text-muted hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
