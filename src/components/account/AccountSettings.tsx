"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChatAvatar } from "@/components/chat/ChatAvatar";
import { ShieldCheck } from "@/components/ui/Badge";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { states } from "@/lib/mock/locations";
import { refreshSession, signOut, useSession, useSessionStatus, type SessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

/* --------------------------------- helpers -------------------------------- */

async function call(url: string, init: RequestInit): Promise<{ message?: string }> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { Accept: "application/json", ...init.headers } });
  } catch {
    throw new Error("No internet connection. Please try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const first = Object.values((body?.errors ?? {}) as Record<string, string[]>)[0]?.[0];
    throw new Error(first ?? body?.message ?? "Something went wrong. Please try again.");
  }
  return body;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/** Shrink a profile photo before upload (it's shown small anyway). */
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], "avatar.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

const input =
  "mt-1.5 h-11 w-full rounded-[10px] border border-line-strong bg-card px-3 text-base outline-none transition-colors focus:border-ink disabled:bg-sand disabled:text-muted sm:text-[15px]";
const label = "text-sm font-semibold";
const primary =
  "inline-flex h-11 items-center justify-center rounded-[10px] bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-3 disabled:opacity-50";

function Section({ id, title, intro, children, danger }: { id: string; title: string; intro?: string; children: ReactNode; danger?: boolean }) {
  return (
    <section id={id} className={cn("scroll-mt-24 rounded-[20px] border bg-card p-5 sm:p-6", danger ? "border-danger-500/30" : "border-line")}>
      <h2 className={cn("text-lg font-extrabold tracking-[-0.01em]", danger && "text-danger-600")}>{title}</h2>
      {intro ? <p className="mt-1 text-sm text-muted">{intro}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Status({ ok, error }: { ok?: string; error?: string }) {
  if (error) return <p className="text-sm font-medium text-danger-600">{error}</p>;
  if (ok) return <p className="text-sm font-medium text-ink">{ok}</p>;
  return null;
}

/* --------------------------------- the page -------------------------------- */

const sections = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Password" },
  { id: "notifications", label: "Emails" },
  { id: "close", label: "Close account" },
];

export function AccountSettings() {
  const user = useSession();
  const status = useSessionStatus();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") router.replace(`/login?next=${encodeURIComponent("/account/settings")}`);
  }, [status, router]);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <span className="skeleton block h-9 w-40 rounded" />
        <span className="skeleton block h-72 rounded-[20px]" />
        <span className="skeleton block h-48 rounded-[20px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">Settings</h1>
      <nav className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto" aria-label="Settings sections">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="inline-flex h-8 shrink-0 items-center rounded-full bg-card px-3 text-xs font-semibold text-ink-3 ring-1 ring-line hover:text-ink">
            {s.label}
          </a>
        ))}
      </nav>

      <div className="mt-6 space-y-5">
        {/* key: refill the forms if the account changes */}
        <ProfileSection key={`p-${user.id}`} user={user} />
        <PasswordSection key={`s-${user.id}`} user={user} />
        <EmailSection key={`e-${user.id}`} user={user} />
        <CloseSection key={`c-${user.id}`} user={user} />
      </div>
    </div>
  );
}

/* --------------------------------- profile -------------------------------- */

function ProfileSection({ user }: { user: SessionUser }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [state, setState] = useState(user.state ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");

  const cities = states.find((s) => s.slug === state)?.cities ?? [];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setOk("");
    setError("");
    try {
      await call("/api/me/profile", json("PATCH", { name: name.trim(), phone: phone.trim() || null, bio: bio.trim() || null, state: state || null, city: city || null }));
      await refreshSession();
      setOk("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Choose a photo (JPG, PNG or WebP).");
      return;
    }
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const data = new FormData();
      data.append("photo", await shrink(file));
      await call("/api/me/avatar", { method: "POST", body: data });
      await refreshSession();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Couldn't upload that photo.");
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    setPhotoError("");
    try {
      await call("/api/me/avatar", { method: "DELETE" });
      await refreshSession();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Couldn't remove it.");
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <Section id="profile" title="Profile" intro="This is what buyers and sellers see on your profile and in chat.">
      <div className="flex items-center gap-4">
        <ChatAvatar name={user.name} url={user.avatarUrl} className={cn("h-20 w-20 text-xl", photoBusy && "opacity-50")} />
        <div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={photoBusy} onClick={() => fileRef.current?.click()} className="h-10 rounded-[10px] border border-line-strong px-4 text-sm font-semibold hover:bg-sand disabled:opacity-50">
              {photoBusy ? "Uploading…" : user.avatarUrl ? "Change photo" : "Add photo"}
            </button>
            {user.hasUploadedAvatar ? (
              <button type="button" disabled={photoBusy} onClick={removePhoto} className="h-10 rounded-[10px] px-3 text-sm font-semibold text-muted hover:text-ink disabled:opacity-50">
                Remove
              </button>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs text-muted">A clear photo of your face helps buyers trust you.</p>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void upload(e.target.files?.[0])} />
        </div>
      </div>
      {photoError ? <p className="mt-2 text-sm font-medium text-danger-600">{photoError}</p> : null}

      <form onSubmit={save} className="mt-6 space-y-4">
        <label className="block">
          <span className={label}>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={user.isVerified} maxLength={80} required className={input} />
          {user.isVerified ? (
            <span className="mt-1.5 flex items-center gap-1.5 text-xs text-brand-700">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
              Matches your verified ID, so it can&apos;t be changed here.
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className={label}>Phone number</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0803 123 4567" className={input} />
          <span className="mt-1.5 block text-xs text-muted">Never shown on your ads or profile.</span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <FilterSelect
            label="State"
            name="state"
            placeholder="Choose state"
            value={state}
            onChange={(v) => {
              setState(v);
              setCity("");
            }}
            options={states.map((s) => ({ id: s.slug, label: s.name }))}
          />
          <FilterSelect
            label="City / area"
            name="city"
            placeholder={state ? "Choose city" : "Choose a state first"}
            value={city}
            onChange={setCity}
            options={cities.map((c) => ({ id: c, label: c }))}
            isDisabled={!state}
          />
        </div>

        <label className="block">
          <span className={label}>About you</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 300))}
            rows={3}
            placeholder="e.g. UK-used phones and laptops in Akure. Pickup or delivery."
            className={cn(input, "h-auto resize-none py-2.5")}
          />
          <span className="mt-1 block text-right text-xs text-subtle">{bio.length}/300</span>
        </label>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={busy} className={primary}>
            {busy ? "Saving…" : "Save profile"}
          </button>
          <Status ok={ok} error={error} />
        </div>
        <p className="text-xs text-muted">
          <Link href={`/u/${user.id}`} className="font-semibold text-ink underline underline-offset-2">
            See your public profile
          </Link>
        </p>
      </form>
    </Section>
  );
}

/* --------------------------------- password -------------------------------- */

function PasswordSection({ user }: { user: SessionUser }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const strong = next.length >= 8 && /[a-z]/i.test(next) && /\d/.test(next);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setOk("");
    setError("");
    try {
      const res = await call("/api/me/password", json("POST", { current_password: user.hasPassword ? current : undefined, password: next }));
      setOk(res.message ?? "Password changed.");
      setCurrent("");
      setNext("");
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      id="security"
      title={user.hasPassword ? "Change password" : "Set a password"}
      intro={user.hasPassword ? "You'll stay signed in here; other devices are signed out." : "You signed up with Google. Add a password to also sign in with your email."}
    >
      <p className="text-sm">
        <span className="text-muted">Email: </span>
        <span className="font-semibold">{user.email}</span>
        {user.googleLinked ? <span className="ml-2 rounded-md bg-sand px-1.5 py-0.5 text-[11px] font-semibold text-ink-3">Google linked</span> : null}
      </p>
      <form onSubmit={save} className="mt-4 space-y-4">
        {user.hasPassword ? (
          <label className="block">
            <span className={label}>Current password</span>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required className={input} />
          </label>
        ) : null}
        <label className="block">
          <span className={label}>New password</span>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required className={input} />
          <span className="mt-1.5 block text-xs text-muted">At least 8 characters, with letters and numbers.</span>
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy || !strong || (user.hasPassword && !current)} className={primary}>
            {busy ? "Saving…" : user.hasPassword ? "Change password" : "Set password"}
          </button>
          <Status ok={ok} error={error} />
        </div>
        {user.hasPassword ? (
          <p className="text-xs text-muted">
            Forgot it?{" "}
            <Link href={`/forgot-password?email=${encodeURIComponent(user.email)}`} className="font-semibold text-ink underline underline-offset-2">
              Reset by email
            </Link>
          </p>
        ) : null}
      </form>
    </Section>
  );
}

/* --------------------------------- emails --------------------------------- */

function EmailSection({ user }: { user: SessionUser }) {
  const [on, setOn] = useState(user.emailChat ?? true);
  const [error, setError] = useState("");

  async function toggle() {
    const next = !on;
    setOn(next);
    setError("");
    try {
      await call("/api/me/notifications", json("PATCH", { email_chat: next }));
      await refreshSession();
    } catch (err) {
      setOn(!next);
      setError(err instanceof Error ? err.message : "Couldn't save.");
    }
  }

  return (
    <Section id="notifications" title="Emails">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">New messages</p>
          <p className="mt-0.5 text-sm text-muted">An email when someone messages you and you&apos;re not on the site. At most one per chat every 30 minutes.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Emails about new messages"
          onClick={toggle}
          className={cn("relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-ink" : "bg-line-strong")}
        >
          <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-6" : "left-1")} />
        </button>
      </div>
      {error ? <p className="mt-2 text-sm font-medium text-danger-600">{error}</p> : null}
      <p className="mt-4 rounded-xl bg-sand px-3 py-2.5 text-xs text-muted">
        Emails about your orders, payments, ads and account security always send, so you never miss something important.
      </p>
    </Section>
  );
}

/* ------------------------------- close account ------------------------------- */

function CloseSection({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ready = user.hasPassword ? password.length > 0 : typed === "DELETE";

  async function close() {
    setBusy(true);
    setError("");
    try {
      await call("/api/me", json("DELETE", user.hasPassword ? { password } : { confirm: typed }));
      await signOut();
      router.replace("/?account=closed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't close your account.");
      setBusy(false);
    }
  }

  return (
    <Section id="close" title="Close account" danger intro="Your profile, photo and ads are removed, and you're signed out everywhere. This can't be undone.">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="h-10 rounded-[10px] border border-danger-500/40 px-4 text-sm font-semibold text-danger-600 hover:bg-danger-50">
          Close my account
        </button>
      ) : (
        <div className="space-y-4">
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-3">
            <li>You can&apos;t close it while an order is in progress or a payout is on its way.</li>
            <li>Records of past orders and payments are kept, as the law requires, but no longer show your name.</li>
            <li>You can sign up again later with the same email.</li>
          </ul>
          {user.hasPassword ? (
            <label className="block">
              <span className={label}>Enter your password to confirm</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={input} />
            </label>
          ) : (
            <label className="block">
              <span className={label}>Type DELETE to confirm</span>
              <input value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="characters" className={input} />
            </label>
          )}
          {error ? <p className="text-sm font-medium text-danger-600">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!ready || busy} onClick={close} className="inline-flex h-11 items-center rounded-[10px] bg-danger-600 px-5 text-sm font-semibold text-white hover:bg-danger-500 disabled:opacity-50">
              {busy ? "Closing…" : "Close my account for good"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="h-11 px-3 text-sm font-semibold text-muted hover:text-ink">
              Keep my account
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}
