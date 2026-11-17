import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { ParticleBackdrop } from "@/components/ui/ParticleBackdrop";

export const metadata: Metadata = {
  title: "Sign in or create an account",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="relative isolate">
      <ParticleBackdrop />
      <div className="container-x py-10 sm:py-16">
        <Suspense>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}
