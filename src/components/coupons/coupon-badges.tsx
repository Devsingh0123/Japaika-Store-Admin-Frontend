"use client";

import { useState } from "react";
import { Check, Copy, EyeOff, Globe } from "lucide-react";
import { toast } from "sonner";
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`Copied "${code}"`);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Unable to copy coupon code.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy coupon code ${code}`}
      title="Copy code"
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-success" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
    </button>
  );
}
