import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { TOKEN_COOKIE, laravel } from "@/lib/server/laravel";

export type StaffUser = { name: string; isStaff: boolean; role: string };

/**
 * Only moderators and admins get past this. Signed-out people go to sign in;
 * everyone else gets "not found", so admin pages stay hidden.
 */
export async function requireStaff(path: string): Promise<StaffUser> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) redirect(`/login?next=${encodeURIComponent(path)}`);

  const res = await laravel("/auth/me", { token }).catch(() => null);
  if (!res?.ok) redirect(`/login?next=${encodeURIComponent(path)}`);

  const { data } = (await res.json()) as { data: StaffUser };
  if (!data.isStaff) notFound();
  return data;
}
