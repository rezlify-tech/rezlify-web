import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string }> };

const isId = (id: string) => /^[0-9a-z]{26}$/i.test(id);

/** POST /api/listings/{id}/save : add to saved items */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isId(id)) return NextResponse.json({ message: "Item not found." }, { status: 404 });
  return forwardToLaravel(request, `/listings/${id}/save`, { method: "POST" });
}

/** DELETE /api/listings/{id}/save : remove from saved items */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isId(id)) return NextResponse.json({ message: "Item not found." }, { status: 404 });
  return forwardToLaravel(request, `/listings/${id}/save`, { method: "DELETE" });
}
