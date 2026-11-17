import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ step: string }> };

/**
 * POST /api/auth/email/send            : email a new 6-digit code
 * POST /api/auth/email/verify { code } : confirm the email
 */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { step } = await params;
  if (step !== "send" && step !== "verify") return NextResponse.json({ message: "Not found." }, { status: 404 });
  const body = await request.text();
  return forwardToLaravel(request, `/auth/email/${step}`, { method: "POST", body: body || null });
}
