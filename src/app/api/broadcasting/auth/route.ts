import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/**
 * POST /api/broadcasting/auth: the live connection asks "may I listen to this chat?".
 * We add the login token from the cookie and let Laravel decide (routes/channels.php).
 */
export async function POST(request: NextRequest) {
  return forwardToLaravel(request, "/broadcasting/auth", { method: "POST", body: await request.text() });
}
