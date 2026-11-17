import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string }> };

const isId = (id: string) => /^[0-9a-z]{26}$/i.test(id);

/** POST /api/users/{id}/block */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isId(id)) return NextResponse.json({ message: "User not found." }, { status: 404 });
  return forwardToLaravel(request, `/users/${id}/block`, { method: "POST" });
}

/** DELETE /api/users/{id}/block */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isId(id)) return NextResponse.json({ message: "User not found." }, { status: 404 });
  return forwardToLaravel(request, `/users/${id}/block`, { method: "DELETE" });
}
