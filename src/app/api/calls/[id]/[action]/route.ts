import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string; action: string }> };

const ACTIONS = new Set(["accept", "decline", "end"]);

/** POST /api/calls/{id}/accept | decline | end */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id, action } = await params;
  if (!/^\d+$/.test(id) || !ACTIONS.has(action)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const body = await request.text();
  return forwardToLaravel(request, `/calls/${id}/${action}`, { method: "POST", body: body || undefined });
}
