import type { Metadata } from "next";
import { Suspense } from "react";
import { MyOrders } from "@/components/orders/MyOrders";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false },
};

export default function OrdersPage() {
  return (
    <div className="container-x py-6 sm:py-10">
      <Suspense>
        <MyOrders />
      </Suspense>
    </div>
  );
}
