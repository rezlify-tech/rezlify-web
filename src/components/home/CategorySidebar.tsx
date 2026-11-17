import Link from "next/link";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { rootCategories } from "@/lib/mock/categories";
import { brandsBySubcategory } from "@/lib/mock/filters";

const count = new Intl.NumberFormat("en-NG");

/**
 * Desktop category menu. Hovering (or tabbing into) a category opens a panel
 * over the banner with its sub-categories and popular brands as one-click shortcuts.
 */
export function CategorySidebar() {
  return (
    <nav aria-label="Browse categories" className="relative hidden lg:block">
      <div className="flex h-full flex-col rounded-[20px] border border-line bg-card p-2 shadow-[var(--shadow-card)]">
        <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-subtle">Categories</p>
        <ul>
          {rootCategories.map((c) => (
            <li key={c.id} className="group/item">
              <Link
                href={`/c/${c.slug}`}
                className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-ink-3 transition-colors hover:bg-sand hover:text-ink group-focus-within/item:bg-sand group-focus-within/item:text-ink"
              >
                <CategoryIcon name={c.icon} className="h-[18px] w-[18px] shrink-0 text-subtle transition-colors group-hover/item:text-ink" />
                <span className="flex-1 truncate">{c.name}</span>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-line-strong group-hover/item:text-ink" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="m6 3.5 4.5 4.5L6 12.5" />
                </svg>
              </Link>

              {/* Flyout panel */}
              {/* The transparent left padding bridges the gap so the panel stays open while the mouse crosses over. */}
              <div className="invisible absolute left-full top-0 z-30 h-full pl-3 opacity-0 transition-[opacity,visibility] duration-150 group-focus-within/item:visible group-focus-within/item:opacity-100 group-hover/item:visible group-hover/item:opacity-100">
              <div className="h-full w-[min(720px,calc(100vw-360px))] overflow-y-auto rounded-[20px] border border-line bg-card p-7 shadow-[var(--shadow-lift)]">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sand text-ink">
                      <CategoryIcon name={c.icon} className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="text-lg font-extrabold tracking-[-0.01em]">{c.name}</h3>
                      <p className="text-sm text-muted">{count.format(c.listingCount)} items for sale</p>
                    </div>
                  </div>
                  <Link href={`/c/${c.slug}`} className="shrink-0 text-sm font-semibold text-ink underline-offset-4 hover:underline">
                    View all
                  </Link>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-6">
                  {c.children.map((sub) => {
                    const brands = brandsBySubcategory[sub.slug]?.slice(0, 7) ?? [];
                    return (
                      <div key={sub.slug}>
                        <Link href={`/c/${sub.slug}`} className="text-[15px] font-bold text-ink underline-offset-4 hover:underline">
                          {sub.name}
                        </Link>
                        {brands.length ? (
                          <ul className="mt-2.5 space-y-1.5">
                            {brands.map((b) => (
                              <li key={b}>
                                <Link
                                  href={`/c/${sub.slug}?brand=${encodeURIComponent(b)}`}
                                  className="text-sm text-muted transition-colors hover:text-ink"
                                >
                                  {b}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2.5 text-sm text-subtle">Browse all {sub.name.toLowerCase()}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Fills the space under the list with the other half of the marketplace: selling */}
        <div className="mt-auto rounded-2xl bg-sand p-4">
          <p className="text-sm font-bold text-ink">Got something to sell?</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">Post an ad in 2 minutes. It&apos;s free.</p>
          <Link
            href="/sell"
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-[10px] bg-ink text-sm font-semibold text-white transition-colors hover:bg-ink-3"
          >
            Post an ad
          </Link>
        </div>
      </div>
    </nav>
  );
}
