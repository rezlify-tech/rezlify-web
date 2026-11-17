import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/server/laravel";
import { forwardToLaravel } from "@/lib/server/proxy";

/** DELETE /api/me { password? | confirm } : close the account, then sign this browser out. */
export async function DELETE(request: NextRequest) {
  const res = await forwardToLaravel(request, "/me", { method: "DELETE", body: await request.text() });
  if (res.ok) (await cookies()).delete(TOKEN_COOKIE);
  return res;
}
