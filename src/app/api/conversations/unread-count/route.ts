import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** GET /api/conversations/unread-count : for the header badge */
export async function GET(request: NextRequest) {
  return forwardToLaravel(request, "/conversations/unread-count", { method: "GET" });
}
