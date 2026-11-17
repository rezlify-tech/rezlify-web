import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string; action: string }> };

const ACTIONS = new Set(["suspend", "reinstate", "role"]);

/** POST /api/admin/users/{id}/suspend | reinstate | role */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id, action } = await params;
  if (!/^[0-9a-z]{26}$/i.test(id) || !ACTIONS.has(action)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  return forwardToLaravel(request, `/admin/users/${id}/${action}`, { method: "POST", body: await request.text() });
}
