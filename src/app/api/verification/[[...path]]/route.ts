import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ path?: string[] }> };

/** Only these verification paths are passed on to Laravel. */
const GET_PATHS = new Set(["", "banks"]);
const POST_PATHS = new Set(["identity", "account", "account/lookup"]);

/** GET /api/verification, /api/verification/banks */
export async function GET(request: NextRequest, { params }: Ctx) {
  const path = ((await params).path ?? []).join("/");
  if (!GET_PATHS.has(path)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  return forwardToLaravel(request, `/verification${path ? `/${path}` : ""}`, { method: "GET" });
}

/** POST /api/verification/identity (multipart, with the selfie), /account, /account/lookup */
export async function POST(request: NextRequest, { params }: Ctx) {
  const path = ((await params).path ?? []).join("/");
  if (!POST_PATHS.has(path)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data");
  let body: BodyInit;
  try {
    body = isMultipart ? await request.formData() : await request.text();
  } catch {
    return NextResponse.json({ message: "That photo is too large. Please try again." }, { status: 413 });
  }

  return forwardToLaravel(request, `/verification/${path}`, { method: "POST", body });
}
