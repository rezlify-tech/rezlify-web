import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** GET /api/admin/settings (admins only; Laravel checks the role) */
export async function GET(request: NextRequest) {
  return forwardToLaravel(request, "/admin/settings", { method: "GET" });
}

/** PATCH /api/admin/settings { fee_percent?, fee_cap_naira?, … } */
export async function PATCH(request: NextRequest) {
  return forwardToLaravel(request, "/admin/settings", { method: "PATCH", body: await request.text() });
}
