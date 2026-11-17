"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

async function post(path: string, body: unknown): Promise<string> {
  let res: Response;
  try {
    res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("No internet connection. Please check and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const first = Object.values((data?.errors ?? {}) as Record<string, string[]>)[0]?.[0];
    throw new Error(first ?? data?.message ?? "Something went wrong. Please try again.");
  }
  return data?.message ?? "Done.";
}

const input =
  "mt-1.5 h-12 w-full rounded-[10px] border border-line-strong bg-card px-3.5 text-base outline-none transition-colors focus:border-ink";
const button =
  "mt-5 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-ink-3 disabled:opacity-60";

function Card({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-[20px] border border-line bg-card p-6 shadow-[var(--shadow-lift)] sm:p-8">
      <h1 className="text-2xl font-extrabold tracking-[-0.02em]">{title}</h1>
      <p className="mt-1.5 text-sm text-muted">{intro}</p>
      {children}
    </div>
  );
}

/** "Forgot password?": ask for a reset link by email. */
export function ForgotPasswordForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setSent(await post("/api/auth/forgot-password", { email: email.trim() }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Card title="Check your email" intro={sent}>
        <p className="mt-4 text-sm text-muted">The link works once, for 60 minutes. Nothing arrived? Check spam, or try again in a minute.</p>
        <Link href="/login" className={button}>
          Back to sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card title="Forgot your password?" intro="Enter your account's email and we'll send you a link to choose a new one.">
      <form onSubmit={submit} className="mt-6">
        <label className="block">
          <span className="text-sm font-semibold">Email</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>
        {error ? <p className="mt-3 text-sm font-medium text-danger-600">{error}</p> : null}
        <button type="submit" disabled={busy} className={button}>
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-ink underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}

/** The page the email links to: choose a new password. */
export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  if (!token || !email) {
    return (
      <Card title="This link isn't complete" intro="Open the link from the email again, or ask for a new one.">
        <Link href="/forgot-password" className={button}>
          Get a new link
        </Link>
      </Card>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setDone(await post("/api/auth/reset-password", { token, email, password }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card title="Password changed" intro={done}>
        <p className="mt-4 text-sm text-muted">For your safety, you&apos;ve been signed out on your other devices.</p>
        <button type="button" onClick={() => router.push(`/login?email=${encodeURIComponent(email)}`)} className={button}>
          Sign in
        </button>
      </Card>
    );
  }

  const strongEnough = password.length >= 8 && /[a-z]/i.test(password) && /\d/.test(password);

  return (
    <Card title="Choose a new password" intro={`For ${email}`}>
      <form onSubmit={submit} className="mt-6">
        <label className="block">
          <span className="text-sm font-semibold">New password</span>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${input} pr-16`}
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 mt-[3px] -translate-y-1/2 px-2 text-xs font-semibold text-muted hover:text-ink">
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <span className="mt-1.5 block text-xs text-muted">At least 8 characters, with letters and numbers.</span>
        </label>
        {error ? (
          <p className="mt-3 text-sm font-medium text-danger-600">
            {error}{" "}
            {error.includes("expired") ? (
              <Link href={`/forgot-password?email=${encodeURIComponent(email)}`} className="underline">
                Get a new link
              </Link>
            ) : null}
          </p>
        ) : null}
        <button type="submit" disabled={busy || !strongEnough} className={button}>
          {busy ? "Saving…" : "Save new password"}
        </button>
      </form>
    </Card>
  );
}
