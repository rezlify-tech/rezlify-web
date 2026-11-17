import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/conversations/{id}/calls: ring the other person */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ message: "Conversation not found." }, { status: 404 });
  return forwardToLaravel(request, `/conversations/${id}/calls`, { method: "POST" });
}
