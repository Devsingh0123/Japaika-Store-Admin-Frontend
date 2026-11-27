"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  Infinity as InfinityIcon,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  TicketPercent,
  X,
} from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PaginationBar } from "@/components/common/pagination-bar";
import { CouponActionsMenu } from "@/components/coupons/coupon-actions-menu";
import {
  CopyCodeButton,
  CouponStatusBadge,
  CouponVisibilityBadge,
} from "@/components/coupons/coupon-badges";
import { CouponFormModal } from "@/components/coupons/coupon-form-modal";
import { DeleteCouponDialog } from "@/components/coupons/delete-coupon-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import {
  useCouponsQuery,
  useUpdateCouponStatusMutation,
} from "@/hooks/use-coupons";
import { ApiError } from "@/lib/api/error";
import { MODULE_ROLE_ACCESS } from "@/lib/auth/rbac";
import {
  COUPON_STATUS_LABELS,
  COUPON_VISIBILITY_LABELS,
  COUPON_VISIBILITY_OPTIONS,
  formatDiscountPercent,
} from "@/lib/coupons/schemas";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  Coupon,
  CouponEffectiveStatus,
  CouponSortBy,
  CouponSortOrder,
  CouponVisibility,
} from "@/types/coupon";

type SortPresetKey =
  | "newest"
  | "code_asc"
  | "discount_desc"
  | "redemptions_desc"
  | "expires_asc";

const SORT_PRESETS: Record<
  SortPresetKey,
  { label: string; sortBy: CouponSortBy; sortOrder: CouponSortOrder }
> = {
  newest: { label: "Newest first", sortBy: "createdAt", sortOrder: "desc" },
  code_asc: { label: "Code (A–Z)", sortBy: "code", sortOrder: "asc" },
  discount_desc: {
    label: "Highest discount",
    sortBy: "discountPercentage",
    sortOrder: "desc",
  },
  redemptions_desc: {
    label: "Most redeemed",
    sortBy: "redemptionCount",
    sortOrder: "desc",
  },
  expires_asc: {
    label: "Expiring soon",
    sortBy: "expiresAt",
    sortOrder: "asc",
  },
};

const STATUS_OPTIONS: readonly CouponEffectiveStatus[] = [
  "active",
  "inactive",
  "expired",
  "exhausted",
];

function CouponsSkeleton() {
  return (
    <div className="divide-y divide-border" aria-label="Loading coupons">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 px-5 py-4"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="hidden h-5 w-24 sm:block" />
          <Skeleton className="hidden h-5 w-28 md:block" />
          <Skeleton className="hidden h-5 w-20 lg:block" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

function UsageDisplay({ coupon }: { coupon: Coupon }) {
  if (coupon.maxRedemptions === null) {
    return (
      <div className="space-y-0.5">
        <div className="inline-flex items-center gap-1 tabular-nums text-sm font-medium text-foreground">
          <span>{coupon.redemptionCount}</span>
          <span className="text-muted-foreground">/</span>
          <InfinityIcon
            className="size-3.5 text-muted-foreground"
            aria-label="Unlimited"
          />
        </div>
        <p className="text-[0.7rem] text-muted-foreground">Unlimited</p>
      </div>
    );
  }

  const ratio = Math.min(
    100,
    Math.round((coupon.redemptionCount / coupon.maxRedemptions) * 100)
  );

  return (
    <div className="space-y-1">
      <div className="tabular-nums text-sm font-medium text-foreground">
        {coupon.redemptionCount}{" "}
        <span className="text-xs font-normal text-muted-foreground">
          / {coupon.maxRedemptions}
        </span>
      </div>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            coupon.isExhausted
              ? "bg-destructive"
              : ratio >= 80
                ? "bg-warning"
                : "bg-brand"
          )}
          style={{ width: `${ratio}%` }}
        />
      </div>
    </div>
  );
}

export function CouponsManager() {
  const { hasRole } = useAuth();
  const canWrite = hasRole(MODULE_ROLE_ACCESS.coupons);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | CouponEffectiveStatus>(
    ""
  );
  const [visibilityFilter, setVisibilityFilter] = useState<
    "" | CouponVisibility
  >("");
  const [sortPreset, setSortPreset] = useState<SortPresetKey>("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalReadOnly, setModalReadOnly] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const activeSort = SORT_PRESETS[sortPreset];

  const couponsQuery = useCouponsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    visibility: visibilityFilter || undefined,
    sortBy: activeSort.sortBy,
    sortOrder: activeSort.sortOrder,
  });

  const statusMutation = useUpdateCouponStatusMutation();

  const items = couponsQuery.data?.items ?? [];
  const pagination = couponsQuery.data?.pagination ?? {
    page,
    limit,
    totalItems: 0,
    totalPages: 1,
  };

  const hasActiveFilters =
    debouncedSearch !== "" ||
    statusFilter !== "" ||
    visibilityFilter !== "" ||
    sortPreset !== "newest";

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("");
    setVisibilityFilter("");
    setSortPreset("newest");
    setPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedCoupon(null);
    setModalReadOnly(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setModalReadOnly(false);
    setModalOpen(true);
  };

  const handleOpenView = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setModalReadOnly(true);
    setModalOpen(true);
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    if (!canWrite || togglingId) {
      return;
    }

    setTogglingId(coupon.id);
    try {
      await statusMutation.mutateAsync({
        id: coupon.id,
        isActive: !coupon.isActive,
      });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        description="Create percentage-based discount codes with India (INR) and USA (USD) minimum cart thresholds, optional caps, and usage limits."
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
          <RoleGate allowedRoles={MODULE_ROLE_ACCESS.coupons}>
            <Button type="button" onClick={handleOpenCreate}>
              <Plus className="size-4" aria-hidden="true" />
              New coupon
            </Button>
          </RoleGate>
        }
      />

      <Card className="overflow-hidden">
        {/* Filter & Sort Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border bg-muted/25 px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search code or description..."
              aria-label="Search coupons by code or description"
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
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as "" | CouponEffectiveStatus
                );
                setPage(1);
              }}
              className="h-9 w-auto min-w-[140px]"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {COUPON_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>

            <Select
              aria-label="Filter by visibility"
              value={visibilityFilter}
              onChange={(event) => {
                setVisibilityFilter(
                  event.target.value as "" | CouponVisibility
                );
                setPage(1);
              }}
              className="h-9 w-auto min-w-[136px]"
            >
              <option value="">All visibility</option>
              {COUPON_VISIBILITY_OPTIONS.map((visibility) => (
                <option key={visibility} value={visibility}>
                  {COUPON_VISIBILITY_LABELS[visibility]}
                </option>
              ))}
            </Select>

            <Select
              aria-label="Sort coupons"
              value={sortPreset}
              onChange={(event) => {
                setSortPreset(event.target.value as SortPresetKey);
                setPage(1);
              }}
              className="h-9 w-auto min-w-[152px]"
            >
              {(Object.keys(SORT_PRESETS) as SortPresetKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_PRESETS[key].label}
                </option>
              ))}
            </Select>

            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Reset
              </Button>
            ) : null}
          </div>
        </div>

        {/* Content States */}
        {couponsQuery.isLoading ? (
          <CouponsSkeleton />
        ) : couponsQuery.isError ? (
          <div className="p-6">
            <ErrorState
              title="Unable to load coupons"
              message={
                couponsQuery.error instanceof ApiError
                  ? couponsQuery.error.message
                  : "Something went wrong while fetching coupons."
              }
              onRetry={() => couponsQuery.refetch()}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<TicketPercent className="size-5" aria-hidden="true" />}
              title={
                hasActiveFilters
                  ? "No coupons match your filters"
                  : "No coupons created yet"
              }
              description={
                hasActiveFilters
                  ? "Try adjusting your search query, status, or visibility filters."
                  : "Create your first percentage coupon with India (INR) and USA (USD) thresholds."
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
                ) : canWrite ? (
                  <Button type="button" onClick={handleOpenCreate}>
                    <Plus className="size-4" aria-hidden="true" />
                    New coupon
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
                    <th className="px-4 py-3">Coupon</th>
                    <th className="px-3.5 py-3">Discount &amp; Cap</th>
                    <th className="px-3.5 py-3">Min Cart</th>
                    <th className="px-3.5 py-3">Usage</th>
                    <th className="px-3.5 py-3">Visibility</th>
                    <th className="px-3.5 py-3">Status &amp; Expiry</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {items.map((coupon) => {
                    const isToggling = togglingId === coupon.id;

                    return (
                      <tr
                        key={coupon.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        {/* Code & Description */}
                        <td className="max-w-[240px] px-4 py-3.5 align-top">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                canWrite
                                  ? handleOpenEdit(coupon)
                                  : handleOpenView(coupon)
                              }
                              className="truncate font-mono text-sm font-semibold tracking-wide text-foreground hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                            >
                              {coupon.code}
                            </button>
                            <CopyCodeButton code={coupon.code} />
                          </div>
                          {coupon.description ? (
                            <p
                              className="mt-0.5 truncate text-xs text-muted-foreground"
                              title={coupon.description}
                            >
                              {coupon.description}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs italic text-muted-foreground/70">
                              No description
                            </p>
                          )}
                        </td>

                        {/* Discount & Cap */}
                        <td className="px-3.5 py-3.5 align-top whitespace-nowrap">
                          <div className="tabular-nums font-semibold text-foreground">
                            {formatDiscountPercent(coupon.discountPercentage)}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              off
                            </span>
                          </div>
                          {coupon.maxDiscount ? (
                            <div className="mt-0.5 tabular-nums text-xs text-muted-foreground">
                              Cap{" "}
                              {formatCurrency(coupon.maxDiscount.INR, "INR")} /{" "}
                              {formatCurrency(coupon.maxDiscount.USD, "USD")}
                            </div>
                          ) : (
                            <div className="mt-0.5 text-xs text-muted-foreground/80">
                              No cap
                            </div>
                          )}
                        </td>

                        {/* Min Cart (INR & USD) */}
                        <td className="px-3.5 py-3.5 align-top whitespace-nowrap">
                          <div className="space-y-0.5 tabular-nums text-xs">
                            <div className="text-foreground">
                              <span className="mr-1.5 font-medium text-muted-foreground">
                                IN
                              </span>
                              {formatCurrency(
                                coupon.minCartSubtotal.INR,
                                "INR"
                              )}
                            </div>
                            <div className="text-foreground">
                              <span className="mr-1 font-medium text-muted-foreground">
                                US
                              </span>
                              {formatCurrency(
                                coupon.minCartSubtotal.USD,
                                "USD"
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Usage */}
                        <td className="px-3.5 py-3.5 align-top whitespace-nowrap">
                          <UsageDisplay coupon={coupon} />
                        </td>

                        {/* Visibility */}
                        <td className="px-3.5 py-3.5 align-top whitespace-nowrap">
                          <CouponVisibilityBadge
                            visibility={coupon.visibility}
                          />
                        </td>

                        {/* Status & Expiry */}
                        <td className="px-3.5 py-3.5 align-top whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <CouponStatusBadge
                              status={coupon.effectiveStatus}
                            />
                            <Switch
                              checked={coupon.isActive}
                              onCheckedChange={() =>
                                handleToggleStatus(coupon)
                              }
                              disabled={!canWrite || isToggling}
                              aria-label={`Toggle active status for ${coupon.code}`}
                            />
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[0.72rem] text-muted-foreground">
                            <CalendarClock
                              className="size-3 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="tabular-nums">
                              {coupon.expiresAt
                                ? formatDateTime(coupon.expiresAt, "No expiry")
                                : "No expiry"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 align-top text-right">
                          <CouponActionsMenu
                            coupon={coupon}
                            canWrite={canWrite}
                            onView={handleOpenView}
                            onEdit={handleOpenEdit}
                            onToggleStatus={handleToggleStatus}
                            onDelete={setDeletingCoupon}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="divide-y divide-border md:hidden">
              {items.map((coupon) => {
                const isToggling = togglingId === coupon.id;

                return (
                  <div key={coupon.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              canWrite
                                ? handleOpenEdit(coupon)
                                : handleOpenView(coupon)
                            }
                            className="font-mono text-sm font-semibold tracking-wide text-foreground hover:text-brand"
                          >
                            {coupon.code}
                          </button>
                          <CopyCodeButton code={coupon.code} />
                        </div>
                        {coupon.description ? (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {coupon.description}
                          </p>
                        ) : null}
                      </div>

                      <CouponActionsMenu
                        coupon={coupon}
                        canWrite={canWrite}
                        onView={handleOpenView}
                        onEdit={handleOpenEdit}
                        onToggleStatus={handleToggleStatus}
                        onDelete={setDeletingCoupon}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <CouponStatusBadge status={coupon.effectiveStatus} />
                      <CouponVisibilityBadge visibility={coupon.visibility} />
                      <Badge variant="brand" className="tabular-nums">
                        {formatDiscountPercent(coupon.discountPercentage)} off
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/25 p-2.5 text-xs">
                      <div className="space-y-0.5">
                        <p className="text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground">
                          Min cart
                        </p>
                        <p className="tabular-nums text-foreground">
                          IN{" "}
                          {formatCurrency(coupon.minCartSubtotal.INR, "INR")}
                        </p>
                        <p className="tabular-nums text-foreground">
                          US{" "}
                          {formatCurrency(coupon.minCartSubtotal.USD, "USD")}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground">
                          Max cap
                        </p>
                        {coupon.maxDiscount ? (
                          <>
                            <p className="tabular-nums text-foreground">
                              IN {formatCurrency(coupon.maxDiscount.INR, "INR")}
                            </p>
                            <p className="tabular-nums text-foreground">
                              US {formatCurrency(coupon.maxDiscount.USD, "USD")}
                            </p>
                          </>
                        ) : (
                          <p className="text-muted-foreground">No cap</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-0.5 text-xs">
                      <div className="space-y-0.5 text-muted-foreground">
                        <div className="tabular-nums">
                          Used:{" "}
                          <span className="font-medium text-foreground">
                            {coupon.redemptionCount}
                            {coupon.maxRedemptions !== null
                              ? ` / ${coupon.maxRedemptions}`
                              : " (unlimited)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 tabular-nums">
                          <CalendarClock
                            className="size-3 shrink-0"
                            aria-hidden="true"
                          />
                          {coupon.expiresAt
                            ? formatDateTime(coupon.expiresAt, "No expiry")
                            : "No expiry"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Active</span>
                        <Switch
                          checked={coupon.isActive}
                          onCheckedChange={() => handleToggleStatus(coupon)}
                          disabled={!canWrite || isToggling}
                          aria-label={`Toggle active status for ${coupon.code}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
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

      <CouponFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        coupon={selectedCoupon}
        readOnly={modalReadOnly}
      />

      <DeleteCouponDialog
        coupon={deletingCoupon}
        onClose={() => setDeletingCoupon(null)}
      />
    </div>
  );
}
