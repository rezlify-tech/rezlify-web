import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** GET /api/conversations?filter=&page= : your inbox */
export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  for (const key of ["filter", "page"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) params.set(key, value);
  }
  return forwardToLaravel(request, `/conversations?${params}`, { method: "GET" });
}

/** POST /api/conversations { listing_id, body } : message a seller about an ad */
export async function POST(request: NextRequest) {
  return forwardToLaravel(request, "/conversations", { method: "POST", body: await request.text() });
}
