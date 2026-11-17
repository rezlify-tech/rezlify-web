import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** GET /api/calls/ice: connection details for the voice line */
export async function GET(request: NextRequest) {
  return forwardToLaravel(request, "/calls/ice", { method: "GET" });
}
