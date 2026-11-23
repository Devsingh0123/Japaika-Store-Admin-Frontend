import { Package } from "lucide-react";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/types/product";

const PRODUCT_STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; tone: StatusTone }
> = {
  active: { label: "Active", tone: "success" },
  draft: { label: "Draft", tone: "muted" },
  archived: { label: "Archived", tone: "warning" },
};

export function ProductStatusBadge({
  status,
  className,
}: {
  status: ProductStatus;
  className?: string;
}) {
  const config = PRODUCT_STATUS_CONFIG[status];
  return (
    <StatusBadge label={config.label} tone={config.tone} className={className} />
  );
}

export function ProductStockBadge({
  totalStock,
  hasLowStock,
  className,
}: {
  totalStock: number;
  hasLowStock: boolean;
  className?: string;
}) {
  if (totalStock <= 0) {
    return (
      <StatusBadge label="Out of stock" tone="destructive" className={className} />
    );
  }

  if (hasLowStock) {
    return (
      <StatusBadge label="Low stock" tone="warning" className={className} />
    );
  }

  return <StatusBadge label="In stock" tone="success" className={className} />;
}

export function ProductThumbnail({
  imageUrl,
  name,
  size = "md",
}: {
  imageUrl: string | null | undefined;
  name: string;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "size-9" : "size-11";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/60",
        sizeClass
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <Package
          className="size-4 text-muted-foreground/70"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
