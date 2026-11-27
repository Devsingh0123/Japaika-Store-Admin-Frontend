"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { AccessDenied } from "@/components/auth/access-denied";
import { CopyButton } from "@/components/common/copy-button";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PaginationBar } from "@/components/common/pagination-bar";
import {
  OrderStatusBadge,
  PaymentMethodBadge,
  PaymentStatusBadge,
} from "@/components/orders/order-badges";
import { OrderSummaryStrip } from "@/components/orders/order-summary-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useOrdersQuery, useOrderSummaryQuery } from "@/hooks/use-orders";
import { ApiError } from "@/lib/api/error";
import { MODULE_ROLE_ACCESS } from "@/lib/auth/rbac";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_OPTIONS,
} from "@/lib/orders/schemas";
import type {
  OrderSortBy,
  OrderSortOrder,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/order";
import type { PricingCountry } from "@/types/product";

type OrderSortPresetKey =
  | "newest"
  | "highest_total"
  | "recently_paid"
  | "recently_shipped"
  | "status_asc";

const ORDER_SORT_PRESETS: Record<
  OrderSortPresetKey,
  { label: string; sortBy: OrderSortBy; sortOrder: OrderSortOrder }
> = {
  newest: { label: "Newest first", sortBy: "createdAt", sortOrder: "desc" },
  highest_total: {
    label: "Highest total",
    sortBy: "grandTotalAmount",
    sortOrder: "desc",
  },
  recently_paid: {
    label: "Recently paid",
    sortBy: "paidAt",
    sortOrder: "desc",
  },
  recently_shipped: {
    label: "Recently shipped",
    sortBy: "shippedAt",
    sortOrder: "desc",
  },
  status_asc: { label: "Status (A–Z)", sortBy: "status", sortOrder: "asc" },
};

function OrdersSkeleton() {
  return (
    <div className="divide-y divide-border" aria-label="Loading orders">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 px-5 py-4"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="hidden h-5 w-28 sm:block" />
          <Skeleton className="hidden h-5 w-24 md:block" />
          <Skeleton className="hidden h-5 w-24 lg:block" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

function toIsoBoundary(dateStr: string, boundary: "start" | "end"): string | undefined {
  if (!dateStr) return undefined;
  return boundary === "start"
    ? `${dateStr}T00:00:00.000Z`
    : `${dateStr}T23:59:59.999Z`;
}

export function OrdersManager() {
  const { hasRole } = useAuth();
  const canRead = hasRole(MODULE_ROLE_ACCESS.orders);
  const canWrite = hasRole(MODULE_ROLE_ACCESS.payments);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatus>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    "" | PaymentStatus
  >("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<
    "" | PaymentMethod
  >("");
  const [countryFilter, setCountryFilter] = useState<"" | PricingCountry>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortPreset, setSortPreset] = useState<OrderSortPresetKey>("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const activeSort = ORDER_SORT_PRESETS[sortPreset];
  const dateFromIso = toIsoBoundary(dateFrom, "start");
  const dateToIso = toIsoBoundary(dateTo, "end");

  const summaryQuery = useOrderSummaryQuery(
    {
      country: countryFilter || undefined,
      dateFrom: dateFromIso,
      dateTo: dateToIso,
    },
    canRead
  );

  const ordersQuery = useOrdersQuery(
    {
      page,
      limit,
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      paymentStatus: paymentStatusFilter || undefined,
      paymentMethod: paymentMethodFilter || undefined,
      country: countryFilter || undefined,
      dateFrom: dateFromIso,
      dateTo: dateToIso,
      sortBy: activeSort.sortBy,
      sortOrder: activeSort.sortOrder,
    },
    canRead
  );

  if (!canRead) {
    return (
      <AccessDenied
        title="Orders access restricted"
        description="Order management is available to Super Admins, Operations Managers, and Support Moderators."
      />
    );
  }

  const items = ordersQuery.data?.items ?? [];
  const pagination = ordersQuery.data?.pagination ?? {
    page,
    limit,
    totalItems: 0,
    totalPages: 1,
  };

  const hasActiveFilters =
    debouncedSearch !== "" ||
    statusFilter !== "" ||
    paymentStatusFilter !== "" ||
    paymentMethodFilter !== "" ||
    countryFilter !== "" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    sortPreset !== "newest";

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("");
    setPaymentStatusFilter("");
    setPaymentMethodFilter("");
    setCountryFilter("");
    setDateFrom("");
    setDateTo("");
    setSortPreset("newest");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Monitor storefront orders, advance fulfillment workflows, manage courier AWB tracking, reconcile Razorpay payments, and process refunds."
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="muted" className="tabular-nums">
              {pagination.totalItems} total
            </Badge>
            {!canWrite ? (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <ShieldCheck className="size-3" aria-hidden="true" />
                Read-only access
              </Badge>
            ) : null}
          </div>
        }
        actions={
          <Link
            href="/shipping"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-[var(--shadow-xs)] transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Truck
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Shipping settings
          </Link>
        }
      />

      <OrderSummaryStrip
        summary={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
        onQuickFilterStatus={(status) => {
          setStatusFilter(status);
          setPaymentStatusFilter("");
          setPage(1);
        }}
        onQuickFilterPaymentStatus={(paymentStatus) => {
          setPaymentStatusFilter(paymentStatus);
          setStatusFilter("");
          setPage(1);
        }}
      />

      <Card className="overflow-hidden">
        {/* Filter & Sort Toolbar */}
        <div className="space-y-3 border-b border-border bg-muted/25 px-4 py-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 lg:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search order #, customer, phone, AWB, Razorpay ID..."
                aria-label="Search orders"
                className="pl-9 pr-8"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                aria-label="Filter by order status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as "" | OrderStatus);
                  setPage(1);
                }}
                className="h-9 w-auto min-w-[144px]"
              >
                <option value="">All statuses</option>
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>

              <Select
                aria-label="Filter by payment status"
                value={paymentStatusFilter}
                onChange={(event) => {
                  setPaymentStatusFilter(
                    event.target.value as "" | PaymentStatus
                  );
                  setPage(1);
                }}
                className="h-9 w-auto min-w-[146px]"
              >
                <option value="">All payments</option>
                {PAYMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {PAYMENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>

              <Select
                aria-label="Filter by payment method"
                value={paymentMethodFilter}
                onChange={(event) => {
                  setPaymentMethodFilter(
                    event.target.value as "" | PaymentMethod
                  );
                  setPage(1);
                }}
                className="h-9 w-auto min-w-[132px]"
              >
                <option value="">All methods</option>
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <option key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </option>
                ))}
              </Select>

              <Select
                aria-label="Filter by market"
                value={countryFilter}
                onChange={(event) => {
                  setCountryFilter(event.target.value as "" | PricingCountry);
                  setPage(1);
                }}
                className="h-9 w-auto min-w-[122px]"
              >
                <option value="">All markets</option>
                <option value="IN">India (IN)</option>
                <option value="US">USA (US)</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Date range:</span>
              <Input
                type="date"
                aria-label="Filter orders from date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setPage(1);
                }}
                className="h-8 w-[142px] text-xs tabular-nums"
              />
              <span>to</span>
              <Input
                type="date"
                aria-label="Filter orders to date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setPage(1);
                }}
                className="h-8 w-[142px] text-xs tabular-nums"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select
                aria-label="Sort orders"
                value={sortPreset}
                onChange={(event) => {
                  setSortPreset(event.target.value as OrderSortPresetKey);
                  setPage(1);
                }}
                className="h-8 w-auto min-w-[148px] text-xs"
              >
                {(Object.keys(ORDER_SORT_PRESETS) as OrderSortPresetKey[]).map(
                  (key) => (
                    <option key={key} value={key}>
                      {ORDER_SORT_PRESETS[key].label}
                    </option>
                  )
                )}
              </Select>

              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Reset
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Content States */}
        {ordersQuery.isLoading ? (
          <OrdersSkeleton />
        ) : ordersQuery.isError ? (
          <div className="p-6">
            <ErrorState
              title="Unable to load orders"
              message={
                ordersQuery.error instanceof ApiError
                  ? ordersQuery.error.message
                  : "Something went wrong while fetching orders."
              }
              onRetry={() => ordersQuery.refetch()}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<ShoppingBag className="size-5" aria-hidden="true" />}
              title={
                hasActiveFilters
                  ? "No orders match your filters"
                  : "No orders placed yet"
              }
              description={
                hasActiveFilters
                  ? "Try clearing or adjusting your search query, status, market, or date filters."
                  : "Customer orders placed on the storefront will appear here for fulfillment and payment management."
              }
              action={
                hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetFilters}
                  >
                    Reset filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-3.5 py-3">Customer</th>
                    <th className="px-3.5 py-3">Market &amp; Total</th>
                    <th className="px-3.5 py-3">Payment</th>
                    <th className="px-3.5 py-3">Fulfillment</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {items.map((order) => (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      {/* Order Number & Meta */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-mono text-sm font-semibold tracking-wide text-foreground hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                          >
                            {order.orderNumber}
                          </Link>
                          <CopyButton
                            value={order.orderNumber}
                            ariaLabel={`Copy order number ${order.orderNumber}`}
                          />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="tabular-nums">
                            {formatDateTime(order.createdAt, "—")}
                          </span>
                          <span>·</span>
                          <span className="tabular-nums">
                            {order.itemCount} item
                            {order.itemCount === 1 ? "" : "s"}
                          </span>
                          {order.couponCode ? (
                            <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[0.68rem] text-foreground">
                              <Tag className="size-2.5" aria-hidden="true" />
                              {order.couponCode}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="max-w-[210px] px-3.5 py-3.5 align-top">
                        <p className="truncate font-medium text-foreground">
                          {order.customer?.fullName || "Guest customer"}
                        </p>
                        <p
                          className="mt-0.5 truncate text-xs text-muted-foreground"
                          title={order.customer?.email ?? undefined}
                        >
                          {order.customer?.email || "—"}
                        </p>
                        {order.customer?.phone ? (
                          <p className="mt-0.5 truncate text-xs tabular-nums text-muted-foreground">
                            {order.customer.phone}
                          </p>
                        ) : null}
                      </td>

                      {/* Market & Total */}
                      <td className="px-3.5 py-3.5 align-top whitespace-nowrap">
                        <div className="tabular-nums font-semibold text-foreground">
                          {formatCurrency(
                            order.grandTotalAmount,
                            order.currency
                          )}
                        </div>
                        <div className="mt-1">
                          <Badge
                            variant="outline"
                            className="font-mono text-[0.65rem]"
                          >
                            {order.country} · {order.currency}
                          </Badge>
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-3.5 py-3.5 align-top whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1.5">
                          <PaymentStatusBadge status={order.paymentStatus} />
                          <PaymentMethodBadge method={order.paymentMethod} />
                        </div>
                      </td>

                      {/* Fulfillment & Tracking */}
                      <td className="px-3.5 py-3.5 align-top whitespace-nowrap">
                        <OrderStatusBadge status={order.status} />
                        {order.tracking.courierName ||
                        order.tracking.awbNumber ? (
                          <p className="mt-1 max-w-[180px] truncate text-xs text-muted-foreground">
                            {order.tracking.courierName || "Courier"}
                            {order.tracking.awbNumber
                              ? ` · ${order.tracking.awbNumber}`
                              : ""}
                          </p>
                        ) : null}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground shadow-[var(--shadow-xs)] transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          Manage
                          <ArrowRight className="size-3" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="divide-y divide-border md:hidden">
              {items.map((order) => (
                <div key={order.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-mono text-sm font-semibold tracking-wide text-foreground hover:text-brand"
                        >
                          {order.orderNumber}
                        </Link>
                        <CopyButton
                          value={order.orderNumber}
                          ariaLabel={`Copy order number ${order.orderNumber}`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {order.customer?.fullName || "Guest customer"} ·{" "}
                        {order.customer?.email || "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums text-sm font-semibold text-foreground">
                        {formatCurrency(order.grandTotalAmount, order.currency)}
                      </p>
                      <p className="text-[0.68rem] text-muted-foreground">
                        {order.country} · {order.itemCount} item
                        {order.itemCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <PaymentMethodBadge method={order.paymentMethod} />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5 text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      {formatDateTime(order.createdAt, "—")}
                    </span>
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-accent"
                    >
                      Manage
                      <ArrowRight className="size-3" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <PaginationBar
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              limit={pagination.limit}
              onPageChange={setPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
}
