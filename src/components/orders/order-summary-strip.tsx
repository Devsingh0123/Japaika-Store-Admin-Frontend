"use client";

import { AlertTriangle, IndianRupee, PackageCheck, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type { OrderStatus, OrderSummaryStats, PaymentStatus } from "@/types/order";

interface OrderSummaryStripProps {
  summary: OrderSummaryStats | undefined;
  isLoading: boolean;
  onQuickFilterStatus: (status: OrderStatus) => void;
  onQuickFilterPaymentStatus: (paymentStatus: PaymentStatus) => void;
}

export function OrderSummaryStrip({
  summary,
  isLoading,
  onQuickFilterStatus,
  onQuickFilterPaymentStatus,
}: OrderSummaryStripProps) {
  if (isLoading && !summary) {
    return (
      <div
        className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Loading order metrics"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-4">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-3 h-7 w-24" />
            <Skeleton className="mt-2 h-4 w-36" />
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {/* Total Orders & Fulfillment Queue */}
      <Card className="flex flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Total orders
          </span>
          <PackageCheck
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <p className="mt-2 tabular-nums text-2xl font-semibold tracking-tight text-foreground">
          {summary.totalOrders.toLocaleString("en-IN")}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onQuickFilterStatus("confirmed")}
            className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Badge variant="info" className="text-[0.68rem] tabular-nums">
              {summary.actionRequired.awaitingFulfillment} awaiting fulfillment
            </Badge>
          </button>
        </div>
      </Card>

      {/* Action Required */}
      <Card className="flex flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Needs attention
          </span>
          <AlertTriangle
            className="size-4 text-warning"
            aria-hidden="true"
          />
        </div>
        <p className="mt-2 tabular-nums text-2xl font-semibold tracking-tight text-foreground">
          {(
            summary.actionRequired.pendingRefunds +
            summary.actionRequired.pendingPayments
          ).toLocaleString("en-IN")}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onQuickFilterPaymentStatus("refund_pending")}
            className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Badge
              variant={
                summary.actionRequired.pendingRefunds > 0 ? "warning" : "muted"
              }
              className="text-[0.68rem] tabular-nums"
            >
              {summary.actionRequired.pendingRefunds} pending refunds
            </Badge>
          </button>
          <button
            type="button"
            onClick={() => onQuickFilterStatus("pending_payment")}
            className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Badge variant="muted" className="text-[0.68rem] tabular-nums">
              {summary.actionRequired.pendingPayments} unpaid
            </Badge>
          </button>
        </div>
      </Card>

      {/* Paid Revenue INR */}
      <Card className="flex flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Paid revenue (India)
          </span>
          <IndianRupee className="size-4 text-brand" aria-hidden="true" />
        </div>
        <p className="mt-2 truncate tabular-nums text-2xl font-semibold tracking-tight text-foreground">
          {formatCurrency(summary.paidRevenue.INR, "INR")}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Non-cancelled paid INR orders
        </p>
      </Card>

      {/* Paid Revenue USD */}
      <Card className="flex flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Paid revenue (USA)
          </span>
          <DollarSign className="size-4 text-brand" aria-hidden="true" />
        </div>
        <p className="mt-2 truncate tabular-nums text-2xl font-semibold tracking-tight text-foreground">
          {formatCurrency(summary.paidRevenue.USD, "USD")}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Non-cancelled paid USD orders
        </p>
      </Card>
    </div>
  );
}
