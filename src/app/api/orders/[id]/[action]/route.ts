import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string; action: string }> };

/** Everything you can do to an order after placing it. Anything else is a 404. */
const ACTIONS = new Set(["cancel", "simulate-payment", "handed-over", "confirm", "release-code", "dispute", "refund", "review"]);

/** POST /api/orders/{id}/{action} */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id, action } = await params;
  if (!/^[0-9a-z]{26}$/i.test(id) || !ACTIONS.has(action)) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }
  const body = await request.text();
  return forwardToLaravel(request, `/orders/${id}/${action}`, { method: "POST", body: body || null });
}
