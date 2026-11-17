import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** GET /api/admin/reports?status=open|closed&type=&page= (staff only; Laravel checks the role) */
export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  for (const key of ["status", "type", "page"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) params.set(key, value.slice(0, 20));
  }
  return forwardToLaravel(request, `/admin/reports?${params}`, { method: "GET" });
}
