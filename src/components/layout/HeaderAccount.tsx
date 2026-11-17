"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "@/components/ui/Badge";
import { useUnreadCount } from "@/lib/chat";
import { signOut, useSession, useSessionStatus } from "@/lib/session";
import { cn } from "@/lib/utils";

export type HeaderUser = {
  name: string;
  email?: string;
  avatarUrl?: string | null;
  unreadMessages?: number;
  isStaff?: boolean;
  isVerified?: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function CountBadge({ count, className }: { count?: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-card",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function IconLink({
  href,
  label,
  count,
  className,
  children,
}: {
  href: string;
  label: string;
  count?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={count ? `${label}, ${count} unread` : label}
      title={label}
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-ink-3 transition-colors hover:bg-sand hover:text-ink",
        className,
      )}
    >
      {children}
      <CountBadge count={count} />
    </Link>
  );
}

const Icon = {
  messages: (
    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5v-8Z" />
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />,
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.4 7.5 9.5 4.4-1.1 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" />
    </>
  ),
  ads: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </>
  ),
  orders: (
    <>
      <path d="M5 7.5h14l-1.2 11a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7.5Z" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  verify: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.4 2.4 4.6-4.8" />
    </>
  ),
  out: <path d="M14 4.5h3.5A2 2 0 0 1 19.5 6.5v11a2 2 0 0 1-2 2H14M10 16l-4-4 4-4M6 12h9" />,
};

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-[22px] w-[22px]", className)} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

function AvatarCircle({ user, className }: { user: HeaderUser; className?: string }) {
  return (
    <span className={cn("flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-ink text-xs font-bold text-white", className)}>
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials(user.name)
      )}
    </span>
  );
}

/**
 * Your photo in the header. Opens a menu with everything about your account,
 * which keeps the header itself to a few icons (important on phones).
 */
function AccountMenu({ user, preview }: { user: HeaderUser; preview: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close when you go to another page.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-sand";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Your account"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative ml-0.5 flex h-10 w-10 items-center justify-center rounded-full transition-shadow"
      >
        <AvatarCircle user={user} className={cn("ring-2 transition-shadow", open ? "ring-ink" : "ring-card hover:ring-line-strong")} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-[var(--shadow-lift)] animate-fade-up"
        >
          <div className="flex items-center gap-3 px-3 pb-3 pt-2.5">
            <AvatarCircle user={user} className="h-10 w-10" />
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-sm font-bold">
                <span className="truncate">{user.name}</span>
                {user.isVerified ? (
                  <span className="shrink-0 text-brand-500" title="Verified seller">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                ) : null}
              </p>
              {user.email ? <p className="truncate text-xs text-muted">{user.email}</p> : null}
            </div>
          </div>
          <div className="border-t border-line pt-1.5">
            <Link href="/account/ads" role="menuitem" className={item}>
              <Svg className="h-5 w-5 text-subtle">{Icon.ads}</Svg>
              My ads
            </Link>
            <Link href="/account/orders" role="menuitem" className={item}>
              <Svg className="h-5 w-5 text-subtle">{Icon.orders}</Svg>
              Orders
            </Link>
            <Link href="/messages" role="menuitem" className={item}>
              <Svg className="h-5 w-5 text-subtle">{Icon.messages}</Svg>
              Messages
              {user.unreadMessages ? (
                <span className="ml-auto rounded-full bg-danger-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{user.unreadMessages}</span>
              ) : null}
            </Link>
            <Link href="/saved" role="menuitem" className={item}>
              <Svg className="h-5 w-5 text-subtle">{Icon.heart}</Svg>
              Saved items
            </Link>
            {user.isVerified ? (
              <Link href="/verify" role="menuitem" className={item}>
                <span className="flex h-5 w-5 items-center justify-center text-brand-500">
                  <ShieldCheck className="h-[18px] w-[18px]" />
                </span>
                Verified seller
                <span className="ml-auto rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-700">Verified</span>
              </Link>
            ) : (
              <Link href="/verify" role="menuitem" className={item}>
                <Svg className="h-5 w-5 text-subtle">{Icon.verify}</Svg>
                Get verified
              </Link>
            )}
            {user.isStaff ? (
              <Link href="/admin/listings" role="menuitem" className={item}>
                <Svg className="h-5 w-5 text-subtle">{Icon.shield}</Svg>
                Moderation
              </Link>
            ) : null}
          </div>
          <div className="mt-1 border-t border-line pt-1.5">
            <Link href="/account/settings" role="menuitem" className={item}>
              <Svg className="h-5 w-5 text-subtle">{Icon.settings}</Svg>
              Settings
            </Link>
            <Link href="/sell" role="menuitem" className={cn(item, "sm:hidden")}>
              <Svg className="h-5 w-5 text-subtle">{Icon.plus}</Svg>
              Post an ad
            </Link>
            <button
              type="button"
              role="menuitem"
              disabled={preview}
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.replace("/");
              }}
              className={cn(item, "text-danger-600 hover:bg-danger-50")}
            >
              <Svg className="h-5 w-5">{Icon.out}</Svg>
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Right side of the header.
 * Phones: Messages and your photo (everything else is in its menu).
 * Bigger screens: also Saved and, for staff, Moderation.
 */
export function HeaderAccount({ user: preview }: { user?: HeaderUser | null }) {
  const session = useSession();
  const status = useSessionStatus();
  const unread = useUnreadCount(!preview && status === "authenticated" && session ? session.id : null);
  const user: HeaderUser | null =
    preview ??
    (session
      ? {
          name: session.name,
          email: session.email,
          avatarUrl: session.avatarUrl,
          unreadMessages: unread,
          isStaff: session.isStaff,
          isVerified: session.isVerified,
        }
      : null);

  // While we check the cookie, hold the space so the header doesn't jump.
  if (!user && status === "loading") {
    return <span className="skeleton h-9 w-16 rounded-[10px]" aria-hidden />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-10 items-center whitespace-nowrap rounded-[10px] px-2.5 text-sm font-semibold text-ink-3 transition-colors hover:bg-sand hover:text-ink sm:px-3"
      >
        Sign in
      </Link>
    );
  }

  return (
    <>
      {user.isStaff ? (
        <IconLink href="/admin/listings" label="Moderation" className="hidden sm:flex">
          <Svg>{Icon.shield}</Svg>
        </IconLink>
      ) : null}
      <IconLink href="/messages" label="Messages" count={user.unreadMessages}>
        <Svg>{Icon.messages}</Svg>
      </IconLink>
      <IconLink href="/saved" label="Saved items" className="hidden sm:flex">
        <Svg>{Icon.heart}</Svg>
      </IconLink>
      <AccountMenu user={user} preview={Boolean(preview)} />
    </>
  );
}
