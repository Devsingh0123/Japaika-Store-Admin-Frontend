"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  Check,
  CreditCard,
  ExternalLink,
  MapPin,
  Package,
  Pencil,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  StickyNote,
  Tag,
  Truck,
  User,
} from "lucide-react";
import { AccessDenied } from "@/components/auth/access-denied";
import { CopyButton } from "@/components/common/copy-button";
import { ErrorState } from "@/components/common/error-state";
import {
  OrderStatusBadge,
  PaymentMethodBadge,
  PaymentStatusBadge,
} from "@/components/orders/order-badges";
import { AdvanceStatusModal } from "@/components/orders/modals/advance-status-modal";
import { CancelOrderModal } from "@/components/orders/modals/cancel-order-modal";
import { EditTrackingModal } from "@/components/orders/modals/edit-tracking-modal";
import { RefundOrderModal } from "@/components/orders/modals/refund-order-modal";
import { UpdatePaymentModal } from "@/components/orders/modals/update-payment-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  useOrderDetailQuery,
  useSyncOrderPaymentMutation,
} from "@/hooks/use-orders";
import { ApiError } from "@/lib/api/error";
import { MODULE_ROLE_ACCESS } from "@/lib/auth/rbac";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  getAllowedPaymentTransitions,
  ORDER_NEXT_ACTION_LABELS,
  ORDER_STATUS_LABELS,
} from "@/lib/orders/schemas";
import { cn } from "@/lib/utils";
import type { OrderDetail, OrderStatus } from "@/types/order";

const FULFILLMENT_STEPS: readonly OrderStatus[] = [
  "pending_payment",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
];

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading order details">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function FulfillmentTimeline({ order }: { order: OrderDetail }) {
  if (order.status === "cancelled") {
    return (
      <Card className="border-destructive/30 bg-destructive-soft/40">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
              <Ban className="size-4" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Order cancelled
                  {order.cancellation?.cancelledBy
                    ? ` by ${order.cancellation.cancelledBy}`
                    : ""}
                </p>
                {order.stockRestored ? (
                  <Badge variant="outline" className="text-[0.68rem]">
                    Inventory &amp; coupon restored
                  </Badge>
                ) : null}
              </div>
              {order.cancellation?.reason ? (
                <p className="text-xs text-foreground/85">
                  Reason: {order.cancellation.reason}
                </p>
              ) : null}
              {order.cancellation?.cancelledAt ? (
                <p className="text-xs tabular-nums text-muted-foreground">
                  Cancelled on {formatDateTime(order.cancellation.cancelledAt)}
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentIdx = FULFILLMENT_STEPS.indexOf(order.status);

  return (
    <Card>
      <CardContent className="py-4">
        <ol
          aria-label="Order fulfillment progress"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        >
          {FULFILLMENT_STEPS.map((step, index) => {
            const isCompleted = index < currentIdx;
            const isCurrent = index === currentIdx;

            return (
              <li
                key={step}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  isCurrent
                    ? "border-brand/50 bg-brand/10 text-foreground"
                    : isCompleted
                      ? "border-success/30 bg-success-soft/40 text-foreground"
                      : "border-border bg-muted/20 text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[0.68rem] font-semibold",
                    isCurrent
                      ? "bg-brand text-brand-foreground"
                      : isCompleted
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="truncate">{ORDER_STATUS_LABELS[step]}</span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

export function OrderDetailView({ orderId }: { orderId: string }) {
  const { hasRole } = useAuth();
  const canRead = hasRole(MODULE_ROLE_ACCESS.orders);
  const canWrite = hasRole(MODULE_ROLE_ACCESS.payments);

  const orderQuery = useOrderDetailQuery(orderId, canRead);
  const syncPaymentMutation = useSyncOrderPaymentMutation();

  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  if (!canRead) {
    return (
      <AccessDenied
        title="Orders access restricted"
        description="Order management is available to Super Admins, Operations Managers, and Support Moderators."
      />
    );
  }

  if (orderQuery.isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="space-y-4">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to orders
        </Link>
        <Card className="p-6">
          <ErrorState
            title="Unable to load order"
            message={
              orderQuery.error instanceof ApiError
                ? orderQuery.error.message
                : "This order could not be retrieved."
            }
            onRetry={() => orderQuery.refetch()}
          />
        </Card>
      </div>
    );
  }

  const order = orderQuery.data;
  const allowedPaymentTransitions = getAllowedPaymentTransitions(order);
  const canSyncRazorpay =
    canWrite &&
    order.paymentMethod === "razorpay" &&
    Boolean(order.payment.razorpayOrderId) &&
    order.paymentStatus !== "paid" &&
    order.paymentStatus !== "refunded";

  const addr = order.shippingAddress;
  const line1 = addr?.addressLine1 ?? addr?.line1 ?? null;
  const line2 = addr?.addressLine2 ?? addr?.line2 ?? null;

  return (
    <div className="space-y-6">
      {/* Top Bar & Action Strip */}
      <div className="space-y-3">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to orders
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                {order.orderNumber}
              </h1>
              <CopyButton
                value={order.orderNumber}
                ariaLabel={`Copy order number ${order.orderNumber}`}
              />
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
              <PaymentMethodBadge method={order.paymentMethod} />
              <Badge variant="outline" className="font-mono text-[0.7rem]">
                {order.country} · {order.currency}
              </Badge>
              {!canWrite ? (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  Read-only
                </Badge>
              ) : null}
            </div>
            <p className="text-xs tabular-nums text-muted-foreground">
              Placed on {formatDateTime(order.createdAt, "—")}
              {order.updatedAt
                ? ` · Last updated ${formatDateTime(order.updatedAt)}`
                : ""}
            </p>
          </div>

          {canWrite ? (
            <div className="flex flex-wrap items-center gap-2">
              {order.allowedNextStatuses.map((nextStatus, index) => (
                <Button
                  key={nextStatus}
                  type="button"
                  variant={index === 0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTargetStatus(nextStatus)}
                >
                  {ORDER_NEXT_ACTION_LABELS[nextStatus]}
                </Button>
              ))}

              {order.canRefund ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRefundModalOpen(true)}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Issue refund
                </Button>
              ) : null}

              {order.canCancel ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setCancelModalOpen(true)}
                >
                  <Ban className="size-3.5" aria-hidden="true" />
                  Cancel order
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Fulfillment Progress */}
      <FulfillmentTimeline order={order} />

      {/* Two-Column Operational Workspace */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left Column: Items, Pricing, Tracking */}
        <div className="space-y-6">
          {/* Order Items */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border py-3.5">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="size-4 text-brand" aria-hidden="true" />
                  Order items ({order.items.length})
                </CardTitle>
                <CardDescription>
                  Immutable product, variant, tax, and pricing snapshot at
                  checkout.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {order.items.map((item) => {
                  const hasSaleDiscount =
                    item.unitSalePrice !== null &&
                    Number(item.unitSalePrice) < Number(item.unitPrice);

                  return (
                    <li
                      key={item.id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3.5">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="size-14 shrink-0 rounded-lg border border-border object-cover bg-muted"
                          />
                        ) : (
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                            <Package className="size-5" aria-hidden="true" />
                          </div>
                        )}

                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {item.productName}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            {item.variantTitle ? (
                              <span>{item.variantTitle}</span>
                            ) : null}
                            <span className="font-mono text-[0.7rem] text-foreground/80">
                              SKU: {item.sku}
                            </span>
                            {item.hsnCode ? (
                              <span>· HSN {item.hsnCode}</span>
                            ) : null}
                            {Number(item.gstRate) > 0 ? (
                              <span>· GST {item.gstRate}%</span>
                            ) : null}
                          </div>
                          {item.optionValues &&
                          Object.keys(item.optionValues).length > 0 ? (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {Object.entries(item.optionValues).map(
                                ([optKey, optVal]) => (
                                  <Badge
                                    key={optKey}
                                    variant="muted"
                                    className="text-[0.65rem]"
                                  >
                                    {optKey}: {optVal}
                                  </Badge>
                                )
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-baseline justify-between gap-4 sm:flex-col sm:items-end sm:gap-0.5">
                        <p className="tabular-nums text-sm font-semibold text-foreground">
                          {formatCurrency(item.lineTotal, order.currency)}
                        </p>
                        <p className="tabular-nums text-xs text-muted-foreground">
                          {item.quantity} ×{" "}
                          {formatCurrency(
                            item.unitEffectivePrice,
                            order.currency
                          )}
                          {hasSaleDiscount ? (
                            <span className="ml-1.5 line-through opacity-70">
                              {formatCurrency(item.unitPrice, order.currency)}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Pricing & Coupon Breakdown */}
          <Card>
            <CardHeader className="border-b border-border py-3.5">
              <CardTitle>Pricing breakdown</CardTitle>
              {order.couponCode ? (
                <Badge variant="brand" className="gap-1 font-mono text-xs">
                  <Tag className="size-3" aria-hidden="true" />
                  {order.couponCode}
                  {order.couponSnapshot?.discountPercentage
                    ? ` (${order.couponSnapshot.discountPercentage}%)`
                    : ""}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-2.5 py-4 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums text-foreground">
                  {formatCurrency(order.pricing.subtotalAmount, order.currency)}
                </span>
              </div>

              {Number(order.pricing.discountAmount) > 0 ? (
                <div className="flex items-center justify-between text-success">
                  <span>
                    Coupon discount
                    {order.couponCode ? ` (${order.couponCode})` : ""}
                  </span>
                  <span className="tabular-nums font-medium">
                    −
                    {formatCurrency(
                      order.pricing.discountAmount,
                      order.currency
                    )}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="tabular-nums text-foreground">
                  {Number(order.pricing.shippingAmount) === 0
                    ? "Free"
                    : formatCurrency(
                        order.pricing.shippingAmount,
                        order.currency
                      )}
                </span>
              </div>

              {Number(order.pricing.taxAmount) > 0 ? (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>
                    {order.country === "IN" ? "Included GST" : "Tax"}
                  </span>
                  <span className="tabular-nums text-foreground">
                    {formatCurrency(order.pricing.taxAmount, order.currency)}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
                <span>Grand total</span>
                <span className="tabular-nums">
                  {formatCurrency(
                    order.pricing.grandTotalAmount,
                    order.currency
                  )}
                </span>
              </div>

              {order.payment.refundAmount ? (
                <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                  <span className="font-medium text-muted-foreground">
                    {order.paymentStatus === "refunded"
                      ? "Refunded amount"
                      : "Pending refund amount"}
                  </span>
                  <span className="tabular-nums font-semibold text-foreground">
                    {formatCurrency(order.payment.refundAmount, order.currency)}
                  </span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Shipment & Tracking */}
          <Card>
            <CardHeader className="border-b border-border py-3.5">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="size-4 text-brand" aria-hidden="true" />
                  Shipment &amp; tracking
                </CardTitle>
                <CardDescription>
                  Courier partner, AWB number, and dispatch timestamps.
                </CardDescription>
              </div>
              {canWrite && order.canEditTracking ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTrackingModalOpen(true)}
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Edit tracking
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="py-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-xs text-muted-foreground">Courier</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {order.tracking.courierName || "Not assigned"}
                  </dd>
                </div>

                <div className="space-y-1">
                  <dt className="text-xs text-muted-foreground">
                    AWB / Tracking number
                  </dt>
                  <dd className="flex items-center gap-1.5 font-mono text-sm font-medium text-foreground">
                    <span>{order.tracking.awbNumber || "—"}</span>
                    {order.tracking.awbNumber ? (
                      <CopyButton
                        value={order.tracking.awbNumber}
                        ariaLabel="Copy AWB number"
                      />
                    ) : null}
                  </dd>
                </div>

                <div className="space-y-1">
                  <dt className="text-xs text-muted-foreground">Shipped at</dt>
                  <dd className="tabular-nums text-sm text-foreground">
                    {formatDateTime(order.tracking.shippedAt, "Not shipped")}
                  </dd>
                </div>

                <div className="space-y-1">
                  <dt className="text-xs text-muted-foreground">
                    Delivered at
                  </dt>
                  <dd className="tabular-nums text-sm text-foreground">
                    {formatDateTime(
                      order.tracking.deliveredAt,
                      "Not delivered"
                    )}
                  </dd>
                </div>

                {order.tracking.trackingUrl ? (
                  <div className="space-y-1 sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">
                      Tracking link
                    </dt>
                    <dd>
                      <a
                        href={order.tracking.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 break-all text-sm font-medium text-brand hover:underline"
                      >
                        {order.tracking.trackingUrl}
                        <ExternalLink
                          className="size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customer, Shipping Address, Payment & Reconciliation */}
        <div className="space-y-6">
          {/* Customer & Shipping Address */}
          <Card>
            <CardHeader className="border-b border-border py-3.5">
              <CardTitle className="flex items-center gap-2">
                <User className="size-4 text-brand" aria-hidden="true" />
                Customer &amp; delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-4 text-sm">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  {order.customer?.fullName || "Guest customer"}
                </p>
                {order.customer?.email ? (
                  <p className="break-all text-xs text-muted-foreground">
                    {order.customer.email}
                  </p>
                ) : null}
                {order.customer?.phone ? (
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {order.customer.phone}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5 border-t border-border pt-3.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  Shipping address
                </p>
                {addr ? (
                  <address className="space-y-0.5 text-xs not-italic leading-5 text-foreground/90">
                    {addr.fullName ? (
                      <p className="font-medium text-foreground">
                        {addr.fullName}
                      </p>
                    ) : null}
                    {line1 ? <p>{line1}</p> : null}
                    {line2 ? <p>{line2}</p> : null}
                    {addr.landmark ? (
                      <p className="text-muted-foreground">
                        Landmark: {addr.landmark}
                      </p>
                    ) : null}
                    <p>
                      {[addr.city, addr.district, addr.state, addr.postalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {addr.country ? (
                      <p className="font-medium">{addr.country}</p>
                    ) : null}
                    {addr.phone ? (
                      <p className="pt-0.5 tabular-nums text-muted-foreground">
                        Phone: {addr.phone}
                      </p>
                    ) : null}
                  </address>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No shipping address snapshot recorded.
                  </p>
                )}
              </div>

              {order.customerNotes ? (
                <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <StickyNote className="size-3.5 text-brand" aria-hidden="true" />
                    Customer note
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {order.customerNotes}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Payment & Reconciliation */}
          <Card>
            <CardHeader className="border-b border-border py-3.5">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-4 text-brand" aria-hidden="true" />
                  Payment &amp; refunds
                </CardTitle>
                <CardDescription>
                  Gateway IDs, reconciliation, and refund state.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 py-4 text-xs">
              <dl className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Method</dt>
                  <dd>
                    <PaymentMethodBadge method={order.payment.method} />
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <PaymentStatusBadge status={order.payment.status} />
                  </dd>
                </div>

                {order.payment.razorpayOrderId ? (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Razorpay order</dt>
                    <dd className="flex items-center gap-1 font-mono text-foreground">
                      <span className="max-w-[165px] truncate">
                        {order.payment.razorpayOrderId}
                      </span>
                      <CopyButton
                        value={order.payment.razorpayOrderId}
                        ariaLabel="Copy Razorpay order ID"
                      />
                    </dd>
                  </div>
                ) : null}

                {order.payment.razorpayPaymentId ? (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Razorpay payment</dt>
                    <dd className="flex items-center gap-1 font-mono text-foreground">
                      <span className="max-w-[165px] truncate">
                        {order.payment.razorpayPaymentId}
                      </span>
                      <CopyButton
                        value={order.payment.razorpayPaymentId}
                        ariaLabel="Copy Razorpay payment ID"
                      />
                    </dd>
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Paid at</dt>
                  <dd className="tabular-nums text-foreground">
                    {formatDateTime(order.payment.paidAt, "Not paid")}
                  </dd>
                </div>

                {order.payment.razorpayRefundId ? (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Refund ID</dt>
                    <dd className="flex items-center gap-1 font-mono text-foreground">
                      <span className="max-w-[165px] truncate">
                        {order.payment.razorpayRefundId}
                      </span>
                      <CopyButton
                        value={order.payment.razorpayRefundId}
                        ariaLabel="Copy Razorpay refund ID"
                      />
                    </dd>
                  </div>
                ) : null}

                {order.payment.refundedAt ? (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Refunded at</dt>
                    <dd className="tabular-nums text-foreground">
                      {formatDateTime(order.payment.refundedAt)}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {canWrite ? (
                <div className="flex flex-col gap-2 border-t border-border pt-3.5">
                  {canSyncRazorpay ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={syncPaymentMutation.isPending}
                      onClick={() => syncPaymentMutation.mutate(order.id)}
                      className="w-full justify-center"
                    >
                      <RefreshCw
                        className={cn(
                          "size-3.5",
                          syncPaymentMutation.isPending && "animate-spin"
                        )}
                        aria-hidden="true"
                      />
                      {syncPaymentMutation.isPending
                        ? "Syncing with Razorpay..."
                        : "Sync with Razorpay"}
                    </Button>
                  ) : null}

                  {allowedPaymentTransitions.length > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentModalOpen(true)}
                      className="w-full justify-center"
                    >
                      Update payment status
                    </Button>
                  ) : null}

                  {order.canRefund ? (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => setRefundModalOpen(true)}
                      className="w-full justify-center"
                    >
                      <RotateCcw className="size-3.5" aria-hidden="true" />
                      Process refund
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Centered Operational Modals */}
      <AdvanceStatusModal
        open={targetStatus !== null}
        onOpenChange={(open) => {
          if (!open) setTargetStatus(null);
        }}
        order={order}
        targetStatus={targetStatus}
      />

      <EditTrackingModal
        open={trackingModalOpen}
        onOpenChange={setTrackingModalOpen}
        order={order}
      />

      <UpdatePaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        order={order}
      />

      <CancelOrderModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        order={order}
      />

      <RefundOrderModal
        open={refundModalOpen}
        onOpenChange={setRefundModalOpen}
        order={order}
      />
    </div>
  );
}
