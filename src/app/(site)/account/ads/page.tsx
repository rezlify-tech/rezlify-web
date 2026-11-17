import type { Metadata } from "next";
import { Suspense } from "react";
import { MyAds } from "@/components/account/MyAds";

export const metadata: Metadata = {
  title: "My ads",
  robots: { index: false },
};

export default function MyAdsPage() {
  return (
    <div className="container-x py-6 sm:py-10">
      <Suspense>
        <MyAds />
      </Suspense>
    </div>
  );
}
