import { NextResponse, type NextRequest } from "next/server";
import { clientIp, laravel } from "@/lib/server/laravel";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/users/{id}/reviews?page= : a seller's reviews (public, no sign-in needed) */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!/^[0-9a-z]{26}$/i.test(id)) return NextResponse.json({ message: "Seller not found." }, { status: 404 });

  const page = request.nextUrl.searchParams.get("page");
  const query = page && /^\d+$/.test(page) ? `?page=${page}` : "";

  try {
    const res = await laravel(`/users/${id}/reviews${query}`, { ip: clientIp(request.headers) });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "We can't reach the server right now." }, { status: 503 });
  }
}
