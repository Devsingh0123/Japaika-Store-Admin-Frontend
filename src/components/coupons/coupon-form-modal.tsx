"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  Info,
  Loader2,
  Lock,
  Sparkles,
  X,
} from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/common/form-field";
import { CouponStatusBadge } from "@/components/coupons/coupon-badges";
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
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCouponMutation,
  useUpdateCouponMutation,
} from "@/hooks/use-coupons";
import { ApiError } from "@/lib/api/error";
import {
  buildCreateCouponPayload,
  buildUpdateCouponPayload,
  COUPON_VISIBILITY_LABELS,
  COUPON_VISIBILITY_OPTIONS,
  createCouponFormSchema,
  formatDiscountPercent,
  normalizeCouponCode,
  type CouponFormValues,
} from "@/lib/coupons/schemas";
import { formatCurrency, toDateTimeLocalValue } from "@/lib/format";
import { applyApiValidationErrors, zodResolver } from "@/lib/forms/zod";
import type { Coupon } from "@/types/coupon";

interface CouponFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
  readOnly?: boolean;
}

function getDefaultValues(coupon: Coupon | null): CouponFormValues {
  if (!coupon) {
    return {
      code: "",
      description: "",
      discountPercentage: "",
      minCartSubtotalInr: "",
      minCartSubtotalUsd: "",
      hasMaxDiscount: false,
      maxDiscountInr: "",
      maxDiscountUsd: "",
      maxRedemptions: "",
      visibility: "public",
      isActive: true,
      expiresAt: "",
    };
  }

  return {
    code: coupon.code,
    description: coupon.description ?? "",
    discountPercentage: coupon.discountPercentage,
    minCartSubtotalInr: coupon.minCartSubtotal.INR,
    minCartSubtotalUsd: coupon.minCartSubtotal.USD,
    hasMaxDiscount: coupon.maxDiscount !== null,
    maxDiscountInr: coupon.maxDiscount?.INR ?? "",
    maxDiscountUsd: coupon.maxDiscount?.USD ?? "",
    maxRedemptions:
      coupon.maxRedemptions === null ? "" : String(coupon.maxRedemptions),
    visibility: coupon.visibility,
    isActive: coupon.isActive,
    expiresAt: toDateTimeLocalValue(coupon.expiresAt),
  };
}

function mapApiFieldName(field: string): keyof CouponFormValues | null {
  switch (field) {
    case "code":
      return "code";
    case "description":
      return "description";
    case "discountPercentage":
      return "discountPercentage";
    case "minCartSubtotal.INR":
      return "minCartSubtotalInr";
    case "minCartSubtotal.USD":
      return "minCartSubtotalUsd";
    case "maxDiscount.INR":
      return "maxDiscountInr";
    case "maxDiscount.USD":
      return "maxDiscountUsd";
    case "maxRedemptions":
      return "maxRedemptions";
    case "visibility":
      return "visibility";
    case "isActive":
      return "isActive";
    case "expiresAt":
      return "expiresAt";
    default:
      return null;
  }
}

interface CouponFormBodyProps {
  coupon: Coupon | null;
  readOnly: boolean;
  onClose: () => void;
}

function CouponFormBody({ coupon, readOnly, onClose }: CouponFormBodyProps) {
  const isEditing = coupon !== null;
  const isCodeLocked = isEditing && coupon.redemptionCount > 0;
  const initialExpiresAt = useMemo(
    () => (coupon ? toDateTimeLocalValue(coupon.expiresAt) : ""),
    [coupon]
  );

  const schema = useMemo(
    () =>
      createCouponFormSchema({
        isCodeLocked,
        minRedemptions: coupon?.redemptionCount ?? 0,
        initialExpiresAt,
      }),
    [coupon?.redemptionCount, initialExpiresAt, isCodeLocked]
  );

  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateCouponMutation();
  const updateMutation = useUpdateCouponMutation();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(coupon),
  });

  const watchedDescription = useWatch({ control, name: "description" }) ?? "";
  const watchedDiscount =
    useWatch({ control, name: "discountPercentage" }) ?? "";
  const watchedMinInr = useWatch({ control, name: "minCartSubtotalInr" }) ?? "";
  const watchedMinUsd = useWatch({ control, name: "minCartSubtotalUsd" }) ?? "";
  const watchedHasMaxDiscount =
    useWatch({ control, name: "hasMaxDiscount" }) ?? false;
  const watchedMaxInr = useWatch({ control, name: "maxDiscountInr" }) ?? "";
  const watchedMaxUsd = useWatch({ control, name: "maxDiscountUsd" }) ?? "";
  const watchedExpiresAt = useWatch({ control, name: "expiresAt" }) ?? "";
  const watchedVisibility =
    useWatch({ control, name: "visibility" }) ?? "public";

  const isBusy =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const summaryText = useMemo(() => {
    const pctNum = Number(watchedDiscount);
    const pctText =
      watchedDiscount.trim() !== "" && Number.isFinite(pctNum) && pctNum > 0
        ? `${formatDiscountPercent(pctNum)} off`
        : "Percentage discount";

    const hasMinInr =
      watchedMinInr.trim() !== "" && Number.isFinite(Number(watchedMinInr));
    const hasMinUsd =
      watchedMinUsd.trim() !== "" && Number.isFinite(Number(watchedMinUsd));

    const minPart =
      hasMinInr && hasMinUsd
        ? `on orders ≥ ${formatCurrency(watchedMinInr, "INR")} / ${formatCurrency(watchedMinUsd, "USD")}`
        : "with mandatory INR & USD minimum cart thresholds";

    if (!watchedHasMaxDiscount) {
      return `${pctText} ${minPart}, no maximum discount cap.`;
    }

    const hasCapInr =
      watchedMaxInr.trim() !== "" && Number.isFinite(Number(watchedMaxInr));
    const hasCapUsd =
      watchedMaxUsd.trim() !== "" && Number.isFinite(Number(watchedMaxUsd));

    const capPart =
      hasCapInr && hasCapUsd
        ? `capped at ${formatCurrency(watchedMaxInr, "INR")} / ${formatCurrency(watchedMaxUsd, "USD")}`
        : "with paired INR & USD max discount caps";

    return `${pctText} ${minPart}, ${capPart}.`;
  }, [
    watchedDiscount,
    watchedHasMaxDiscount,
    watchedMaxInr,
    watchedMaxUsd,
    watchedMinInr,
    watchedMinUsd,
  ]);

  const onSubmit = async (values: CouponFormValues) => {
    if (readOnly) {
      return;
    }

    setFormError(null);

    try {
      if (isEditing) {
        const payload = buildUpdateCouponPayload(
          values,
          coupon,
          initialExpiresAt
        );
        await updateMutation.mutateAsync({ id: coupon.id, input: payload });
      } else {
        const payload = buildCreateCouponPayload(values);
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (
          error.code === "COUPON_CODE_EXISTS" ||
          error.code === "COUPON_CODE_LOCKED"
        ) {
          setError("code", { type: "server", message: error.message });
          return;
        }

        let mappedAny = false;
        if (error.details && Array.isArray(error.details)) {
          for (const detail of error.details) {
            if (
              detail &&
              typeof detail === "object" &&
              "field" in detail &&
              "message" in detail &&
              typeof detail.field === "string" &&
              typeof detail.message === "string"
            ) {
              const targetField = mapApiFieldName(detail.field);
              if (targetField) {
                setError(targetField, {
                  type: "server",
                  message: detail.message,
                });
                mappedAny = true;
              }
            }
          }
        }

        if (!mappedAny) {
          const fallbackMapped = applyApiValidationErrors(error, setError);
          if (!fallbackMapped) {
            setFormError(error.message);
          }
        }
        return;
      }

      setFormError(
        "Unable to save coupon right now. Please review the form and try again."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
      noValidate
    >
      <DialogHeader className="shrink-0">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>
              {readOnly
                ? `Coupon ${coupon?.code ?? ""}`
                : isEditing
                  ? `Edit coupon ${coupon.code}`
                  : "Create coupon"}
            </DialogTitle>
            {coupon ? (
              <CouponStatusBadge status={coupon.effectiveStatus} />
            ) : null}
          </div>
          <DialogDescription>
            {readOnly
              ? "Read-only inspection of discount rules, regional cart thresholds, and usage limits."
              : isEditing
                ? "Update discount rules, regional thresholds, usage caps, or visibility."
                : "Configure a percentage-based coupon with India (INR) and USA (USD) thresholds."}
          </DialogDescription>
        </div>
        <DialogClose
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close modal"
            />
          }
        >
          <X className="size-4" />
        </DialogClose>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive-soft px-3.5 py-2.5 text-sm text-destructive"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>{formError}</span>
          </div>
        ) : null}

        {/* Section 1: Identity & Visibility */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              htmlFor="coupon-code"
              label="Coupon code"
              required={!isCodeLocked && !readOnly}
              error={errors.code?.message}
              hint={
                isCodeLocked
                  ? "Locked because this coupon has already been redeemed."
                  : "3–32 chars (A–Z, 0–9, - or _). Stored in uppercase."
              }
            >
              <div className="relative">
                <Input
                  id="coupon-code"
                  placeholder="WELCOME15"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={readOnly || isCodeLocked || isBusy}
                  aria-invalid={Boolean(errors.code)}
                  className="font-mono uppercase tracking-wider pr-9"
                  {...register("code", {
                    onChange: (event) => {
                      const next = event.target.value.toUpperCase();
                      setValue("code", next, { shouldValidate: false });
                    },
                    onBlur: (event) => {
                      setValue("code", normalizeCouponCode(event.target.value), {
                        shouldValidate: true,
                      });
                    },
                  })}
                />
                {isCodeLocked ? (
                  <Lock
                    className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </FormField>

            <FormField
              htmlFor="coupon-visibility"
              label="Visibility"
              hint={
                watchedVisibility === "public"
                  ? "Discoverable in storefront coupon lists."
                  : "Private code — customers must enter it directly."
              }
            >
              <Controller
                control={control}
                name="visibility"
                render={({ field }) => (
                  <Select
                    id="coupon-visibility"
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    disabled={readOnly || isBusy}
                  >
                    {COUPON_VISIBILITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {COUPON_VISIBILITY_LABELS[option]}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormField>
          </div>

          <FormField
            htmlFor="coupon-description"
            label="Description"
            error={errors.description?.message}
            hint={`${watchedDescription.length}/255 characters. Optional internal or customer-facing summary.`}
          >
            <Textarea
              id="coupon-description"
              rows={2}
              maxLength={255}
              placeholder="e.g. Festive welcome offer on sacred rudraksha & gemstones"
              disabled={readOnly || isBusy}
              aria-invalid={Boolean(errors.description)}
              {...register("description")}
            />
          </FormField>
        </div>

        {/* Section 2: Discount & Regional Thresholds */}
        <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Discount &amp; regional rules
              </h3>
              <p className="text-xs text-muted-foreground">
                Percentage discount with mandatory India (INR) and USA (USD)
                minimum cart thresholds.
              </p>
            </div>
            <Badge variant="brand" className="text-[0.68rem]">
              Percentage
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              htmlFor="coupon-discount-percentage"
              label="Discount (%)"
              required={!readOnly}
              error={errors.discountPercentage?.message}
              hint="0.01 to 100"
            >
              <div className="relative">
                <Input
                  id="coupon-discount-percentage"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  max="100"
                  placeholder="15"
                  disabled={readOnly || isBusy}
                  aria-invalid={Boolean(errors.discountPercentage)}
                  className="tabular-nums pr-8"
                  {...register("discountPercentage")}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                >
                  %
                </span>
              </div>
            </FormField>

            <FormField
              htmlFor="coupon-min-inr"
              label="Min cart (India INR)"
              required={!readOnly}
              error={errors.minCartSubtotalInr?.message}
              hint="0 for no minimum"
            >
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                >
                  ₹
                </span>
                <Input
                  id="coupon-min-inr"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="1500"
                  disabled={readOnly || isBusy}
                  aria-invalid={Boolean(errors.minCartSubtotalInr)}
                  className="tabular-nums pl-7"
                  {...register("minCartSubtotalInr")}
                />
              </div>
            </FormField>

            <FormField
              htmlFor="coupon-min-usd"
              label="Min cart (USA USD)"
              required={!readOnly}
              error={errors.minCartSubtotalUsd?.message}
              hint="0 for no minimum"
            >
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                >
                  $
                </span>
                <Input
                  id="coupon-min-usd"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="25"
                  disabled={readOnly || isBusy}
                  aria-invalid={Boolean(errors.minCartSubtotalUsd)}
                  className="tabular-nums pl-7"
                  {...register("minCartSubtotalUsd")}
                />
              </div>
            </FormField>
          </div>

          {/* Optional Max Discount Cap */}
          <div className="space-y-3 border-t border-border pt-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label
                  htmlFor="coupon-has-max-discount"
                  className="text-sm font-medium text-foreground"
                >
                  Cap maximum discount
                </Label>
                <p className="text-xs text-muted-foreground">
                  Optional. When enabled, both India (INR) and USA (USD) caps
                  must be set.
                </p>
              </div>
              <Controller
                control={control}
                name="hasMaxDiscount"
                render={({ field }) => (
                  <Switch
                    id="coupon-has-max-discount"
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        setValue("maxDiscountInr", "", {
                          shouldValidate: false,
                        });
                        setValue("maxDiscountUsd", "", {
                          shouldValidate: false,
                        });
                      }
                    }}
                    disabled={readOnly || isBusy}
                    aria-label="Cap maximum discount"
                  />
                )}
              />
            </div>

            {watchedHasMaxDiscount ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  htmlFor="coupon-max-inr"
                  label="Max discount cap (India INR)"
                  required={!readOnly}
                  error={errors.maxDiscountInr?.message}
                >
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                    >
                      ₹
                    </span>
                    <Input
                      id="coupon-max-inr"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0.01"
                      placeholder="500"
                      disabled={readOnly || isBusy}
                      aria-invalid={Boolean(errors.maxDiscountInr)}
                      className="tabular-nums pl-7"
                      {...register("maxDiscountInr")}
                    />
                  </div>
                </FormField>

                <FormField
                  htmlFor="coupon-max-usd"
                  label="Max discount cap (USA USD)"
                  required={!readOnly}
                  error={errors.maxDiscountUsd?.message}
                >
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                    >
                      $
                    </span>
                    <Input
                      id="coupon-max-usd"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0.01"
                      placeholder="10"
                      disabled={readOnly || isBusy}
                      aria-invalid={Boolean(errors.maxDiscountUsd)}
                      className="tabular-nums pl-7"
                      {...register("maxDiscountUsd")}
                    />
                  </div>
                </FormField>
              </div>
            ) : null}
          </div>

          {/* Live Rule Summary Strip */}
          <div className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            <Sparkles
              className="mt-0.5 size-3.5 shrink-0 text-brand"
              aria-hidden="true"
            />
            <span className="leading-relaxed text-foreground/90">
              {summaryText}
            </span>
          </div>
        </div>

        {/* Section 3: Usage Limits, Expiry & Status */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              htmlFor="coupon-max-redemptions"
              label="Total usage limit"
              error={errors.maxRedemptions?.message}
              hint={
                isEditing
                  ? `Redeemed ${coupon.redemptionCount} time${coupon.redemptionCount === 1 ? "" : "s"}${
                      coupon.remainingRedemptions !== null
                        ? ` · ${coupon.remainingRedemptions} remaining`
                        : " · Unlimited"
                    }. Leave blank for unlimited.`
                  : "Optional. Leave blank for unlimited redemptions."
              }
            >
              <Input
                id="coupon-max-redemptions"
                type="number"
                inputMode="numeric"
                step="1"
                min={Math.max(1, coupon?.redemptionCount ?? 1)}
                placeholder="Unlimited"
                disabled={readOnly || isBusy}
                aria-invalid={Boolean(errors.maxRedemptions)}
                className="tabular-nums"
                {...register("maxRedemptions")}
              />
            </FormField>

            <FormField
              htmlFor="coupon-expires-at"
              label="Expiry date & time"
              error={errors.expiresAt?.message}
              hint={
                coupon?.isExpired && watchedExpiresAt === initialExpiresAt
                  ? "This coupon is currently expired. Pick a future date or clear to reactivate."
                  : "Optional. Leave blank for no expiry."
              }
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <CalendarClock
                    className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="coupon-expires-at"
                    type="datetime-local"
                    disabled={readOnly || isBusy}
                    aria-invalid={Boolean(errors.expiresAt)}
                    className="pl-8 tabular-nums"
                    {...register("expiresAt")}
                  />
                </div>
                {!readOnly && watchedExpiresAt !== "" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() =>
                      setValue("expiresAt", "", { shouldValidate: true })
                    }
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
            </FormField>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
            <div className="space-y-0.5">
              <Label
                htmlFor="coupon-is-active"
                className="text-sm font-medium text-foreground"
              >
                Active status
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable to allow eligible customers to redeem this coupon
                immediately.
              </p>
            </div>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  id="coupon-is-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={readOnly || isBusy}
                  aria-label="Coupon active status"
                />
              )}
            />
          </div>

          {readOnly ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
              <Info className="size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Only Super Admins and Catalog Managers can create or modify
                coupons.
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <DialogFooter className="shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isBusy}
        >
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {!readOnly ? (
          <Button type="submit" disabled={isBusy}>
            {isBusy ? (
              <>
                <Loader2
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                {isEditing ? "Saving..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Save changes"
            ) : (
              "Create coupon"
            )}
          </Button>
        ) : null}
      </DialogFooter>
    </form>
  );
}

export function CouponFormModal({
  open,
  onOpenChange,
  coupon,
  readOnly = false,
}: CouponFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="modal" className="max-w-2xl">
        {open ? (
          <CouponFormBody
            key={`${coupon?.id ?? "create"}-${readOnly ? "view" : "edit"}`}
            coupon={coupon}
            readOnly={readOnly}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
