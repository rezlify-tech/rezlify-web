import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** PATCH /api/me/profile { name, phone?, bio?, state?, city? } */
export async function PATCH(request: NextRequest) {
  return forwardToLaravel(request, "/me/profile", { method: "PATCH", body: await request.text() });
}
