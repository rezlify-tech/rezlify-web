import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmail } from "@/components/auth/VerifyEmail";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <div className="container-x py-10 sm:py-16">
      <Suspense>
        <VerifyEmail />
      </Suspense>
    </div>
  );
}
