import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = {
  title: "Settings · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const staff = await requireStaff("/admin/settings");
  if (staff.role !== "admin") notFound();

  return (
    <div className="container-x py-6 sm:py-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-subtle">Admin</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted">Signed in as {staff.name} · Admin</p>
        <AdminTabs isAdmin />
      </div>

      <AdminSettings />
    </div>
  );
}
