"use client";

import { useEffect, useRef, useState } from "react";

type GoogleProfile = { email: string; name: string; picture?: string; credential: string };

type GoogleCredentialResponse = { credential: string };

type GoogleIdApi = {
  initialize: (config: { client_id: string; callback: (r: GoogleCredentialResponse) => void; ux_mode?: "popup" | "redirect" }) => void;
  renderButton: (
    el: HTMLElement,
    options: { type?: "standard"; theme?: "outline" | "filled_blue" | "filled_black"; size?: "large"; text?: "continue_with" | "signin_with"; shape?: "rectangular" | "pill"; width?: number; logo_alignment?: "left" | "center" },
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

/** Read the name, email and photo from Google's sign-in token (display only; the API verifies it properly). */
function decode(credential: string): Omit<GoogleProfile, "credential"> | null {
  try {
    const payload = credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(decodeURIComponent(escape(window.atob(payload))));
    return { email: json.email, name: json.name ?? json.given_name ?? "", picture: json.picture };
  } catch {
    return null;
  }
}

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.head.appendChild(s);
  });
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/**
 * "Continue with Google".
 * With NEXT_PUBLIC_GOOGLE_CLIENT_ID set, shows Google's official button and real account picker.
 * Without it, a look-alike button signs in a demo Google user so the flow can still be tested.
 */
export function GoogleButton({ onSignedIn }: { onSignedIn: (profile: GoogleProfile) => void }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onSignedIn);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callbackRef.current = onSignedIn;
  }, [onSignedIn]);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !holderRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          ux_mode: "popup",
          callback: ({ credential }) => {
            const profile = decode(credential);
            if (profile?.email) callbackRef.current({ ...profile, credential });
          },
        });
        window.google.accounts.id.renderButton(holderRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          width: Math.min(400, holderRef.current.offsetWidth || 360),
        });
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, []);

  if (CLIENT_ID && !failed) {
    return <div ref={holderRef} className="flex min-h-11 w-full justify-center [&>div]:w-full" />;
  }

  return (
    <button
      type="button"
      onClick={() => onSignedIn({ email: "demo.google@gmail.com", name: "Google Demo User", credential: "demo" })}
      className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[10px] border border-line-strong bg-card text-[15px] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-sand"
    >
      <GoogleLogo />
      Continue with Google
    </button>
  );
}
