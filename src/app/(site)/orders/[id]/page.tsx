import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderView } from "@/components/orders/OrderView";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-z]{26}$/i.test(id)) notFound();

  return (
    <div className="container-x py-5 sm:py-10">
      <OrderView id={id} />
    </div>
  );
}
