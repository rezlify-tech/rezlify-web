"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthError, register, safeNext, signInWithGoogle, signInWithPassword } from "@/lib/session";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { GoogleButton } from "./GoogleButton";

type Mode = "signin" | "register";

const field =
  "h-12 w-full rounded-[10px] border border-line-strong bg-card px-3.5 text-[15px] text-ink placeholder:text-subtle transition-colors hover:border-ink/25 focus:border-ink/40 focus:outline-none focus:ring-4 focus:ring-ink/5";

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [mode, setMode] = useState<Mode>(
    params.get("mode") === "register" ? "register" : "signin",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register" && name.trim().length < 2)
      return setError("Enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return setError("Enter a valid email address.");
    if (
      mode === "register" &&
      phone &&
      !/^(\+234|0)[789][01]\d{8}$/.test(phone.replace(/\s/g, ""))
    )
      return setError(
        "Enter a valid Nigerian phone number, e.g. 0803 123 4567.",
      );
    if (password.length < 8)
      return setError("Your password needs at least 8 characters.");
    if (mode === "register" && !(/[a-z]/i.test(password) && /\d/.test(password)))
      return setError("Use letters and numbers in your password.");

    setBusy(true);
    try {
      if (mode === "register") {
        await register({ name, email, phone: phone || undefined, password });
        // New account: confirm the email (we just sent the code), then carry on to where they were going.
        router.replace(`/verify-email?next=${encodeURIComponent(next)}`);
        return;
      }
      await signInWithPassword(email, password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  async function google(credential: string) {
    if (credential === "demo") {
      setError("Google sign-in isn't set up yet. Add the Google Client ID to the website and the API.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle(credential);
      router.replace(next);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Google sign-in failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="text-center">
        <h1 className="mt-6 text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
          {mode === "signin" ? "Welcome back" : `Join ${site.name}`}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {mode === "signin"
            ? "Sign in to buy, sell and chat safely."
            : "Free to join. Buy and sell safely across Nigeria."}
        </p>
      </div>

      <div className="mt-6 rounded-[20px] border border-line bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        {/* Sign in / Create account switch */}
        <div
          className="grid grid-cols-2 gap-1 rounded-xl bg-sand p-1"
          role="tablist"
        >
          {(["signin", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className={cn(
                "h-10 rounded-[10px] text-sm font-semibold transition-colors",
                mode === m
                  ? "bg-card text-ink shadow-[var(--shadow-card)]"
                  : "text-muted hover:text-ink",
              )}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <GoogleButton onSignedIn={(profile) => google(profile.credential)} />
        </div>

        <div className="my-5 flex items-center gap-3 text-xs font-medium text-subtle">
          <span className="h-px flex-1 bg-line" />
          or with email
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          {mode === "register" ? (
            <div>
              <label
                htmlFor="auth-name"
                className="mb-1.5 block text-sm font-semibold"
              >
                Full name
              </label>
              <input
                id="auth-name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={field}
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor="auth-email"
              className="mb-1.5 block text-sm font-semibold"
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </div>

          {mode === "register" ? (
            <div>
              <label
                htmlFor="auth-phone"
                className="mb-1.5 block text-sm font-semibold"
              >
                Phone number{" "}
                <span className="font-normal text-subtle">(optional)</span>
              </label>
              <input
                id="auth-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="0803 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={field}
              />
              <p className="mt-1.5 text-xs text-subtle">
                Never shown to buyers. Used for account security.
              </p>
            </div>
          ) : null}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="auth-password"
                className="block text-sm font-semibold"
              >
                Password
              </label>
              {mode === "signin" ? (
                <Link
                  href={email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"}
                  className="text-xs font-semibold text-muted hover:text-ink"
                >
                  Forgot password?
                </Link>
              ) : null}
            </div>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${field} pr-16`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-muted hover:text-ink"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {mode === "register" ? (
              <p className="mt-1.5 text-xs text-subtle">
                At least 8 characters, with letters and numbers.
              </p>
            ) : null}
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-danger-50 px-3 py-2.5 text-sm font-medium text-danger-600"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-ink-3 disabled:opacity-60"
          >
            {busy ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                aria-hidden
              />
            ) : null}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>

          {mode === "register" ? (
            <p className="text-center text-xs leading-relaxed text-muted">
              By creating an account you agree to our{" "}
              <Link
                href="/terms"
                className="font-semibold text-ink underline underline-offset-2"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-semibold text-ink underline underline-offset-2"
              >
                Privacy policy
              </Link>
              .
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
