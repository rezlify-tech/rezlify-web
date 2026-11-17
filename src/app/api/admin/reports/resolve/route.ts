import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** POST /api/admin/reports/resolve { type, id, action, note } */
export async function POST(request: NextRequest) {
  return forwardToLaravel(request, "/admin/reports/resolve", { method: "POST", body: await request.text() });
}
