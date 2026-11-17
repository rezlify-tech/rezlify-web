import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** POST /api/reports { type: listing|user|message, id, reason, details? } */
export async function POST(request: NextRequest) {
  return forwardToLaravel(request, "/reports", { method: "POST", body: await request.text() });
}
