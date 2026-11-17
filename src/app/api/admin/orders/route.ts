import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** GET /api/admin/orders?status=disputed|payout_failed|all&q=&page=  (staff only; Laravel checks the role) */
export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  for (const key of ["status", "q", "page"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) params.set(key, value.slice(0, 100));
  }
  return forwardToLaravel(request, `/admin/orders?${params}`, { method: "GET" });
}
