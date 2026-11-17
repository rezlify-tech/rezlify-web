import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { SellWizard } from "@/components/sell/SellWizard";
import type { SellForm } from "@/components/sell/types";
import { LoadError } from "@/components/ui/LoadError";
import { TOKEN_COOKIE, laravel } from "@/lib/server/laravel";

export const metadata: Metadata = {
  title: "Edit ad",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

type EditData = {
  id: string;
  status: string;
  rejectionReason: string | null;
  category: { slug: string; name: string; parentSlug: string | null };
  title: string;
  description: string;
  condition: string;
  price: number;
  negotiable: boolean;
  quantity: number;
  state: string | null;
  city: string | null;
  delivery: string[];
  specs: Record<string, string | number | null>;
  photos: { id: number; url: string }[];
  locked: string | null;
};

/** The ad as the sell form expects it. Photos already on the ad are kept by id. */
function toForm(d: EditData): SellForm {
  return {
    rootCategory: d.category.parentSlug ?? d.category.slug,
    category: d.category.slug,
    photos: d.photos.map((p) => ({ id: `existing-${p.id}`, file: null, url: p.url, existingId: p.id })),
    title: d.title,
    condition: d.condition,
    specs: Object.fromEntries(Object.entries(d.specs ?? {}).map(([k, v]) => [k, v === null ? "" : String(v)])),
    description: d.description,
    price: String(d.price),
    negotiable: d.negotiable,
    quantity: String(d.quantity),
    state: d.state ?? "",
    city: d.city ?? "",
    delivery: { meetup: d.delivery.includes("meetup"), seller_delivery: d.delivery.includes("seller_delivery") },
  };
}

export default async function EditAdPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-z]{26}$/i.test(id)) notFound();

  const here = `/account/ads/${id}/edit`;
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) redirect(`/login?next=${encodeURIComponent(here)}`);

  const res = await laravel(`/me/listings/${id}`, { token }).catch(() => null);
  if (res?.status === 401) redirect(`/login?next=${encodeURIComponent(here)}`);
  if (res?.status === 404) notFound();
  if (!res?.ok) {
    return (
      <div className="container-x py-10">
        <LoadError title="We couldn't load this ad" retryHref={here} />
      </div>
    );
  }

  const { data } = (await res.json()) as { data: EditData };

  return (
    <div className="container-x py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/account/ads" className="text-sm font-semibold text-muted hover:text-ink">
          ← My ads
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">Edit ad</h1>

        {data.locked ? (
          <div className="mt-6 rounded-[20px] border border-line bg-card p-6 text-center">
            <p className="font-bold">This ad can&apos;t be edited right now</p>
            <p className="mt-1 text-sm text-muted">{data.locked}</p>
            <Link href="/account/ads" className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-3">
              Back to My ads
            </Link>
          </div>
        ) : (
          <>
            {data.status === "rejected" && data.rejectionReason ? (
              <p className="mt-4 rounded-2xl bg-danger-50 px-4 py-3 text-sm leading-relaxed text-danger-600">
                <span className="font-bold">Why it wasn&apos;t approved: </span>
                {data.rejectionReason} Fix this and save to send it again.
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted">Tap Edit on any section. If you change the words, price or photos, we may check the ad again before it shows.</p>
            )}
            <div className="mt-8">
              <Suspense>
                <SellWizard edit={{ id: data.id, initial: toForm(data) }} />
              </Suspense>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
