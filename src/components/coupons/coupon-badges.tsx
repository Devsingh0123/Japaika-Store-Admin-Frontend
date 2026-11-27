"use client";

import { EyeOff, Globe } from "lucide-react";
import { CopyButton } from "@/components/common/copy-button";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  CouponEffectiveStatus,
  CouponVisibility,
} from "@/types/coupon";

const STATUS_META: Record<
  CouponEffectiveStatus,
  { label: string; tone: "success" | "muted" | "warning" | "destructive" }
> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "muted" },
  expired: { label: "Expired", tone: "warning" },
  exhausted: { label: "Exhausted", tone: "destructive" },
};

export function CouponStatusBadge({
  status,
  className,
}: {
  status: CouponEffectiveStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <StatusBadge label={meta.label} tone={meta.tone} className={className} />
  );
}

export function CouponVisibilityBadge({
  visibility,
  className,
}: {
  visibility: CouponVisibility;
  className?: string;
}) {
  if (visibility === "public") {
    return (
      <Badge variant="info" className={cn("gap-1", className)}>
        <Globe className="size-3" aria-hidden="true" />
        Public
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn("gap-1 text-muted-foreground", className)}>
      <EyeOff className="size-3" aria-hidden="true" />
      Hidden
    </Badge>
  );
}

export function CopyCodeButton({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <CopyButton
      value={code}
      ariaLabel={`Copy coupon code ${code}`}
      toastMessage={`Copied "${code}"`}
      className={className}
    />
  );
}
