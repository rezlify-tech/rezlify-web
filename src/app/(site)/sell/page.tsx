import type { Metadata } from "next";
import { Suspense } from "react";
import { SellWizard } from "@/components/sell/SellWizard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Post an ad",
  description: `Sell your phone, laptop, books, generator and more on ${site.name}. It's free and takes about 2 minutes.`,
  alternates: { canonical: "/sell" },
};

export default function SellPage() {
  return (
    <div className="container-x py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Suspense>
          <SellWizard />
        </Suspense>
      </div>
    </div>
  );
}
