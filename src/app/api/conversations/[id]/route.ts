import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/conversations/{id}?before=|after= */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ message: "Conversation not found." }, { status: 404 });

  const query = new URLSearchParams();
  for (const key of ["before", "after"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value && /^\d+$/.test(value)) query.set(key, value);
  }
  return forwardToLaravel(request, `/conversations/${id}?${query}`, { method: "GET" });
}
