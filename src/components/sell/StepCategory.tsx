"use client";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { rootCategories } from "@/lib/mock/categories";
import { cn } from "@/lib/utils";
import { FieldError, StepHeading } from "./Fields";
import type { Errors, SellForm } from "./types";

type Props = {
  form: SellForm;
  errors: Errors;
  onPick: (rootSlug: string, subSlug: string) => void;
};

export function StepCategory({ form, errors, onPick }: Props) {
  const root = rootCategories.find((c) => c.slug === form.rootCategory);

  return (
    <div>
      <StepHeading title="What are you selling?" hint="Pick the category that fits best. It helps buyers find your item." />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {rootCategories.map((c) => {
          const active = form.rootCategory === c.slug;
          return (
            <li key={c.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onPick(c.slug, active ? form.category : "")}
                className={cn(
                  "flex h-full w-full flex-col items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-[border-color,box-shadow]",
                  active ? "border-ink shadow-[var(--shadow-card)] ring-1 ring-ink" : "border-line hover:border-ink/30",
                )}
              >
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", active ? "bg-ink text-white" : "bg-sand text-ink")}>
                  <CategoryIcon name={c.icon} className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold leading-snug">{c.name}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {root ? (
        <div className="mt-6 animate-fade-up">
          <p className="mb-3 text-sm font-semibold">Which one in {root.name}?</p>
          <div className="flex flex-wrap gap-2">
            {root.children.map((sub) => {
              const active = form.category === sub.slug;
              return (
                <button
                  key={sub.slug}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onPick(root.slug, sub.slug)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    active ? "border-ink bg-ink text-white" : "border-line-strong bg-card text-ink-3 hover:border-ink/30 hover:text-ink",
                  )}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <FieldError message={errors.category} />
    </div>
  );
}
