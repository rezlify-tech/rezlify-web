import type { Metadata } from "next";
import { FinishPost } from "@/components/sell/FinishPost";
import { ParticleBackdrop } from "@/components/ui/ParticleBackdrop";

export const metadata: Metadata = {
  title: "Posting your ad",
  robots: { index: false },
};

export default function FinishPostPage() {
  return (
    <div className="relative isolate">
      <ParticleBackdrop />
      <div className="container-x">
        <FinishPost />
      </div>
    </div>
  );
}
