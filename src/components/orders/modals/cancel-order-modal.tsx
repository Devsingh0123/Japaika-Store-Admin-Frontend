"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, Loader2, X } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCancelOrderMutation } from "@/hooks/use-orders";
import { ApiError } from "@/lib/api/error";
import { applyApiValidationErrors, zodResolver } from "@/lib/forms/zod";
import {
  cancelOrderFormSchema,
  type CancelOrderFormValues,
} from "@/lib/orders/schemas";
import type { OrderDetail } from "@/types/order";

interface CancelOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetail;
}

function CancelOrderBody({
  order,
  onClose,
}: {
  order: OrderDetail;
  onClose: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useCancelOrderMutation();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CancelOrderFormValues>({
    resolver: zodResolver(cancelOrderFormSchema),
    defaultValues: {
      reason: "",
      restoreStock: !order.stockRestored,
    },
  });

  const watchedReason = useWatch({ control, name: "reason" }) ?? "";
  const isBusy = isSubmitting || mutation.isPending;

  const onSubmit = async (values: CancelOrderFormValues) => {
    setFormError(null);
    try {
      await mutation.mutateAsync({
        id: order.id,
        input: {
          reason: values.reason.trim(),
          restoreStock: values.restoreStock,
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
      setFormError("Unable to cancel this order right now. Please try again.");
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
          <DialogTitle>Cancel order {order.orderNumber}?</DialogTitle>
          <DialogDescription>
            Cancelling stops fulfillment permanently. This action is audited.
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

        {order.paymentStatus === "paid" ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-warning/35 bg-warning-soft px-3.5 py-2.5 text-xs text-warning-foreground">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-warning"
              aria-hidden="true"
            />
            <span>
              This order is already <strong>Paid</strong>. Cancelling will mark
              its payment as <strong>Refund Pending</strong> so you can issue a
              Razorpay or manual refund immediately afterward.
            </span>
          </div>
        ) : null}

        <FormField
          htmlFor="cancel-order-reason"
          label="Cancellation reason"
          required
          error={errors.reason?.message}
          hint={`${watchedReason.length}/255 characters. Visible to operations and audit logs.`}
        >
          <Textarea
            id="cancel-order-reason"
            rows={3}
            maxLength={255}
            placeholder="e.g. Customer requested cancellation prior to dispatch"
            disabled={isBusy}
            aria-invalid={Boolean(errors.reason)}
            {...register("reason")}
          />
        </FormField>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
          <div className="space-y-0.5">
            <Label
              htmlFor="cancel-restore-stock"
              className="text-sm font-medium text-foreground"
            >
              Restore inventory &amp; coupon usage
            </Label>
            <p className="text-xs text-muted-foreground">
              {order.stockRestored
                ? "Stock and coupon usage have already been restored for this order."
                : "Returns ordered item quantities to variant stock and decrements coupon redemption count."}
            </p>
          </div>
          <Controller
            control={control}
            name="restoreStock"
            render={({ field }) => (
              <Switch
                id="cancel-restore-stock"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isBusy || order.stockRestored}
                aria-label="Restore inventory and coupon usage"
              />
            )}
          />
        </div>
      </div>

      <DialogFooter className="shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isBusy}
        >
          Keep order
        </Button>
        <Button type="submit" variant="destructive" disabled={isBusy}>
          {isBusy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Cancelling...
            </>
          ) : (
            "Cancel order"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CancelOrderModal({
  open,
  onOpenChange,
  order,
}: CancelOrderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="modal" className="max-w-lg">
        {open ? (
          <CancelOrderBody
            key={order.id}
            order={order}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
