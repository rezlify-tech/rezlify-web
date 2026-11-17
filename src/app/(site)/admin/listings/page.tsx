import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { ModerationQueue } from "@/components/admin/ModerationQueue";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = {
  title: "Moderation",
  robots: { index: false, follow: false },
};

export default async function ModerationPage() {
  const staff = await requireStaff("/admin/listings");

  return (
    <div className="container-x py-6 sm:py-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-subtle">Moderation</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">Review ads</h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as {staff.name} · {staff.role === "admin" ? "Admin" : "Moderator"}
        </p>
        <AdminTabs isAdmin={staff.role === "admin"} />
      </div>

      <ModerationQueue />
    </div>
  );
}
