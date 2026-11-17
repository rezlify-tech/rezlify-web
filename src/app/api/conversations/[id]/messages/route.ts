import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/conversations/{id}/messages : JSON { body } or multipart { image, body? } */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ message: "Conversation not found." }, { status: 404 });

  const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data");
  let body: BodyInit;
  try {
    body = isMultipart ? await request.formData() : await request.text();
  } catch {
    return NextResponse.json({ message: "That photo is too large to send." }, { status: 413 });
  }

  return forwardToLaravel(request, `/conversations/${id}/messages`, { method: "POST", body });
}
