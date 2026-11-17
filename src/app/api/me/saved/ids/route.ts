import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { TOKEN_COOKIE } from "@/lib/server/laravel";
import { forwardToLaravel } from "@/lib/server/proxy";

/** GET /api/me/saved/ids : ids of everything you've saved (empty for visitors, not an error) */
export async function GET(request: NextRequest) {
  if (!(await cookies()).get(TOKEN_COOKIE)?.value) return NextResponse.json({ data: [] });
  return forwardToLaravel(request, "/me/saved/ids", { method: "GET" });
}
