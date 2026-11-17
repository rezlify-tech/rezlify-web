import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/admin/orders/{id}: the order, its history and the buyer–seller chat */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!/^[0-9a-z]{26}$/i.test(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  return forwardToLaravel(request, `/admin/orders/${id}`, { method: "GET" });
}
