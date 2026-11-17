import type { Metadata } from "next";
import { SavedItems } from "@/components/saved/SavedItems";

export const metadata: Metadata = {
  title: "Saved items",
  robots: { index: false, follow: false },
};

export default function SavedPage() {
  return (
    <div className="container-x py-6 sm:py-10">
      <SavedItems />
    </div>
  );
}
