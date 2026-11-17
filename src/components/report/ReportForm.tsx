"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type ReportType = "listing" | "user" | "message";

type Reason = "scam" | "fake_item" | "prohibited" | "wrong_category" | "offensive" | "other";

/** Only the reasons that make sense for what's being reported, in plain words. */
const REASONS: Record<ReportType, { id: Reason; label: string }[]> = {
  listing: [
    { id: "scam", label: "It looks like a scam" },
    { id: "fake_item", label: "Fake or a copy sold as original" },
    { id: "prohibited", label: "Item isn't allowed" },
    { id: "wrong_category", label: "Wrong category or misleading" },
    { id: "offensive", label: "Offensive photos or text" },
    { id: "other", label: "Something else" },
  ],
  user: [
    { id: "scam", label: "Tried to scam me" },
    { id: "fake_item", label: "Sells fakes" },
    { id: "offensive", label: "Rude, abusive or threatening" },
    { id: "other", label: "Something else" },
  ],
  message: [
    { id: "scam", label: "Asking to pay outside Rezlify, or a scam" },
    { id: "offensive", label: "Rude, abusive or threatening" },
    { id: "other", label: "Something else" },
  ],
};

const titles: Record<ReportType, string> = {
  listing: "Report this ad",
  user: "Report this person",
  message: "Report this message",
};

export function ReportForm({ type, id, subject, back }: { type: ReportType; id: string; subject: string; back: string }) {
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const needsDetails = reason === "other";
  const ready = reason !== null && (!needsDetails || details.trim().length >= 5);

  async function submit() {
    if (!reason) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ type, id, reason, details: details.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      if (!res.ok) {
        const first = Object.values((body?.errors ?? {}) as Record<string, string[]>)[0]?.[0];
        throw new Error(first ?? body?.message ?? "Something went wrong. Please try again.");
      }
      setDone(body.message ?? "Thanks. Our team will look into it.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="mt-4 rounded-[20px] border border-line bg-card p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sand text-ink">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h1 className="mt-4 text-lg font-extrabold">Report sent</h1>
        <p className="mt-1 text-sm text-muted">{done}</p>
        {type !== "listing" ? (
          <p className="mt-3 text-xs text-muted">You can also block them from the chat menu so they can&apos;t message you.</p>
        ) : null}
        <Link href={back} className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-3">
          Done
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-[20px] border border-line bg-card p-5 sm:p-6">
      <h1 className="text-xl font-extrabold tracking-[-0.01em]">{titles[type]}</h1>
      <p className="mt-1 truncate text-sm text-muted">{subject}</p>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">What&apos;s wrong?</legend>
        <div className="mt-2 space-y-1.5">
          {REASONS[type].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setReason(r.id)}
              aria-pressed={reason === r.id}
              className={cn(
                "flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors",
                reason === r.id ? "border-ink bg-sand ring-1 ring-ink" : "border-line-strong hover:bg-paper",
              )}
            >
              <span className={cn("h-4 w-4 shrink-0 rounded-full border-2", reason === r.id ? "border-ink bg-ink shadow-[inset_0_0_0_2px_white]" : "border-line-strong")} />
              {r.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block">
        <span className="text-sm font-semibold">{needsDetails ? "Tell us what happened" : "Anything else? (optional)"}</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 2000))}
          rows={4}
          placeholder="e.g. They asked me to pay a deposit to an Opay account before meeting."
          className="mt-1.5 w-full resize-none rounded-xl border border-line-strong bg-card px-3 py-2.5 text-base outline-none focus:border-ink sm:text-sm"
        />
      </label>

      {error ? <p className="mt-2 text-sm font-medium text-danger-600">{error}</p> : null}

      <button
        type="button"
        disabled={!ready || busy}
        onClick={submit}
        className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-ink-3 disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send report"}
      </button>
      <p className="mt-3 text-center text-xs text-muted">We won&apos;t tell them who reported. If you&apos;re in danger, contact the police first.</p>
    </section>
  );
}
