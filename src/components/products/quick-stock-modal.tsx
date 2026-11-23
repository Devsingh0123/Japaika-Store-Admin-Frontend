"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { ErrorState } from "@/components/common/error-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useProductQuery,
  useUpdateVariantStockMutation,
} from "@/hooks/use-products";
import { ApiError } from "@/lib/api/error";
import { formatINR } from "@/lib/format";
import { quickStockFormSchema } from "@/lib/products/schemas";
import type { ProductListItem, ProductVariant } from "@/types/product";

interface QuickStockModalProps {
  product: Pick<ProductListItem, "id" | "name"> | null;
  onClose: () => void;
}

interface VariantStockRowProps {
  productId: string;
  variant: ProductVariant;
}

function VariantStockRow({ productId, variant }: VariantStockRowProps) {
  const [stockQuantity, setStockQuantity] = useState(
    String(variant.stockQuantity)
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(variant.lowStockThreshold)
  );
  const [isActive, setIsActive] = useState(variant.isActive);
  const [rowError, setRowError] = useState<string | null>(null);
  const [savedFlag, setSavedFlag] = useState(false);

  const mutation = useUpdateVariantStockMutation();

  const isDirty =
    stockQuantity !== String(variant.stockQuantity) ||
    lowStockThreshold !== String(variant.lowStockThreshold) ||
    isActive !== variant.isActive;

  const optionSummary = variant.optionValues
    ? Object.entries(variant.optionValues)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ")
    : null;

  const handleSave = async () => {
    setRowError(null);
    setSavedFlag(false);

    const parsed = quickStockFormSchema.safeParse({
      stockQuantity,
      lowStockThreshold,
      isActive,
    });

    if (!parsed.success) {
      setRowError(
        parsed.error.issues[0]?.message ?? "Please check the stock values."
      );
      return;
    }

    try {
      await mutation.mutateAsync({
        productId,
        variantId: variant.id,
        input: {
          stockQuantity: Number(parsed.data.stockQuantity),
          lowStockThreshold: Number(parsed.data.lowStockThreshold),
          isActive: parsed.data.isActive,
        },
      });
      setSavedFlag(true);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setRowError(error.message);
        return;
      }
      setRowError("Unable to update variant stock. Try again.");
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {variant.title || "Default variant"}
            </p>
            {variant.isDefault ? (
              <Badge variant="brand" className="text-[0.65rem]">
                Default
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{variant.sku}</span>
            <span>·</span>
            <span className="tabular-nums font-medium text-foreground">
              {formatINR(variant.effectivePrice)}
            </span>
            {optionSummary ? (
              <>
                <span>·</span>
                <span>{optionSummary}</span>
              </>
            ) : null}
          </div>
        </div>

        <StatusBadge
          label={
            variant.isOutOfStock
              ? "Out of stock"
              : variant.isLowStock
                ? "Low stock"
                : "In stock"
          }
          tone={
            variant.isOutOfStock
              ? "destructive"
              : variant.isLowStock
                ? "warning"
                : "success"
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <div className="space-y-1">
          <Label htmlFor={`stock-${variant.id}`} className="text-xs">
            Stock quantity
          </Label>
          <Input
            id={`stock-${variant.id}`}
            type="number"
            min={0}
            step={1}
            value={stockQuantity}
            onChange={(e) => {
              setStockQuantity(e.target.value);
              setSavedFlag(false);
            }}
            className="h-9 tabular-nums"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`threshold-${variant.id}`} className="text-xs">
            Low-stock alert
          </Label>
          <Input
            id={`threshold-${variant.id}`}
            type="number"
            min={0}
            step={1}
            value={lowStockThreshold}
            onChange={(e) => {
              setLowStockThreshold(e.target.value);
              setSavedFlag(false);
            }}
            className="h-9 tabular-nums"
          />
        </div>

        <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-muted/35 px-3">
          <Switch
            checked={isActive}
            onCheckedChange={(checked) => {
              setIsActive(checked);
              setSavedFlag(false);
            }}
            aria-label={`Set variant ${variant.sku} active`}
          />
          <span className="text-xs font-medium text-foreground">
            {isActive ? "Active" : "Paused"}
          </span>
        </div>

        <Button
          type="button"
          size="default"
          disabled={!isDirty || mutation.isPending}
          onClick={handleSave}
          className="h-9 cursor-pointer px-3.5"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Saving
            </>
          ) : savedFlag && !isDirty ? (
            <>
              <Check className="size-3.5" aria-hidden="true" />
              Saved
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>

      {rowError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive-muted px-3 py-2 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{rowError}</span>
        </div>
      ) : null}
    </div>
  );
}

export function QuickStockModal({ product, onClose }: QuickStockModalProps) {
  const detailQuery = useProductQuery(product?.id, product !== null);

  return (
    <Dialog
      open={product !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent variant="modal" className="max-w-2xl">
        <DialogHeader>
          <div className="min-w-0 pr-2">
            <DialogTitle className="truncate">
              Stock controls · {product?.name ?? ""}
            </DialogTitle>
            <DialogDescription>
              Adjust on-hand inventory, low-stock thresholds, and active selling
              status per variant.
            </DialogDescription>
          </div>
          <DialogClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close stock modal"
                className="cursor-pointer"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            }
          />
        </DialogHeader>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto px-6 py-5">
          {detailQuery.isPending ? (
            <div className="space-y-3" aria-label="Loading variants">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : detailQuery.isError ? (
            <ErrorState
              title="Unable to load variants"
              message={
                detailQuery.error instanceof ApiError
                  ? detailQuery.error.message
                  : "Failed to fetch product variants."
              }
              onRetry={() => detailQuery.refetch()}
            />
          ) : (detailQuery.data?.variants ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No variants found for this product.
            </p>
          ) : (
            (detailQuery.data?.variants ?? []).map((variant) => (
              <VariantStockRow
                key={`${variant.id}-${variant.updatedAt ?? variant.stockQuantity}-${variant.isActive}`}
                productId={detailQuery.data!.id}
                variant={variant}
              />
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
