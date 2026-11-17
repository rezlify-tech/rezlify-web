import type { Metadata } from "next";
import { VerifyFlow } from "@/components/verify/VerifyFlow";

export const metadata: Metadata = {
  title: "Get verified",
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <div className="container-x py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">Get verified</h1>
        <p className="mt-1 text-sm text-muted">Two quick steps. It takes about 2 minutes.</p>
        <div className="mt-6">
          <VerifyFlow />
        </div>
      </div>
    </div>
  );
}
