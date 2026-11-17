import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/admin/orders/{id}/resolve { outcome: release|refund, note } */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!/^[0-9a-z]{26}$/i.test(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  return forwardToLaravel(request, `/admin/orders/${id}/resolve`, { method: "POST", body: await request.text() });
}
