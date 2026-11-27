import type { Metadata } from "next";
import { OrderDetailView } from "@/components/orders/order-detail-view";

export const metadata: Metadata = {
  title: "Order Details",
  description:
    "Inspect order line items, pricing, shipping address, tracking, payment reconciliation, cancellation, and refund controls.",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}
