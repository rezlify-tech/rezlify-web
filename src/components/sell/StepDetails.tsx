"use client";

import { FilterSelect } from "@/components/ui/FilterSelect";
import { categoryFields } from "@/lib/mock/category-fields";
import { conditions } from "@/lib/mock/filters";
import { ChoiceChip, FieldError, StepHeading, Switch } from "./Fields";
import { DESCRIPTION_MAX, DESCRIPTION_MIN, TITLE_MAX, fieldClass, labelClass, type Errors, type SellForm } from "./types";

type Props = {
  form: SellForm;
  errors: Errors;
  set: <K extends keyof SellForm>(key: K, value: SellForm[K]) => void;
};

export function StepDetails({ form, errors, set }: Props) {
  const fields = categoryFields[form.category] ?? [];

  const setSpec = (key: string, value: string) => set("specs", { ...form.specs, [key]: value });

  return (
    <div className="space-y-6">
      <StepHeading title="Describe your item" hint="Clear details mean fewer questions and faster sales." />

      <div>
        <label htmlFor="sell-title" className={labelClass}>
          Title
        </label>
        <input
          id="sell-title"
          value={form.title}
          maxLength={TITLE_MAX}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. iPhone 13 Pro 256GB, Sierra Blue"
          className={fieldClass}
        />
        <div className="mt-1 flex justify-between gap-3">
          <FieldError message={errors.title} />
          <span className="ml-auto mt-1.5 text-xs text-subtle">
            {form.title.length}/{TITLE_MAX}
          </span>
        </div>
      </div>

      <div>
        <p className={labelClass}>Condition</p>
        <div className="flex flex-wrap gap-2">
          {conditions.map((c) => (
            <ChoiceChip key={c.value} active={form.condition === c.value} onClick={() => set("condition", c.value)}>
              {c.label}
            </ChoiceChip>
          ))}
        </div>
        <FieldError message={errors.condition} />
      </div>

      {fields.length ? (
        <div className="rounded-2xl border border-line bg-paper p-4 sm:p-5">
          <p className="text-sm font-bold">Item details</p>
          <p className="mt-0.5 text-xs text-muted">Buyers use these to filter. Fields marked * are required.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fields.map((f) => {
              const label = `${f.label}${f.required ? " *" : ""}`;
              const value = form.specs[f.key] ?? "";
              const error = errors[`spec_${f.key}`];

              if (f.type === "select") {
                return (
                  <div key={f.key}>
                    <FilterSelect
                      label={label}
                      name={`spec_${f.key}`}
                      placeholder="Choose"
                      value={value}
                      onChange={(v) => setSpec(f.key, v)}
                      options={(f.options ?? []).map((o) => ({ id: o, label: o }))}
                    />
                    <FieldError message={error} />
                  </div>
                );
              }

              if (f.type === "boolean") {
                return (
                  <div key={f.key} className="sm:pt-6">
                    <Switch label={f.label} checked={value === "yes"} onChange={(v) => setSpec(f.key, v ? "yes" : "")} />
                  </div>
                );
              }

              return (
                <div key={f.key}>
                  <label htmlFor={`spec-${f.key}`} className="mb-1.5 block text-xs font-semibold text-muted">
                    {label}
                  </label>
                  <input
                    id={`spec-${f.key}`}
                    value={value}
                    inputMode={f.type === "number" ? "decimal" : undefined}
                    onChange={(e) => setSpec(f.key, f.type === "number" ? e.target.value.replace(/[^\d.]/g, "") : e.target.value)}
                    className={fieldClass}
                  />
                  <FieldError message={error} />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor="sell-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="sell-description"
          rows={6}
          value={form.description}
          maxLength={DESCRIPTION_MAX}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What's included? Any faults or repairs? Why are you selling? Where can buyers check it?"
          className={`${fieldClass} h-auto resize-y py-3 leading-relaxed`}
        />
        <div className="mt-1 flex justify-between gap-3">
          <FieldError message={errors.description} />
          <span className="ml-auto mt-1.5 text-xs text-subtle">
            {form.description.length < DESCRIPTION_MIN
              ? `${DESCRIPTION_MIN - form.description.length} more characters needed`
              : `${form.description.length}/${DESCRIPTION_MAX}`}
          </span>
        </div>
      </div>
    </div>
  );
}
