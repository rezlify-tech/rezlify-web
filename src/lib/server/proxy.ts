import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { API_URL, TOKEN_COOKIE, clientIp } from "./laravel";

/**
 * Passes a signed-in browser request on to Laravel with the login token from the
 * httpOnly cookie, and passes Laravel's answer (including validation errors) back.
 */
export async function forwardToLaravel(
  request: NextRequest,
  path: string,
  { method, body }: { method: string; body?: BodyInit | null },
): Promise<NextResponse> {
  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: "Please sign in to continue." }, { status: 401 });
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  const type = request.headers.get("content-type");
  // FormData sets its own multipart boundary; any other body (JSON, form-encoded) keeps its type.
  if (body && type && !type.includes("multipart/form-data")) headers["Content-Type"] = type;

  // Lets Laravel skip sending a live update back to the browser tab that caused it.
  const socketId = request.headers.get("x-socket-id");
  if (socketId && /^\d+\.\d+$/.test(socketId)) headers["X-Socket-ID"] = socketId;

  const ip = clientIp(request.headers);
  if (ip && process.env.API_PROXY_KEY) {
    headers["X-Client-IP"] = ip;
    headers["X-Proxy-Key"] = process.env.API_PROXY_KEY;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: body ?? undefined, cache: "no-store" });
  } catch {
    return NextResponse.json(
      { message: "We can't reach the server right now. Please try again in a moment." },
      { status: 503 },
    );
  }

  if (res.status === 401) jar.delete(TOKEN_COOKIE);

  const data = await res.json().catch(() => ({ message: "Something went wrong. Please try again." }));
  return NextResponse.json(data, { status: res.status });
}
