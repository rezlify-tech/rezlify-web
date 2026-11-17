import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content/ContentPage";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { rootCategories } from "@/lib/mock/categories";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "All categories",
  description: `Browse everything for sale on ${site.name}: phones, computers, electronics, home, fashion, books and more.`,
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <ContentPage eyebrow="Browse" title="All categories" intro="Pick a category, or go straight to what you need." wide>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rootCategories.map((c) => (
          <li key={c.id} className="rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-card)]">
            <Link href={`/c/${c.slug}`} className="group flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sand text-ink">
                <CategoryIcon name={c.icon} className="h-5 w-5" />
              </span>
              <span className="text-base font-extrabold group-hover:underline">{c.name}</span>
            </Link>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {c.children.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/c/${s.slug}`}
                    className="inline-flex h-8 items-center rounded-full bg-sand px-3 text-xs font-semibold text-ink-3 transition-colors hover:bg-line hover:text-ink"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </ContentPage>
  );
}
