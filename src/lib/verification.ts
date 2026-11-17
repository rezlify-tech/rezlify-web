"use client";

/** Seller verification, through our /api/verification routes (which add the login token). */

export type VerificationStatus = {
  isVerified: boolean;
  identity:
    | { status: "approved"; type: "bvn" | "nin"; last4: string; name: string; verifiedAt: string }
    | { status: "rejected" | "pending"; type: "bvn" | "nin"; last4: string; reason: string | null }
    | null;
  payoutAccount: { bankName: string; last4: string; accountName: string } | null;
};

export type Bank = { code: string; name: string };

export class VerifyError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "VerifyError";
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { Accept: "application/json", ...init?.headers }, cache: "no-store" });
  } catch {
    throw new VerifyError("No internet connection. Please check and try again.", 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errors: Record<string, string[]> = body?.errors ?? {};
    throw new VerifyError(Object.values(errors)[0]?.[0] ?? body?.message ?? "Something went wrong. Please try again.", res.status, errors);
  }
  return body as T;
}

const json = (data: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export async function getStatus() {
  return (await call<{ data: VerificationStatus }>("/api/verification")).data;
}

export async function getBanks() {
  return (await call<{ data: Bank[] }>("/api/verification/banks")).data;
}

export async function submitIdentity(type: "bvn" | "nin", number: string, selfie: Blob) {
  const form = new FormData();
  form.set("type", type);
  form.set("number", number);
  form.set("selfie", selfie, "selfie.jpg");
  form.set("consent", "1");
  return call<{ message: string; data: VerificationStatus }>("/api/verification/identity", { method: "POST", body: form });
}

export async function lookupAccount(bankCode: string, accountNumber: string) {
  return call<{ accountName: string; matches: boolean | null }>(
    "/api/verification/account/lookup",
    json({ bank_code: bankCode, account_number: accountNumber }),
  );
}

export async function saveAccount(bankCode: string, accountNumber: string) {
  return call<{ message: string; data: VerificationStatus }>(
    "/api/verification/account",
    json({ bank_code: bankCode, account_number: accountNumber }),
  );
}
