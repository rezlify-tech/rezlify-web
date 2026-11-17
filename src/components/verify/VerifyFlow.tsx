"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck } from "@/components/ui/Badge";
import { refreshSession, useSessionStatus } from "@/lib/session";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  VerifyError,
  getBanks,
  getStatus,
  lookupAccount,
  saveAccount,
  submitIdentity,
  type Bank,
  type VerificationStatus,
} from "@/lib/verification";
import { BankPicker } from "./BankPicker";
import { SelfieCamera } from "./SelfieCamera";

const input =
  "h-12 w-full rounded-[10px] border border-line-strong bg-card px-3.5 text-base tracking-[0.08em] text-ink tabular-nums placeholder:tracking-normal placeholder:text-subtle transition-colors hover:border-ink/25 focus:border-ink/40 focus:outline-none focus:ring-4 focus:ring-ink/5 sm:text-[15px]";

function Steps({ step }: { step: 1 | 2 | 3 }) {
  const items = ["Your identity", "Bank account", "Done"];
  return (
    <ol className="grid grid-cols-3 gap-2">
      {items.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < step;
        return (
          <li key={label}>
            <span className={cn("block h-1.5 rounded-full transition-colors", n <= step ? "bg-ink" : "bg-line")} />
            <span className={cn("mt-2 flex items-center gap-1 text-xs", n === step ? "font-semibold text-ink" : done ? "text-ink-3" : "text-subtle")}>
              {done ? <span aria-hidden>✓</span> : null}
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Alert({ children, tone = "danger" }: { children: React.ReactNode; tone?: "danger" | "info" }) {
  return (
    <p
      role={tone === "danger" ? "alert" : undefined}
      className={cn(
        "rounded-xl px-3.5 py-3 text-sm leading-relaxed",
        tone === "danger" ? "bg-danger-50 font-medium text-danger-600" : "bg-sand text-ink-3",
      )}
    >
      {children}
    </p>
  );
}

/* ------------------------------ step 1 ------------------------------ */

function IdentityStep({ previous, onDone }: { previous: VerificationStatus["identity"]; onDone: (s: VerificationStatus) => void }) {
  const [type, setType] = useState<"bvn" | "nin">(previous?.type ?? "bvn");
  const [number, setNumber] = useState("");
  const [selfie, setSelfie] = useState<Blob | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(previous && previous.status === "rejected" ? (previous.reason ?? "") : "");

  const ready = number.length === 11 && selfie && consent && !busy;

  async function submit() {
    if (!selfie) return;
    setBusy(true);
    setError("");
    try {
      const res = await submitIdentity(type, number, selfie);
      onDone(res.data);
    } catch (e) {
      setError(e instanceof VerifyError ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold tracking-[-0.01em]">Confirm it&apos;s you</h2>
        <p className="mt-1 text-sm text-muted">We match your face with the photo on your BVN or NIN record.</p>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-semibold">Use your</span>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-sand p-1" role="radiogroup">
          {(["bvn", "nin"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              onClick={() => setType(t)}
              className={cn(
                "h-10 rounded-[10px] text-sm font-semibold transition-colors",
                type === t ? "bg-card text-ink shadow-[var(--shadow-card)]" : "text-muted hover:text-ink",
              )}
            >
              {t === "bvn" ? "BVN" : "NIN"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="id-number" className="mb-1.5 block text-sm font-semibold">
          {type === "bvn" ? "Bank Verification Number (BVN)" : "National Identification Number (NIN)"}
        </label>
        <input
          id="id-number"
          inputMode="numeric"
          autoComplete="off"
          maxLength={11}
          placeholder="11 digits"
          value={number}
          onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
          className={input}
        />
        <p className="mt-1.5 text-xs text-subtle">
          {type === "bvn" ? "Dial *565*0# on the phone number linked to your bank to get your BVN." : "Dial *346# on your NIN-linked phone number to get your NIN."}
        </p>
      </div>

      <div>
        <span className="mb-3 block text-sm font-semibold">Take a selfie</span>
        <SelfieCamera onChange={setSelfie} />
      </div>

      <label className="flex cursor-pointer gap-3 rounded-xl border border-line p-3.5 text-sm leading-relaxed text-ink-3">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-ink)]" />
        <span>
          I agree that {site.name} can check my {type === "bvn" ? "BVN" : "NIN"} and selfie with official records. {site.name} doesn&apos;t keep my
          number or my selfie, only the last 4 digits and my name.
        </span>
      </label>

      {error ? <Alert>{error}</Alert> : null}

      <button
        type="button"
        disabled={!ready}
        onClick={submit}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-ink-3 disabled:opacity-40"
      >
        {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : null}
        {busy ? "Checking…" : "Confirm my identity"}
      </button>
    </div>
  );
}

/* ------------------------------ step 2 ------------------------------ */

function AccountStep({ name, onDone, changing }: { name: string; onDone: (s: VerificationStatus) => void; changing?: boolean }) {
  const [banks, setBanks] = useState<Bank[] | null>(null);
  const [bank, setBank] = useState<Bank | null>(null);
  const [number, setNumber] = useState("");
  const [lookup, setLookup] = useState<{ name: string; matches: boolean | null } | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getBanks()
      .then(setBanks)
      .catch((e) => setError(e instanceof Error ? e.message : "We couldn't load banks."));
  }, []);

  // Look up the account name as soon as the bank and all 10 digits are in.
  useEffect(() => {
    setLookup(null);
    if (!bank || number.length !== 10) return;
    let alive = true;
    setChecking(true);
    setError("");
    const t = window.setTimeout(() => {
      lookupAccount(bank.code, number)
        .then((r) => alive && setLookup({ name: r.accountName, matches: r.matches }))
        .catch((e) => alive && setError(e instanceof Error ? e.message : "We couldn't check that account."))
        .finally(() => alive && setChecking(false));
    }, 300);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [bank, number]);

  async function save() {
    if (!bank) return;
    setBusy(true);
    setError("");
    try {
      const res = await saveAccount(bank.code, number);
      onDone(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold tracking-[-0.01em]">{changing ? "Change your bank account" : "Where should we pay you?"}</h2>
        <p className="mt-1 text-sm text-muted">
          When a buyer confirms their order, we send the money here. It must be in your name: <span className="font-semibold text-ink">{name}</span>.
        </p>
      </div>

      <BankPicker banks={banks ?? []} value={bank} onChange={setBank} disabled={!banks} />

      <div>
        <label htmlFor="acct-number" className="mb-1.5 block text-sm font-semibold">
          Account number
        </label>
        <input
          id="acct-number"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          placeholder="10 digits"
          value={number}
          onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
          className={input}
        />

        <div className="mt-2 min-h-6 text-sm" aria-live="polite">
          {checking ? (
            <span className="flex items-center gap-2 text-muted">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
              Checking account…
            </span>
          ) : lookup ? (
            lookup.matches ? (
              <span className="flex items-center gap-1.5 font-semibold text-brand-600">
                <ShieldCheck className="h-4 w-4" /> {lookup.name}
              </span>
            ) : (
              <span className="font-medium text-danger-600">
                {lookup.name}: this isn&apos;t in your name, so it can&apos;t be used.
              </span>
            )
          ) : null}
        </div>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <button
        type="button"
        disabled={!lookup?.matches || busy}
        onClick={save}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-ink-3 disabled:opacity-40"
      >
        {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : null}
        {changing ? "Save bank account" : "Finish verification"}
      </button>
    </div>
  );
}

/* ------------------------------ page ------------------------------ */

export function VerifyFlow() {
  const router = useRouter();
  const session = useSessionStatus();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loadError, setLoadError] = useState("");
  const [changingBank, setChangingBank] = useState(false);
  const [justFinished, setJustFinished] = useState(false);

  useEffect(() => {
    if (session === "guest") router.replace(`/login?next=${encodeURIComponent("/verify")}`);
    if (session !== "authenticated") return;
    getStatus()
      .then(setStatus)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "We couldn't load your verification."));
  }, [session, router]);

  function update(next: VerificationStatus) {
    const nowVerified = !status?.isVerified && next.isVerified;
    setStatus(next);
    setChangingBank(false);
    if (nowVerified) setJustFinished(true);
    void refreshSession(); // the header and My ads pick up the Verified badge
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loadError) {
    return <Alert>{loadError}</Alert>;
  }

  if (!status) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink border-r-transparent" aria-hidden />
      </div>
    );
  }

  const identityOk = status.identity?.status === "approved" ? status.identity : null;
  const step: 1 | 2 | 3 = status.isVerified ? 3 : identityOk ? 2 : 1;

  return (
    <div className="space-y-6">
      <Steps step={step} />

      <section className="rounded-[20px] border border-line bg-card p-5 shadow-[var(--shadow-card)] sm:p-7">
        {step === 1 ? <IdentityStep previous={status.identity} onDone={update} /> : null}

        {step === 2 && identityOk ? (
          <>
            <p className="mb-6 flex items-center gap-2 rounded-xl bg-primary-soft px-3.5 py-2.5 text-sm text-brand-700">
              <ShieldCheck className="h-4 w-4" /> Identity confirmed: {identityOk.name} ({identityOk.type.toUpperCase()} ••••{identityOk.last4})
            </p>
            <AccountStep name={identityOk.name} onDone={update} />
          </>
        ) : null}

        {step === 3 && identityOk ? (
          changingBank ? (
            <AccountStep name={identityOk.name} onDone={update} changing />
          ) : (
            <div className="text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-brand-500">
                <ShieldCheck className="h-9 w-9" />
              </span>
              <h2 className="mt-4 text-xl font-extrabold tracking-[-0.01em]">{justFinished ? "You're verified" : "Verified seller"}</h2>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
                Your ads now show the Verified badge and a Buy now button. Buyers pay {site.name}, and we pay you when they confirm.
              </p>

              <dl className="mx-auto mt-6 max-w-sm divide-y divide-line rounded-xl border border-line text-left text-sm">
                <div className="flex justify-between gap-3 px-4 py-3">
                  <dt className="text-muted">Name</dt>
                  <dd className="font-semibold">{identityOk.name}</dd>
                </div>
                <div className="flex justify-between gap-3 px-4 py-3">
                  <dt className="text-muted">{identityOk.type.toUpperCase()}</dt>
                  <dd className="font-semibold tabular-nums">••••••• {identityOk.last4}</dd>
                </div>
                {status.payoutAccount ? (
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <dt className="text-muted">Payouts to</dt>
                    <dd className="text-right">
                      <span className="block font-semibold">{status.payoutAccount.bankName}</span>
                      <span className="text-xs text-muted tabular-nums">••••••{status.payoutAccount.last4}</span>
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2 sm:flex-row">
                <Link href="/account/ads" className="inline-flex h-11 flex-1 items-center justify-center rounded-[10px] bg-ink text-sm font-semibold text-white hover:bg-ink-3">
                  Go to My ads
                </Link>
                <button
                  type="button"
                  onClick={() => setChangingBank(true)}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-[10px] border border-line-strong text-sm font-semibold hover:bg-sand"
                >
                  Change bank account
                </button>
              </div>
            </div>
          )
        ) : null}
      </section>

      {step !== 3 ? (
        <ul className="grid gap-3 text-sm text-ink-3 sm:grid-cols-3">
          {[
            ["Verified badge", "Buyers trust verified sellers and buy faster."],
            ["Buy now on your ads", "Get paid safely through Rezlify."],
            ["Private and secure", "We don't keep your BVN, NIN or selfie."],
          ].map(([title, body]) => (
            <li key={title} className="rounded-xl bg-sand px-4 py-3">
              <span className="block font-semibold text-ink">{title}</span>
              <span className="text-xs text-muted">{body}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
