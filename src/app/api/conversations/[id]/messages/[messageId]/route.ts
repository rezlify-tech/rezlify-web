import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string; messageId: string }> };

/** DELETE /api/conversations/{id}/messages/{messageId}: delete your own message for everyone */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id, messageId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(messageId)) {
    return NextResponse.json({ message: "Message not found." }, { status: 404 });
  }
  return forwardToLaravel(request, `/conversations/${id}/messages/${messageId}`, { method: "DELETE" });
}
