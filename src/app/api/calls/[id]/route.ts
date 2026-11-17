import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/calls/{id} */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ message: "Call not found." }, { status: 404 });
  return forwardToLaravel(request, `/calls/${id}`, { method: "GET" });
}
