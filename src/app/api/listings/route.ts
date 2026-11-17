import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE, clientIp, laravel } from "@/lib/server/laravel";
import { forwardToLaravel } from "@/lib/server/proxy";

const PUBLIC_FILTERS = ["q", "category", "brand", "min_price", "max_price", "condition", "state", "verified", "buy_now", "sort", "page"];

/**
 * GET /api/listings: public search, for parts of the page that load in the browser
 * (e.g. the homepage shelves). Sends the login token when there is one, so saved hearts are right.
 */
export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  for (const key of PUBLIC_FILTERS) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) params.set(key, value.slice(0, 100));
  }

  const token = (await cookies()).get(TOKEN_COOKIE)?.value ?? null;
  try {
    const res = await laravel(`/listings?${params}`, { token, ip: clientIp(request.headers) });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "We can't reach the server right now." }, { status: 503 });
  }
}

/** POST /api/listings: post an ad (multipart form with photos) as the signed-in user. */
export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "Your photos were too large to send. Try fewer or smaller photos." }, { status: 413 });
  }

  return forwardToLaravel(request, "/listings", { method: "POST", body: form });
}
