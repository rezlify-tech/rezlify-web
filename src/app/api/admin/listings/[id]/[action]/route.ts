import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string; action: string }> };

const ACTIONS = new Set(["approve", "reject", "remove"]);
const isId = (id: string) => /^[0-9a-z]{26}$/i.test(id);

/** POST /api/admin/listings/{id}/approve | reject | remove */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id, action } = await params;
  if (!isId(id) || !ACTIONS.has(action)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const body = await request.text();
  return forwardToLaravel(request, `/admin/listings/${id}/${action}`, { method: "POST", body: body || "{}" });
}

/** GET /api/admin/listings/{id}/history */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { id, action } = await params;
  if (!isId(id) || action !== "history") return NextResponse.json({ message: "Not found." }, { status: 404 });

  return forwardToLaravel(request, `/admin/listings/${id}/history`, { method: "GET" });
}
