"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

type SettingRow = {
  key: string;
  group: string;
  label: string;
  hint: string;
  type: "integer" | "decimal" | "choice";
  min: number | null;
  max: number | null;
  options: { value: string; label: string }[] | null;
  value: number | string;
};

type Change = { label: string; from: string | null; to: string | null; by: string; at: string };

type Payload = { data: SettingRow[]; changes: Change[] };

const when = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

async function call(url: string, init?: RequestInit): Promise<Payload> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { Accept: "application/json", ...init?.headers }, cache: "no-store" });
  } catch {
    throw new Error("No internet connection. Please try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.message ?? "Something went wrong. Please try again.") as Error & { fields?: Record<string, string[]> };
    err.fields = body?.errors;
    throw err;
  }
  return body as Payload;
}

/** Fee for a price in kobo, using the values typed in the form (before saving). */
function previewFee(priceKobo: number, percent: number, capNaira: number) {
  const fee = Math.round((priceKobo * percent) / 100);
  return capNaira > 0 ? Math.min(fee, capNaira * 100) : fee;
}

export function AdminSettings() {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saved, setSaved] = useState(false);

  const apply = useCallback((p: Payload) => {
    setRows(p.data);
    setChanges(p.changes);
    setDraft(Object.fromEntries(p.data.map((r) => [r.key, String(r.value)])));
  }, []);

  useEffect(() => {
    call("/api/admin/settings")
      .then(apply)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [apply]);

  const dirty = useMemo(() => rows.filter((r) => draft[r.key] !== undefined && draft[r.key] !== String(r.value)), [rows, draft]);

  const groups = useMemo(() => {
    const map = new Map<string, SettingRow[]>();
    for (const r of rows) map.set(r.group, [...(map.get(r.group) ?? []), r]);
    return [...map.entries()];
  }, [rows]);

  async function save() {
    setSaving(true);
    setError("");
    setFieldErrors({});
    setSaved(false);
    try {
      const body: Record<string, string | number> = {};
      for (const r of dirty) body[r.key] = r.type === "choice" ? draft[r.key] : Number(draft[r.key]);
      apply(await call("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      const err = e as Error & { fields?: Record<string, string[]> };
      setError(err.fields ? "Please fix the highlighted values." : err.message);
      setFieldErrors(err.fields ?? {});
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-6 max-w-2xl space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  const percent = Number(draft.fee_percent ?? 0) || 0;
  const cap = Number(draft.fee_cap_naira ?? 0) || 0;

  return (
    <div className="mt-6 max-w-2xl pb-24 sm:pb-0">
      {error ? <p className="mb-4 rounded-xl bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p> : null}

      <div className="space-y-5">
        {groups.map(([group, items]) => (
          <section key={group} className="rounded-2xl border border-line bg-card p-4 sm:p-5">
            <h2 className="font-extrabold">{group}</h2>
            <div className="mt-4 space-y-5">
              {items.map((r) => (
                <Field
                  key={r.key}
                  row={r}
                  value={draft[r.key] ?? ""}
                  error={fieldErrors[r.key]?.[0]}
                  changed={draft[r.key] !== String(r.value)}
                  onChange={(v) => setDraft((d) => ({ ...d, [r.key]: v }))}
                />
              ))}
            </div>

            {group === "Buy now fee" ? (
              <div className="mt-5 rounded-xl bg-sand p-3">
                <p className="text-xs font-semibold text-muted">What sellers pay</p>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  {[1_000_000, 10_000_000, 100_000_000].map((price) => {
                    const fee = previewFee(price, percent, cap);
                    return (
                      <div key={price} className="rounded-lg bg-card px-2 py-2">
                        <dt className="text-muted">{formatNaira(price)} item</dt>
                        <dd className="mt-0.5 text-sm font-extrabold">{formatNaira(fee)}</dd>
                      </div>
                    );
                  })}
                </dl>
                <p className="mt-2 text-[11px] text-subtle">Only orders placed after you save use the new fee.</p>
              </div>
            ) : null}
          </section>
        ))}
      </div>

      {/* Save: inline on desktop, a bar on phones when something changed */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 sm:static sm:mt-5 sm:border-0 sm:bg-transparent sm:p-0",
          !dirty.length && !saved && "hidden sm:block",
        )}
      >
        <button
          type="button"
          disabled={!dirty.length || saving}
          onClick={save}
          className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink px-6 text-[15px] font-semibold text-white transition-colors hover:bg-ink-3 disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Saving…" : saved ? "Saved" : dirty.length ? `Save ${dirty.length} change${dirty.length === 1 ? "" : "s"}` : "No changes"}
        </button>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-bold">Recent changes</h2>
        {changes.length === 0 ? <p className="mt-2 text-sm text-muted">Nothing changed yet.</p> : null}
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
          {changes.map((c, i) => (
            <li key={i} className="px-4 py-3 text-sm">
              <p>
                <span className="font-semibold">{c.label}</span>: {c.from ?? "—"} → <span className="font-semibold">{c.to ?? "—"}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {c.by} · {when.format(new Date(c.at))}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Field({
  row,
  value,
  error,
  changed,
  onChange,
}: {
  row: SettingRow;
  value: string;
  error?: string;
  changed: boolean;
  onChange: (v: string) => void;
}) {
  const id = `setting-${row.key}`;
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold">
        {row.label}
        {changed ? <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">Unsaved</span> : null}
      </label>
      <p className="mt-0.5 text-xs text-muted">{row.hint}</p>

      {row.type === "choice" && row.options ? (
        <div className="mt-2 space-y-1.5" role="radiogroup" aria-labelledby={id}>
          {row.options.map((o) => (
            <button
              key={o.value}
              id={o.value === value ? id : undefined}
              type="button"
              role="radio"
              aria-checked={value === o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                "flex h-11 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm font-semibold transition-colors",
                value === o.value ? "border-ink bg-sand ring-1 ring-ink" : "border-line-strong hover:bg-paper",
              )}
            >
              <span className={cn("h-4 w-4 shrink-0 rounded-full border-2", value === o.value ? "border-ink bg-ink shadow-[inset_0_0_0_2px_white]" : "border-line-strong")} />
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <input
          id={id}
          type="number"
          inputMode={row.type === "decimal" ? "decimal" : "numeric"}
          step={row.type === "decimal" ? "0.1" : "1"}
          min={row.min ?? undefined}
          max={row.max ?? undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "mt-2 h-11 w-full rounded-xl border bg-card px-3 text-base font-semibold outline-none focus:border-ink sm:w-48 sm:text-sm",
            error ? "border-danger-500" : "border-line-strong",
          )}
        />
      )}
      {row.min !== null && row.max !== null && row.type !== "choice" ? (
        <p className="mt-1 text-[11px] text-subtle">
          Allowed: {row.min.toLocaleString("en-NG")} to {row.max.toLocaleString("en-NG")}
        </p>
      ) : null}
      {error ? <p className="mt-1 text-xs font-medium text-danger-600">{error}</p> : null}
    </div>
  );
}
