import type { Metadata } from "next";
import { OrdersManager } from "@/components/orders/orders-manager";

export const metadata: Metadata = {
  title: "Orders",
  description:
    "Monitor storefront orders, advance fulfillment states, attach courier AWB tracking, reconcile payments, and process refunds.",
};

export default function OrdersPage() {
  return <OrdersManager />;
}
