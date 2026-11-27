"use client";

import { Banknote, CreditCard } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/orders/schemas";
import { cn } from "@/lib/utils";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/order";

const ORDER_STATUS_TONES: Record<
  OrderStatus,
  "warning" | "info" | "success" | "destructive" | "muted"
> = {
  pending_payment: "warning",
  confirmed: "info",
  processing: "info",
  packed: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "destructive",
};

const PAYMENT_STATUS_TONES: Record<
  PaymentStatus,
  "warning" | "info" | "success" | "destructive" | "muted"
> = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
  refund_pending: "warning",
  refunded: "muted",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <StatusBadge
      label={ORDER_STATUS_LABELS[status]}
      tone={ORDER_STATUS_TONES[status]}
      className={className}
    />
  );
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  return (
    <StatusBadge
      label={PAYMENT_STATUS_LABELS[status]}
      tone={PAYMENT_STATUS_TONES[status]}
      className={className}
    />
  );
}

export function PaymentMethodBadge({
  method,
  className,
}: {
  method: PaymentMethod;
  className?: string;
}) {
  if (method === "razorpay") {
    return (
      <Badge variant="outline" className={cn("gap-1 text-[0.7rem]", className)}>
        <CreditCard className="size-3 text-brand" aria-hidden="true" />
        Razorpay
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn("gap-1 text-[0.7rem]", className)}>
      <Banknote className="size-3 text-muted-foreground" aria-hidden="true" />
      COD
    </Badge>
  );
}
