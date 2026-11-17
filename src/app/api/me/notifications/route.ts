import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** PATCH /api/me/notifications { email_chat } */
export async function PATCH(request: NextRequest) {
  return forwardToLaravel(request, "/me/notifications", { method: "PATCH", body: await request.text() });
}
