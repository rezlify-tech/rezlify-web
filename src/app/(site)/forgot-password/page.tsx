import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/PasswordReset";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="container-x py-10 sm:py-16">
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
