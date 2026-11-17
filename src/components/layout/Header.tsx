import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { ButtonLink } from "@/components/ui/Button";
import { rootCategories } from "@/lib/mock/categories";
import { cn } from "@/lib/utils";
import { HeaderAccount, type HeaderUser } from "./HeaderAccount";
import { HeaderSearch } from "./HeaderSearch";
import { SearchBar } from "./SearchBar";
import { site } from "@/lib/site";

export type { HeaderUser } from "./HeaderAccount";

function CategoryStrip() {
  return (
    <nav aria-label="Categories" className="border-t border-line lg:hidden">
      <div className="container-x">
        <ul className="no-scrollbar -mx-1 flex snap-x gap-1 overflow-x-auto py-2">
          {rootCategories.map((c) => (
            <li key={c.id} className="snap-start">
              <Link
                href={`/c/${c.slug}`}
                className="flex h-9 items-center gap-2 whitespace-nowrap rounded-[10px] px-3 text-sm font-medium text-ink-3 transition-colors hover:bg-sand hover:text-ink"
              >
                <CategoryIcon name={c.icon} className="h-[18px] w-[18px] text-subtle" />
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function Header({ user, className }: { user?: HeaderUser | null; className?: string }) {
  return (
    <header className={cn("sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/85", className)}>
      <div className="container-x">
        <div className="flex h-16 items-center gap-2 sm:gap-3 lg:gap-6">
          <Link href="/" aria-label={`${site.name} home`} className="shrink-0">
            <Logo />
          </Link>

          {/* Desktop search */}
          <Suspense fallback={<SearchBar className="hidden max-w-2xl flex-1 md:block" />}>
            <HeaderSearch className="hidden max-w-2xl flex-1 md:block" />
          </Suspense>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            <HeaderAccount user={user} />
            <ButtonLink href="/sell" size="sm" variant="dark" className="ml-1 h-9 gap-1 px-3 sm:ml-1.5 sm:h-10 sm:px-4">
              <svg viewBox="0 0 20 20" className="h-4 w-4 sm:hidden" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <path d="M10 4.5v11M4.5 10h11" />
              </svg>
              Sell
            </ButtonLink>
          </div>
        </div>

        {/* Mobile search */}
        <div className="pb-3 md:hidden">
          <Suspense fallback={<SearchBar id="site-search-mobile" />}>
            <HeaderSearch id="site-search-mobile" />
          </Suspense>
        </div>
      </div>

      <CategoryStrip />
    </header>
  );
}
