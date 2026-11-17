import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/orders/{id} : buyer or seller only */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!/^[0-9a-z]{26}$/i.test(id)) return NextResponse.json({ message: "Order not found." }, { status: 404 });
  return forwardToLaravel(request, `/orders/${id}`, { method: "GET" });
}
