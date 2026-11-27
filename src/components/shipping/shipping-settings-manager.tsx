"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { ShippingCountryCard } from "@/components/shipping/shipping-country-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useShippingSettingsQuery } from "@/hooks/use-shipping";
import { ApiError } from "@/lib/api/error";
import { MODULE_ROLE_ACCESS } from "@/lib/auth/rbac";

function ShippingSkeleton() {
  return (
    <div
      className="grid gap-6 xl:grid-cols-2"
      aria-label="Loading shipping settings"
    >
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="border-b border-border py-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-52" />
            </div>
            <Skeleton className="h-6 w-16" />
          </CardHeader>
          <CardContent className="space-y-4 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ShippingSettingsManager() {
  const { hasRole } = useAuth();
  const canWrite = hasRole(MODULE_ROLE_ACCESS.shipping);
  const canViewOrders = hasRole(MODULE_ROLE_ACCESS.orders);

  const shippingQuery = useShippingSettingsQuery();
  const items = shippingQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipping Settings"
        description="Configure country-wise flat shipping rates, free-shipping cart thresholds, and estimated delivery windows for India (INR) and USA (USD)."
        badge={
          !canWrite ? (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <ShieldCheck className="size-3" aria-hidden="true" />
              Read-only access
            </Badge>
          ) : (
            <Badge variant="muted" className="tabular-nums">
              {items.length} market{items.length === 1 ? "" : "s"}
            </Badge>
          )
        }
        actions={
          canViewOrders ? (
            <Link
              href="/orders"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-[var(--shadow-xs)] transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ShoppingBag
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              View orders
              <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </Link>
          ) : undefined
        }
      />

      {shippingQuery.isLoading ? (
        <ShippingSkeleton />
      ) : shippingQuery.isError ? (
        <Card className="p-6">
          <ErrorState
            title="Unable to load shipping settings"
            message={
              shippingQuery.error instanceof ApiError
                ? shippingQuery.error.message
                : "Something went wrong while fetching regional shipping settings."
            }
            onRetry={() => shippingQuery.refetch()}
          />
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<Truck className="size-5" aria-hidden="true" />}
            title="No shipping configurations found"
            description="Seeded shipping settings for India (IN) and USA (US) will appear here."
          />
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {items.map((setting) => (
            <ShippingCountryCard
              key={setting.id}
              setting={setting}
              canWrite={canWrite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
