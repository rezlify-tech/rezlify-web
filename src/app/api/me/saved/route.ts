import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** GET /api/me/saved?page= : your saved items */
export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page");
  return forwardToLaravel(request, `/me/saved${page && /^\d+$/.test(page) ? `?page=${page}` : ""}`, { method: "GET" });
}
