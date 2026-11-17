import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** GET /api/admin/users?q=&filter=&page= (staff only; Laravel checks the role) */
export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  for (const key of ["q", "filter", "page"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) params.set(key, value.slice(0, 100));
  }
  return forwardToLaravel(request, `/admin/users?${params}`, { method: "GET" });
}
