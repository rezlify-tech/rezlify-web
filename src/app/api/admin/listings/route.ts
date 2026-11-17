import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** GET /api/admin/listings?queue=&flagged=&q=&page=  (staff only; Laravel checks the role) */
export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  for (const key of ["queue", "flagged", "q", "page"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) params.set(key, value);
  }

  return forwardToLaravel(request, `/admin/listings?${params}`, { method: "GET" });
}
