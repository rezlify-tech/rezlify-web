/**
 * Server-side calls from the website to the Laravel API.
 * Never imported in the browser: it uses the private proxy key.
 */

export const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
export const TOKEN_COOKIE = "rz_token";
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, same as the API

/** The visitor's real IP, so Laravel can rate-limit each person separately. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "";
}

export async function laravel(
  path: string,
  {
    method = "GET",
    body,
    token,
    ip,
    userAgent,
  }: { method?: string; body?: unknown; token?: string | null; ip?: string; userAgent?: string | null } = {},
): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (ip && process.env.API_PROXY_KEY) {
    headers["X-Client-IP"] = ip;
    headers["X-Proxy-Key"] = process.env.API_PROXY_KEY;
  }
  if (userAgent) headers["User-Agent"] = userAgent.slice(0, 200);

  return fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
}
