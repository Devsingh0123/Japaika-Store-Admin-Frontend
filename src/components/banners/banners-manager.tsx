"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  GalleryHorizontalEnd,
  Monitor,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import { BannerActionsMenu } from "@/components/banners/banner-actions-menu";
import { BannerFormModal } from "@/components/banners/banner-form-modal";
import { BannerPreviewModal } from "@/components/banners/banner-preview-modal";
import {
  BannerLiveBadge,
  BannerPlacementBadge,
} from "@/components/banners/banner-status-badge";
import { DeleteBannerDialog } from "@/components/banners/delete-banner-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PaginationBar } from "@/components/common/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import {
  useBannersQuery,
  useReorderBannersMutation,
  useUpdateBannerStatusMutation,
} from "@/hooks/use-banners";
import { ApiError } from "@/lib/api/error";
import {
  BANNER_PLACEMENT_LABELS,
  BANNER_PLACEMENTS,
} from "@/lib/banners/schemas";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/types/api";
import type {
  Banner,
  BannerPlacement,
  BannerScheduleStatus,
} from "@/types/banner";

const CATALOG_WRITE_ROLES: readonly AdminRole[] = [
  "super_admin",
  "catalog_manager",
];

function formatScheduleSummary(banner: Banner): string {
  if (!banner.startsAt && !banner.endsAt) {
    return "Always active";
  }
  if (banner.startsAt && banner.endsAt) {
    return `${formatDate(banner.startsAt)} – ${formatDate(banner.endsAt)}`;
  }
  if (banner.startsAt) {
    return `From ${formatDate(banner.startsAt)}`;
  }
  return `Until ${formatDate(banner.endsAt as string)}`;
}

function BannersSkeleton() {
  return (
    <div className="divide-y divide-border" aria-label="Loading banners">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 px-5 py-4"
        >
          <div className="flex items-center gap-3.5">
            <Skeleton className="h-12 w-24 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="hidden h-5 w-28 sm:block" />
          <Skeleton className="hidden h-5 w-20 md:block" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function BannersManager() {
  const { hasRole } = useAuth();
  const canWrite = hasRole(CATALOG_WRITE_ROLES);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [placementFilter, setPlacementFilter] = useState<"" | BannerPlacement>(
    ""
  );
  const [scheduleFilter, setScheduleFilter] = useState<
    "" | BannerScheduleStatus
  >("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [previewingBanner, setPreviewingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const parsedIsActive =
    statusFilter === "" ? undefined : statusFilter === "true";

  const bannersQuery = useBannersQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    placement: placementFilter || undefined,
    scheduleStatus: scheduleFilter || undefined,
    isActive: parsedIsActive,
  });

  const statusMutation = useUpdateBannerStatusMutation();
  const reorderMutation = useReorderBannersMutation();

  const items = bannersQuery.data?.items ?? [];
  const pagination = bannersQuery.data?.pagination ?? {
    page,
    limit,
    totalItems: 0,
    totalPages: 1,
  };

  const hasActiveFilters =
    debouncedSearch !== "" ||
    placementFilter !== "" ||
    scheduleFilter !== "" ||
    statusFilter !== "";

  const canReorderVisible = canWrite && !hasActiveFilters && items.length > 1;

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setPlacementFilter("");
    setScheduleFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormOpen(true);
  };

  const handleToggleStatus = async (banner: Banner) => {
    if (!canWrite) return;
    setTogglingId(banner.id);
    try {
      await statusMutation.mutateAsync({
        id: banner.id,
        isActive: !banner.isActive,
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleMoveBanner = async (index: number, direction: -1 | 1) => {
    if (!canReorderVisible || reorderMutation.isPending) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const baseOffset = (pagination.page - 1) * pagination.limit;
    const payload = reordered.map((banner, idx) => ({
      id: banner.id,
      sortOrder: baseOffset + idx,
    }));

    await reorderMutation.mutateAsync(payload);
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Banners"
        count={bannersQuery.data?.pagination.totalItems}
        description="Manage homepage hero slides and promotional banners, responsive desktop/mobile artwork, CTA destinations, order, and active schedules."
        badge={
          !canWrite ? (
            <Badge variant="outline">
              <ShieldCheck
                className="size-3 text-muted-foreground"
                aria-hidden="true"
              />
              Read-only access
            </Badge>
          ) : undefined
        }
        actions={
          <RoleGate allowedRoles={CATALOG_WRITE_ROLES}>
            <Button
              type="button"
              size="default"
              onClick={handleOpenCreate}
              className="h-9 cursor-pointer px-3.5 shadow-[var(--shadow-xs)]"
            >
              <Plus className="size-4" aria-hidden="true" />
              New banner
            </Button>
          </RoleGate>
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-3.5">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.5fr)_170px_165px_150px_auto]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title, subtitle, badge, or CTA..."
              aria-label="Search banners"
              className="pr-9 pl-9"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 inline-flex w-9 cursor-pointer items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <Select
            aria-label="Filter by placement"
            value={placementFilter}
            onChange={(e) => {
              setPlacementFilter(e.target.value as "" | BannerPlacement);
              setPage(1);
            }}
          >
            <option value="">All placements</option>
            {BANNER_PLACEMENTS.map((placement) => (
              <option key={placement} value={placement}>
                {BANNER_PLACEMENT_LABELS[placement]}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by schedule status"
            value={scheduleFilter}
            onChange={(e) => {
              setScheduleFilter(
                e.target.value as "" | BannerScheduleStatus
              );
              setPage(1);
            }}
          >
            <option value="">All schedules</option>
            <option value="live">Live now</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
          </Select>

          <Select
            aria-label="Filter by active status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "" | "true" | "false");
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleResetFilters}
              className="h-9 cursor-pointer px-3"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset
            </Button>
          ) : null}
        </div>
      </Card>

      {/* Main Content Card */}
      <Card className="overflow-hidden">
        {bannersQuery.isPending ? (
          <BannersSkeleton />
        ) : bannersQuery.isError ? (
          <ErrorState
            title="Unable to load banners"
            message={
              bannersQuery.error instanceof ApiError
                ? bannersQuery.error.message
                : "An unexpected error occurred while fetching banners."
            }
            onRetry={() => bannersQuery.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<GalleryHorizontalEnd className="size-5" aria-hidden="true" />}
            title={hasActiveFilters ? "No matching banners" : "No banners yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your search terms, placement, or schedule filters."
                : "Create your first homepage hero or promotional banner to customize the storefront."
            }
            action={
              hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="cursor-pointer"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Reset filters
                </Button>
              ) : (
                <RoleGate allowedRoles={CATALOG_WRITE_ROLES}>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleOpenCreate}
                    className="cursor-pointer"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    New banner
                  </Button>
                </RoleGate>
              )
            }
          />
        ) : (
          <>
            {/* Mobile Stacked Cards (< md) */}
            <ul
              className={cn(
                "divide-y divide-border md:hidden",
                bannersQuery.isFetching && "opacity-70"
              )}
            >
              {items.map((banner, index) => {
                const isRowToggling = togglingId === banner.id;

                return (
                  <li key={banner.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setPreviewingBanner(banner)}
                        className="group relative h-14 w-24 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-muted/50"
                        aria-label={`Preview ${banner.title}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={banner.imageUrl}
                          alt={banner.altText || banner.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setPreviewingBanner(banner)}
                          className="block max-w-full cursor-pointer truncate text-left text-sm font-semibold text-foreground hover:text-brand"
                        >
                          {banner.title}
                        </button>
                        {banner.subtitle ? (
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {banner.subtitle}
                          </p>
                        ) : null}
                        {banner.ctaUrl ? (
                          <p className="truncate font-mono text-[0.7rem] text-muted-foreground">
                            {banner.ctaLabel
                              ? `${banner.ctaLabel} -> ${banner.ctaUrl}`
                              : banner.ctaUrl}
                          </p>
                        ) : null}
                      </div>

                      <BannerActionsMenu
                        banner={banner}
                        canWrite={canWrite}
                        canMoveUp={canReorderVisible && index > 0}
                        canMoveDown={
                          canReorderVisible && index < items.length - 1
                        }
                        onPreview={setPreviewingBanner}
                        onEdit={handleOpenEdit}
                        onMoveUp={() => handleMoveBanner(index, -1)}
                        onMoveDown={() => handleMoveBanner(index, 1)}
                        onToggleStatus={handleToggleStatus}
                        onDelete={setDeletingBanner}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <BannerPlacementBadge placement={banner.placement} />
                      <BannerLiveBadge banner={banner} />
                      <span className="font-mono tabular-nums text-muted-foreground">
                        Sort {banner.sortOrder}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-2.5 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <CalendarClock className="size-3.5" aria-hidden="true" />
                        {formatScheduleSummary(banner)}
                      </span>

                      {canWrite ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={banner.isActive}
                            disabled={isRowToggling}
                            onCheckedChange={() => handleToggleStatus(banner)}
                            aria-label={`Set ${banner.title} as ${
                              banner.isActive ? "inactive" : "active"
                            }`}
                          />
                          <span className="font-medium text-muted-foreground">
                            {banner.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop Operational Data Table (md+) */}
            <div
              className={cn(
                "hidden overflow-x-auto transition-opacity md:block",
                bannersQuery.isFetching && "opacity-70"
              )}
            >
              <table className="w-full min-w-[740px] border-collapse text-left text-[0.84375rem]">
                <thead>
                  <tr className="border-b border-border bg-muted/45 text-xs font-medium text-muted-foreground">
                    <th scope="col" className="px-4 py-3">
                      Banner
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Placement &amp; media
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Schedule
                    </th>
                    <th scope="col" className="px-3 py-3 text-center">
                      Order
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Updated
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((banner, index) => {
                    const isRowToggling = togglingId === banner.id;

                    return (
                      <tr
                        key={banner.id}
                        className="group transition-colors hover:bg-muted/30"
                      >
                        <td className="max-w-[260px] px-4 py-3.5 xl:max-w-[320px]">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setPreviewingBanner(banner)}
                              aria-label={`Preview ${banner.title}`}
                              className="group/thumb relative h-11 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-muted/50"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={banner.imageUrl}
                                alt={banner.altText || banner.title}
                                className="h-full w-full object-cover transition-transform group-hover/thumb:scale-105"
                                loading="lazy"
                              />
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    canWrite
                                      ? handleOpenEdit(banner)
                                      : setPreviewingBanner(banner)
                                  }
                                  className="max-w-full cursor-pointer truncate text-left font-semibold text-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                                >
                                  {banner.title}
                                </button>
                                {banner.badgeText ? (
                                  <Badge
                                    variant="secondary"
                                    className="px-1.5 py-0 text-[0.65rem]"
                                  >
                                    {banner.badgeText}
                                  </Badge>
                                ) : null}
                              </div>
                              {banner.subtitle ? (
                                <p className="truncate text-xs text-muted-foreground">
                                  {banner.subtitle}
                                </p>
                              ) : null}
                              {banner.ctaUrl ? (
                                <p className="truncate font-mono text-[0.7rem] text-muted-foreground">
                                  {banner.ctaLabel
                                    ? `${banner.ctaLabel} -> ${banner.ctaUrl}`
                                    : banner.ctaUrl}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <div className="flex flex-col items-start gap-1.5">
                            <BannerPlacementBadge placement={banner.placement} />
                            <div className="inline-flex items-center gap-2 text-[0.72rem] text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Monitor
                                  className="size-3"
                                  aria-hidden="true"
                                />
                                Desktop
                              </span>
                              {banner.mobileImageUrl ? (
                                <span className="inline-flex items-center gap-1 text-foreground">
                                  <Smartphone
                                    className="size-3 text-brand"
                                    aria-hidden="true"
                                  />
                                  Mobile
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-xs">
                          <div className="flex flex-col items-start gap-1">
                            <BannerLiveBadge banner={banner} />
                            <span className="tabular-nums text-muted-foreground">
                              {formatScheduleSummary(banner)}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            {canReorderVisible ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                disabled={index === 0 || reorderMutation.isPending}
                                onClick={() => handleMoveBanner(index, -1)}
                                aria-label={`Move ${banner.title} up`}
                                className="cursor-pointer"
                              >
                                <ArrowUp
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                              </Button>
                            ) : null}

                            <span className="min-w-6 text-center font-mono text-xs tabular-nums text-foreground">
                              {banner.sortOrder}
                            </span>

                            {canReorderVisible ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                disabled={
                                  index === items.length - 1 ||
                                  reorderMutation.isPending
                                }
                                onClick={() => handleMoveBanner(index, 1)}
                                aria-label={`Move ${banner.title} down`}
                                className="cursor-pointer"
                              >
                                <ArrowDown
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                              </Button>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          {canWrite ? (
                            <div className="inline-flex items-center gap-2">
                              <Switch
                                checked={banner.isActive}
                                disabled={isRowToggling}
                                onCheckedChange={() =>
                                  handleToggleStatus(banner)
                                }
                                aria-label={`Set ${banner.title} as ${
                                  banner.isActive ? "inactive" : "active"
                                }`}
                              />
                              <span
                                className={cn(
                                  "text-xs font-medium",
                                  banner.isActive
                                    ? "text-success"
                                    : "text-muted-foreground"
                                )}
                              >
                                {banner.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={cn(
                                "text-xs font-medium",
                                banner.isActive
                                  ? "text-success"
                                  : "text-muted-foreground"
                              )}
                            >
                              {banner.isActive ? "Active" : "Inactive"}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3.5 whitespace-nowrap tabular-nums text-xs text-muted-foreground">
                          {formatDate(banner.updatedAt)}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <BannerActionsMenu
                            banner={banner}
                            canWrite={canWrite}
                            canMoveUp={canReorderVisible && index > 0}
                            canMoveDown={
                              canReorderVisible && index < items.length - 1
                            }
                            onPreview={setPreviewingBanner}
                            onEdit={handleOpenEdit}
                            onMoveUp={() => handleMoveBanner(index, -1)}
                            onMoveDown={() => handleMoveBanner(index, 1)}
                            onToggleStatus={handleToggleStatus}
                            onDelete={setDeletingBanner}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationBar
              page={pagination.page}
              limit={pagination.limit}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
              itemLabelSingular="banner"
              itemLabelPlural="banners"
              onPageChange={setPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
            />
          </>
        )}
      </Card>

      <BannerFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        banner={editingBanner}
      />

      <BannerPreviewModal
        banner={previewingBanner}
        canWrite={canWrite}
        onClose={() => setPreviewingBanner(null)}
        onEdit={handleOpenEdit}
      />

      <DeleteBannerDialog
        banner={deletingBanner}
        onClose={() => setDeletingBanner(null)}
      />
    </div>
  );
}
