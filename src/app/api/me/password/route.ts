import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** POST /api/me/password { current_password?, password } */
export async function POST(request: NextRequest) {
  return forwardToLaravel(request, "/me/password", { method: "POST", body: await request.text() });
}
