import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** GET /api/me/orders?role=buying|selling&page= */
export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  const role = request.nextUrl.searchParams.get("role");
  const page = request.nextUrl.searchParams.get("page");
  params.set("role", role === "selling" ? "selling" : "buying");
  if (page && /^\d+$/.test(page)) params.set("page", page);
  return forwardToLaravel(request, `/me/orders?${params}`, { method: "GET" });
}
