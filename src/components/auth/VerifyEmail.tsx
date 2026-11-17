"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { refreshSession, safeNext, useSession, useSessionStatus } from "@/lib/session";

async function post(path: string, body?: unknown): Promise<{ message?: string; verified?: boolean }> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("No internet connection. Please try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const first = Object.values((data?.errors ?? {}) as Record<string, string[]>)[0]?.[0];
    throw new Error(first ?? data?.message ?? "Something went wrong. Please try again.");
  }
  return data;
}

const RESEND_SECONDS = 60;

/**
 * Confirm your email with the 6-digit code we sent. The email's button opens this page
 * with the code filled in, and it confirms by itself.
 */
export function VerifyEmail() {
  const params = useSearchParams();
  const router = useRouter();
  const user = useSession();
  const status = useSessionStatus();
  const next = safeNext(params.get("next"), "/");
  const linkCode = (params.get("code") ?? "").replace(/\D/g, "").slice(0, 6);

  const [code, setCode] = useState(linkCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [wait, setWait] = useState(0);
  const autoTried = useRef(false);

  // Signed out (e.g. opened the email on another device): sign in, then come back here.
  useEffect(() => {
    if (status === "guest") {
      const back = `/verify-email?${params.toString()}`;
      router.replace(`/login?next=${encodeURIComponent(back)}`);
    }
  }, [status, params, router]);

  // Already confirmed: carry on.
  useEffect(() => {
    if (user?.emailVerified) router.replace(next);
  }, [user, next, router]);

  // Opened from the email's button: confirm straight away.
  useEffect(() => {
    if (user && !user.emailVerified && linkCode.length === 6 && !autoTried.current) {
      autoTried.current = true;
      void submit(linkCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Resend countdown.
  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  async function submit(value = code) {
    if (value.length !== 6) return;
    setBusy(true);
    setError("");
    try {
      await post("/api/auth/email/verify", { code: value });
      await refreshSession(); // the effect above then moves on to "next"
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work.");
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    setNote("");
    try {
      const res = await post("/api/auth/email/send");
      setNote(res.message ?? "Code sent.");
      setCode("");
      setWait(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send a new code.");
    }
  }

  if (!user || user.emailVerified) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink border-r-transparent" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-[20px] border border-line bg-card p-6 shadow-[var(--shadow-lift)] sm:p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand text-ink">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      </span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.02em]">Confirm your email</h1>
      <p className="mt-1.5 text-sm text-muted">
        We sent a 6-digit code to <span className="font-semibold text-ink">{user.email}</span>. You need it to post ads, message sellers and use Buy now.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mt-6"
      >
        <input
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(v);
            if (v.length === 6) void submit(v);
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="000000"
          aria-label="6-digit code"
          className="h-14 w-full rounded-xl border border-line-strong bg-card text-center font-mono text-2xl font-bold tracking-[0.4em] outline-none focus:border-ink"
        />
        {error ? <p className="mt-3 text-sm font-medium text-danger-600">{error}</p> : null}
        {note && !error ? <p className="mt-3 text-sm text-muted">{note}</p> : null}
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-ink-3 disabled:opacity-50"
        >
          {busy ? "Checking…" : "Confirm"}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
        <button type="button" onClick={resend} disabled={wait > 0} className="font-semibold text-ink underline-offset-2 hover:underline disabled:text-subtle disabled:no-underline">
          {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
        </button>
        <Link href={next} className="text-muted hover:text-ink">
          Do this later
        </Link>
      </div>
      <p className="mt-4 text-xs text-subtle">Can&apos;t find it? Check spam. Wrong email? Sign out and create the account again with the right one.</p>
    </div>
  );
}
