import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE, TOKEN_MAX_AGE, clientIp, laravel } from "@/lib/server/laravel";

/**
 * The browser talks to these routes; they talk to Laravel.
 * The login token lives in an httpOnly cookie, so page scripts can never read it.
 *
 *   POST /api/auth/login     { email, password }
 *   POST /api/auth/register  { name, email, phone?, password }
 *   POST /api/auth/google    { credential }
 *   GET  /api/auth/me
 *   POST /api/auth/logout
 *   POST /api/auth/forgot-password  { email }
 *   POST /api/auth/reset-password   { token, email, password }
 */

type Ctx = { params: Promise<{ action: string }> };

const SIGN_IN_ACTIONS = new Set(["login", "register", "google"]);
const PASSWORD_ACTIONS = new Set(["forgot-password", "reset-password"]);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

async function readJson(res: Response) {
  return res.json().catch(() => ({ message: "Something went wrong. Please try again." }));
}

function unreachable() {
  return NextResponse.json(
    { message: "We can't reach the server right now. Please try again in a moment." },
    { status: 503 },
  );
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const { action } = await params;
  const jar = await cookies();

  if (action === "logout") {
    const token = jar.get(TOKEN_COOKIE)?.value;
    if (token) {
      await laravel("/auth/logout", { method: "POST", token }).catch(() => null);
    }
    jar.delete(TOKEN_COOKIE);
    return NextResponse.json({ ok: true });
  }

  // Forgot / reset password: passed straight through (they don't sign you in).
  if (PASSWORD_ACTIONS.has(action)) {
    const body = await request.json().catch(() => ({}));
    try {
      const res = await laravel(`/auth/${action}`, { method: "POST", body, ip: clientIp(request.headers) });
      return NextResponse.json(await readJson(res), { status: res.status });
    } catch {
      return unreachable();
    }
  }

  if (!SIGN_IN_ACTIONS.has(action)) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  let res: Response;
  try {
    res = await laravel(`/auth/${action}`, {
      method: "POST",
      body: { ...body, device_name: "web" },
      ip: clientIp(request.headers),
      userAgent: request.headers.get("user-agent"),
    });
  } catch {
    return unreachable();
  }

  const data = await readJson(res);

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  jar.set(TOKEN_COOKIE, data.token, { ...cookieOptions, maxAge: TOKEN_MAX_AGE });
  return NextResponse.json({ user: data.user }, { status: res.status });
}

export async function GET(_request: NextRequest, { params }: Ctx) {
  const { action } = await params;
  if (action !== "me") {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  let res: Response;
  try {
    res = await laravel("/auth/me", { token });
  } catch {
    return unreachable();
  }

  if (res.status === 401) {
    jar.delete(TOKEN_COOKIE);
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const data = await readJson(res);
  return NextResponse.json({ user: res.ok ? data.data : null }, { status: res.status });
}
