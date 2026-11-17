import { redirect } from "next/navigation";

/** Shops aren't open yet; the plans page explains what's coming and how to get early access. */
export default function OpenShopPage() {
  redirect("/pricing");
}
