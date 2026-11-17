import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

/** POST /api/me/avatar (multipart: photo) : upload a profile photo */
export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "That photo is too large. Try a smaller one." }, { status: 413 });
  }
  return forwardToLaravel(request, "/me/avatar", { method: "POST", body: form });
}

/** DELETE /api/me/avatar : remove it */
export async function DELETE(request: NextRequest) {
  return forwardToLaravel(request, "/me/avatar", { method: "DELETE" });
}
