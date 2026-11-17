"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";

/** A slim reminder for signed-in people who haven't confirmed their email yet. */
export function EmailVerifyBanner() {
  const user = useSession();
  const path = usePathname();

  if (!user || user.emailVerified || path.startsWith("/verify-email") || path.startsWith("/messages")) return null;

  return (
    <div className="border-b border-line bg-sand">
      <div className="container-x flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-sm">
        <p className="text-ink-3">Confirm your email to post ads, message sellers and use Buy now.</p>
        <Link href={`/verify-email?next=${encodeURIComponent(path)}`} className="font-semibold text-ink underline underline-offset-2">
          Confirm now
        </Link>
      </div>
    </div>
  );
}
