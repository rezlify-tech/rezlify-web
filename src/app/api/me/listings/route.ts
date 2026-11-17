import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** GET /api/me/listings?tab=all|active|pending|paused|sold&page=1 */
export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  const tab = request.nextUrl.searchParams.get("tab");
  const page = request.nextUrl.searchParams.get("page");
  if (tab) params.set("tab", tab);
  if (page) params.set("page", page);

  return forwardToLaravel(request, `/me/listings?${params}`, { method: "GET" });
}
