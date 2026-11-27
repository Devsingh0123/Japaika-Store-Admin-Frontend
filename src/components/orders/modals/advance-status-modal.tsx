"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Loader2, Truck, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { FormField } from "@/components/common/form-field";
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
import { Switch } from "@/components/ui/switch";
import { useUpdateOrderStatusMutation } from "@/hooks/use-orders";
import { ApiError } from "@/lib/api/error";
import { applyApiValidationErrors, zodResolver } from "@/lib/forms/zod";
import {
  createAdvanceStatusSchema,
  ORDER_NEXT_ACTION_LABELS,
  ORDER_STATUS_LABELS,
  type AdvanceStatusFormValues,
} from "@/lib/orders/schemas";
import type { OrderDetail, OrderStatus } from "@/types/order";

interface AdvanceStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetail;
  targetStatus: OrderStatus | null;
}

function AdvanceStatusBody({
  order,
  targetStatus,
  onClose,
}: {
  order: OrderDetail;
  targetStatus: OrderStatus;
  onClose: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useUpdateOrderStatusMutation();

  const schema = useMemo(
    () => createAdvanceStatusSchema(targetStatus),
    [targetStatus]
  );

  const showTrackingFields = targetStatus === "shipped";
  const showCodPaidOption =
    targetStatus === "delivered" &&
    order.paymentMethod === "cod" &&
    order.paymentStatus === "pending";

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AdvanceStatusFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      courierName: order.tracking.courierName ?? "",
      awbNumber: order.tracking.awbNumber ?? "",
      trackingUrl: order.tracking.trackingUrl ?? "",
      markCodPaid: showCodPaidOption,
    },
  });

  const isBusy = isSubmitting || mutation.isPending;

  const onSubmit = async (values: AdvanceStatusFormValues) => {
    setFormError(null);
    try {
      await mutation.mutateAsync({
        id: order.id,
        input: {
          status: targetStatus,
          ...(showTrackingFields
            ? {
                courierName: values.courierName.trim(),
                awbNumber: values.awbNumber.trim(),
                trackingUrl: values.trackingUrl.trim() || null,
              }
            : {}),
          ...(showCodPaidOption ? { markCodPaid: values.markCodPaid } : {}),
        },
      });
      onClose();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const mapped = applyApiValidationErrors(error, setError);
        if (!mapped) {
          setFormError(error.message);
        }
        return;
      }
      setFormError("Unable to update order status right now. Please try again.");
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
          <DialogTitle>{ORDER_NEXT_ACTION_LABELS[targetStatus]}</DialogTitle>
          <DialogDescription>
            Transition <span className="font-mono font-medium">{order.orderNumber}</span>{" "}
            from <strong>{ORDER_STATUS_LABELS[order.status]}</strong> to{" "}
            <strong>{ORDER_STATUS_LABELS[targetStatus]}</strong>.
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

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive-soft px-3.5 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        ) : null}

        {showTrackingFields ? (
          <div className="space-y-4 rounded-xl border border-border bg-muted/25 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Truck className="size-4 text-brand" aria-hidden="true" />
              Shipment tracking details
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                htmlFor="ship-courier-name"
                label="Courier name"
                required
                error={errors.courierName?.message}
              >
                <Input
                  id="ship-courier-name"
                  placeholder="e.g. BlueDart, Delhivery, DHL"
                  disabled={isBusy}
                  aria-invalid={Boolean(errors.courierName)}
                  {...register("courierName")}
                />
              </FormField>

              <FormField
                htmlFor="ship-awb-number"
                label="AWB / Tracking number"
                required
                error={errors.awbNumber?.message}
              >
                <Input
                  id="ship-awb-number"
                  placeholder="e.g. BD123456789IN"
                  disabled={isBusy}
                  aria-invalid={Boolean(errors.awbNumber)}
                  className="font-mono"
                  {...register("awbNumber")}
                />
              </FormField>
            </div>

            <FormField
              htmlFor="ship-tracking-url"
              label="Tracking URL"
              error={errors.trackingUrl?.message}
              hint="Optional direct courier tracking link (http:// or https://)."
            >
              <Input
                id="ship-tracking-url"
                type="url"
                placeholder="https://www.bluedart.com/tracking?..."
                disabled={isBusy}
                aria-invalid={Boolean(errors.trackingUrl)}
                {...register("trackingUrl")}
              />
            </FormField>
          </div>
        ) : null}

        {showCodPaidOption ? (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
            <div className="space-y-0.5">
              <Label
                htmlFor="mark-cod-paid"
                className="text-sm font-medium text-foreground"
              >
                Mark COD payment as collected (Paid)
              </Label>
              <p className="text-xs text-muted-foreground">
                Records cash-on-delivery payment as paid along with delivery
                confirmation.
              </p>
            </div>
            <Controller
              control={control}
              name="markCodPaid"
              render={({ field }) => (
                <Switch
                  id="mark-cod-paid"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isBusy}
                  aria-label="Mark COD payment as paid"
                />
              )}
            />
          </div>
        ) : null}

        {!showTrackingFields && !showCodPaidOption ? (
          <p className="text-sm text-muted-foreground">
            Confirm this fulfillment update. The order timeline and customer
            status will reflect{" "}
            <strong className="text-foreground">
              {ORDER_STATUS_LABELS[targetStatus]}
            </strong>{" "}
            immediately.
          </p>
        ) : null}
      </div>

      <DialogFooter className="shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isBusy}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isBusy}>
          {isBusy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Updating...
            </>
          ) : (
            ORDER_NEXT_ACTION_LABELS[targetStatus]
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AdvanceStatusModal({
  open,
  onOpenChange,
  order,
  targetStatus,
}: AdvanceStatusModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="modal" className="max-w-lg">
        {open && targetStatus ? (
          <AdvanceStatusBody
            key={`${order.id}-${targetStatus}`}
            order={order}
            targetStatus={targetStatus}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
