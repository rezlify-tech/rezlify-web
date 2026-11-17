import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/reviews/{id}/reply { reply } : the seller answers a review */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ message: "Review not found." }, { status: 404 });
  return forwardToLaravel(request, `/reviews/${id}/reply`, { method: "POST", body: await request.text() });
}
