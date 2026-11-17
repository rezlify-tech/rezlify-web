import { NextResponse, type NextRequest } from "next/server";
import { forwardToLaravel } from "@/lib/server/proxy";

type Ctx = { params: Promise<{ id: string }> };

const isId = (id: string) => /^[0-9a-z]{26}$/i.test(id);

/** POST /api/me/listings/{id} (multipart): save changes to an ad, with any new photos. */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isId(id)) return NextResponse.json({ message: "Ad not found." }, { status: 404 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "Your photos were too large to send. Try fewer or smaller photos." }, { status: 413 });
  }
  return forwardToLaravel(request, `/me/listings/${id}`, { method: "POST", body: form });
}

/** PATCH /api/me/listings/{id}  { status: "sold" | "paused" | "active" } */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isId(id)) return NextResponse.json({ message: "Ad not found." }, { status: 404 });

  const body = await request.text();
  return forwardToLaravel(request, `/me/listings/${id}`, { method: "PATCH", body });
}

/** DELETE /api/me/listings/{id} */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isId(id)) return NextResponse.json({ message: "Ad not found." }, { status: 404 });

  return forwardToLaravel(request, `/me/listings/${id}`, { method: "DELETE" });
}
