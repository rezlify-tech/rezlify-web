import type { NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** POST /api/orders { listing_id, delivery_method, delivery_note? } : Buy now */
export async function POST(request: NextRequest) {
  return forwardToLaravel(request, "/orders", { method: "POST", body: await request.text() });
}
