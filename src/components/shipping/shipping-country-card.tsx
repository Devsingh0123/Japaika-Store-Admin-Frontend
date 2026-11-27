"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Clock,
  Globe,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/common/form-field";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  useUpdateShippingSettingMutation,
  useUpdateShippingSettingStatusMutation,
} from "@/hooks/use-shipping";
import { ApiError } from "@/lib/api/error";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { applyApiValidationErrors, zodResolver } from "@/lib/forms/zod";
import {
  buildUpdateShippingPayload,
  getShippingFormDefaults,
  MAX_ESTIMATED_DAYS,
  SHIPPING_COUNTRY_META,
  shippingSettingFormSchema,
  type ShippingSettingFormValues,
} from "@/lib/shipping/schemas";
import type { ShippingSetting } from "@/types/shipping";

interface ShippingCountryCardProps {
  setting: ShippingSetting;
  canWrite: boolean;
}

function ShippingCountryCardInner({
  setting,
  canWrite,
}: ShippingCountryCardProps) {
  const meta = SHIPPING_COUNTRY_META[setting.country];
  const [formError, setFormError] = useState<string | null>(null);

  const updateMutation = useUpdateShippingSettingMutation();
  const statusMutation = useUpdateShippingSettingStatusMutation();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ShippingSettingFormValues>({
    resolver: zodResolver(shippingSettingFormSchema),
    defaultValues: getShippingFormDefaults(setting),
  });

  const watchedFlat = useWatch({ control, name: "flatCharge" }) ?? "";
  const watchedThreshold =
    useWatch({ control, name: "freeShippingThreshold" }) ?? "";
  const watchedMinDays = useWatch({ control, name: "estimatedDaysMin" }) ?? "";
  const watchedMaxDays = useWatch({ control, name: "estimatedDaysMax" }) ?? "";

  const isBusy = isSubmitting || updateMutation.isPending;

  const previewText = useMemo(() => {
    if (!setting.isActive) {
      return `Shipping is currently disabled for ${meta.name} checkout.`;
    }

    const flatNum = Number(watchedFlat);
    const hasValidFlat = watchedFlat.trim() !== "" && Number.isFinite(flatNum);
    const thresholdTrimmed = watchedThreshold.trim();
    const thresholdNum = Number(thresholdTrimmed);
    const hasThreshold =
      thresholdTrimmed !== "" && Number.isFinite(thresholdNum);

    let priceRule = "Configure flat rate";
    if (hasValidFlat && (flatNum === 0 || (hasThreshold && thresholdNum === 0))) {
      priceRule = `Always free shipping for ${meta.name}`;
    } else if (hasValidFlat && hasThreshold) {
      priceRule = `Flat ${formatCurrency(flatNum, setting.currency)} shipping; free on orders ≥ ${formatCurrency(thresholdNum, setting.currency)}`;
    } else if (hasValidFlat) {
      priceRule = `Flat ${formatCurrency(flatNum, setting.currency)} shipping on all orders`;
    }

    const minNum = Number(watchedMinDays);
    const maxNum = Number(watchedMaxDays);
    if (
      watchedMinDays.trim() !== "" &&
      watchedMaxDays.trim() !== "" &&
      Number.isInteger(minNum) &&
      Number.isInteger(maxNum) &&
      minNum >= 1 &&
      maxNum >= minNum
    ) {
      const windowLabel =
        minNum === maxNum
          ? `${minNum} business day${minNum === 1 ? "" : "s"}`
          : `${minNum}–${maxNum} business days`;
      return `${priceRule} · Est. ${windowLabel}.`;
    }

    return `${priceRule}.`;
  }, [
    meta.name,
    setting.currency,
    setting.isActive,
    watchedFlat,
    watchedMaxDays,
    watchedMinDays,
    watchedThreshold,
  ]);

  const onSubmit = async (values: ShippingSettingFormValues) => {
    if (!canWrite) {
      return;
    }

    setFormError(null);
    try {
      const payload = buildUpdateShippingPayload(values);
      await updateMutation.mutateAsync({
        country: setting.country,
        input: payload,
      });
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const mapped = applyApiValidationErrors(error, setError);
        if (!mapped) {
          setFormError(error.message);
        }
        return;
      }
      setFormError("Unable to save shipping settings. Please try again.");
    }
  };

  const handleToggleStatus = async () => {
    if (!canWrite || statusMutation.isPending) {
      return;
    }
    await statusMutation.mutateAsync({
      country: setting.country,
      isActive: !setting.isActive,
    });
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="items-start gap-4 border-b border-border bg-muted/20 py-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="size-4 text-brand" aria-hidden="true" />
              {meta.name}
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[0.7rem]">
              {setting.country} · {setting.currency}
            </Badge>
            <StatusBadge
              label={setting.isActive ? "Active" : "Disabled"}
              tone={setting.isActive ? "success" : "muted"}
            />
            {setting.isActive && setting.isAlwaysFree ? (
              <Badge variant="brand" className="text-[0.68rem]">
                Always Free
              </Badge>
            ) : null}
          </div>
          <CardDescription>{meta.regionLabel}</CardDescription>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <span className="text-xs text-muted-foreground">Enabled</span>
          <Switch
            checked={setting.isActive}
            onCheckedChange={handleToggleStatus}
            disabled={!canWrite || statusMutation.isPending}
            aria-label={`Toggle ${meta.name} shipping active status`}
          />
        </div>
      </CardHeader>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col"
        noValidate
      >
        <CardContent className="flex-1 space-y-5 py-5">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              htmlFor={`shipping-flat-${setting.country}`}
              label={`Flat shipping charge (${setting.currency})`}
              required={canWrite}
              error={errors.flatCharge?.message}
              hint="Set to 0 for always-free shipping."
            >
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                >
                  {meta.symbol}
                </span>
                <Input
                  id={`shipping-flat-${setting.country}`}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="99"
                  disabled={!canWrite || isBusy}
                  aria-invalid={Boolean(errors.flatCharge)}
                  className="tabular-nums pl-7"
                  {...register("flatCharge")}
                />
              </div>
            </FormField>

            <FormField
              htmlFor={`shipping-threshold-${setting.country}`}
              label={`Free shipping threshold (${setting.currency})`}
              error={errors.freeShippingThreshold?.message}
              hint="Optional. Leave blank to never waive flat shipping."
            >
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                >
                  {meta.symbol}
                </span>
                <Input
                  id={`shipping-threshold-${setting.country}`}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="No threshold"
                  disabled={!canWrite || isBusy}
                  aria-invalid={Boolean(errors.freeShippingThreshold)}
                  className="tabular-nums pl-7"
                  {...register("freeShippingThreshold")}
                />
              </div>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              htmlFor={`shipping-days-min-${setting.country}`}
              label="Estimated delivery (min days)"
              error={errors.estimatedDaysMin?.message}
              hint={`Optional (1–${MAX_ESTIMATED_DAYS}). Paired with max days.`}
            >
              <Input
                id={`shipping-days-min-${setting.country}`}
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                max={MAX_ESTIMATED_DAYS}
                placeholder="e.g. 3"
                disabled={!canWrite || isBusy}
                aria-invalid={Boolean(errors.estimatedDaysMin)}
                className="tabular-nums"
                {...register("estimatedDaysMin")}
              />
            </FormField>

            <FormField
              htmlFor={`shipping-days-max-${setting.country}`}
              label="Estimated delivery (max days)"
              error={errors.estimatedDaysMax?.message}
              hint={`Optional (1–${MAX_ESTIMATED_DAYS}). Leave both blank to omit.`}
            >
              <Input
                id={`shipping-days-max-${setting.country}`}
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                max={MAX_ESTIMATED_DAYS}
                placeholder="e.g. 5"
                disabled={!canWrite || isBusy}
                aria-invalid={Boolean(errors.estimatedDaysMax)}
                className="tabular-nums"
                {...register("estimatedDaysMax")}
              />
            </FormField>
          </div>

          {/* Live Checkout Rule Preview */}
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/35 px-3.5 py-2.5 text-xs">
            <Sparkles
              className="mt-0.5 size-3.5 shrink-0 text-brand"
              aria-hidden="true"
            />
            <span className="leading-relaxed text-foreground/90">
              {previewText}
            </span>
          </div>
        </CardContent>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/15 px-5 py-3.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">
              Updated {formatDateTime(setting.updatedAt, "Never")}
            </span>
          </div>

          {canWrite ? (
            <div className="flex items-center gap-2">
              {isDirty ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => {
                    setFormError(null);
                    reset(getShippingFormDefaults(setting));
                  }}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Reset
                </Button>
              ) : null}
              <Button
                type="submit"
                size="sm"
                disabled={isBusy || !isDirty}
              >
                {isBusy ? (
                  <>
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" aria-hidden="true" />
                    Save {setting.country} settings
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

export function ShippingCountryCard({
  setting,
  canWrite,
}: ShippingCountryCardProps) {
  return (
    <ShippingCountryCardInner
      key={`${setting.country}-${setting.updatedAt ?? "init"}`}
      setting={setting}
      canWrite={canWrite}
    />
  );
}
