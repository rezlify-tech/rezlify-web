import { site } from "./site";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

/**
 * Talks to the Laravel API. Sends and receives JSON, attaches the login token
 * when given, and turns Laravel errors (including validation errors) into ApiError.
 */
export async function api<T>(path: string, { body, token, headers, ...init }: ApiOptions = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(`${site.apiUrl}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? "Something went wrong. Please try again.", data?.errors ?? {});
  }

  return data as T;
}
