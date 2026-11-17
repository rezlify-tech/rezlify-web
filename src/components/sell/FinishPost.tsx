"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ensureSession } from "@/lib/session";
import { PostError, publishListing, setPendingPost, takePendingPost } from "./publish";

const DRAFT_KEY = "rezlify:sell-draft";

/** After sign-in: post the ad the seller had finished, then show it on their profile. */
export function FinishPost() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      const user = await ensureSession();
      if (!user) {
        router.replace(`/login?next=${encodeURIComponent("/sell/finish")}`);
        return;
      }

      const pending = takePendingPost();
      if (!pending) {
        // The page was refreshed, so the photos are gone. Send them back to the form with their saved details.
        router.replace("/sell?resume=1");
        return;
      }

      try {
        const ad = await publishListing(pending.form);
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        router.replace(`/account/ads?posted=${ad.id}`);
      } catch (err) {
        // New account: confirm the email first, then come back here and post.
        if (err instanceof PostError && err.needsEmail) {
          setPendingPost(pending.form);
          router.replace(`/verify-email?next=${encodeURIComponent("/sell/finish")}`);
          return;
        }
        // Back to the form with everything (photos included) and the problem highlighted.
        const e = err instanceof PostError ? err : new PostError("We couldn't post your ad. Please try again.");
        setPendingPost(pending.form, { ...e.errors, form: e.errors.form ?? e.message });
        router.replace("/sell");
      }
    })();
  }, [router]);

  return (
    <div className="flex flex-col items-center py-24 text-center">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink border-r-transparent" aria-hidden />
      <p className="mt-5 text-lg font-bold">Posting your ad</p>
      <p className="mt-1 text-sm text-muted">Uploading your photos. This only takes a moment.</p>
    </div>
  );
}
