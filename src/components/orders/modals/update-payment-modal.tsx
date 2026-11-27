"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useUpdateOrderPaymentStatusMutation } from "@/hooks/use-orders";
import { ApiError } from "@/lib/api/error";
import { formatCurrency } from "@/lib/format";
import { applyApiValidationErrors, zodResolver } from "@/lib/forms/zod";
import {
  createUpdatePaymentSchema,
  getAllowedPaymentTransitions,
  PAYMENT_STATUS_LABELS,
  type UpdatePaymentFormValues,
} from "@/lib/orders/schemas";
import type { OrderDetail } from "@/types/order";

interface UpdatePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetail;
}

function UpdatePaymentBody({
  order,
  onClose,
}: {
  order: OrderDetail;
  onClose: () => void;
}) {
  const allowedStatuses = useMemo(
    () => getAllowedPaymentTransitions(order),
    [order]
  );
  const schema = useMemo(() => createUpdatePaymentSchema(order), [order]);
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useUpdateOrderPaymentStatusMutation();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePaymentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentStatus: allowedStatuses[0] ?? "paid",
      razorpayPaymentId: order.payment.razorpayPaymentId ?? "",
      refundAmount:
        order.payment.refundAmount ?? order.pricing.grandTotalAmount,
    },
  });

  const watchedStatus = useWatch({ control, name: "paymentStatus" });
  const isBusy = isSubmitting || mutation.isPending;

  const needsRazorpayId =
    order.paymentMethod === "razorpay" &&
    (watchedStatus === "paid" ||
      (watchedStatus === "refund_pending" &&
        order.status === "cancelled" &&
        order.paymentStatus !== "paid"));

  const onSubmit = async (values: UpdatePaymentFormValues) => {
    setFormError(null);
    try {
      await mutation.mutateAsync({
        id: order.id,
        input: {
          paymentStatus: values.paymentStatus,
          ...(values.razorpayPaymentId.trim()
            ? { razorpayPaymentId: values.razorpayPaymentId.trim() }
            : {}),
          ...(values.paymentStatus === "refund_pending" &&
          values.refundAmount.trim()
            ? { refundAmount: values.refundAmount.trim() }
            : {}),
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
      setFormError("Unable to update payment status right now.");
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
          <DialogTitle>Update payment status</DialogTitle>
          <DialogDescription>
            Adjust payment reconciliation status for{" "}
            <span className="font-mono font-medium">{order.orderNumber}</span>.
            To execute or record a completed refund, use the Refund action.
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

        <FormField
          htmlFor="update-payment-status"
          label="New payment status"
          required
          error={errors.paymentStatus?.message}
          hint={
            watchedStatus === "paid" && order.status === "pending_payment"
              ? "Marking this order Paid will automatically confirm the order."
              : undefined
          }
        >
          <Controller
            control={control}
            name="paymentStatus"
            render={({ field }) => (
              <Select
                id="update-payment-status"
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                disabled={isBusy}
              >
                {allowedStatuses.map((status) => (
                  <option key={status} value={status}>
                    {PAYMENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            )}
          />
        </FormField>

        {order.paymentMethod === "razorpay" ? (
          <FormField
            htmlFor="update-razorpay-payment-id"
            label="Razorpay payment ID"
            required={needsRazorpayId}
            error={errors.razorpayPaymentId?.message}
            hint="Format: pay_... (required when marking a Razorpay order paid)."
          >
            <Input
              id="update-razorpay-payment-id"
              placeholder="pay_Q9x7abc123"
              disabled={isBusy}
              aria-invalid={Boolean(errors.razorpayPaymentId)}
              className="font-mono"
              {...register("razorpayPaymentId")}
            />
          </FormField>
        ) : null}

        {watchedStatus === "refund_pending" ? (
          <FormField
            htmlFor="update-refund-amount"
            label={`Pending refund amount (${order.currency})`}
            error={errors.refundAmount?.message}
            hint={`Max ${formatCurrency(order.pricing.grandTotalAmount, order.currency)}. Defaults to full order total.`}
          >
            <Input
              id="update-refund-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              max={order.pricing.grandTotalAmount}
              disabled={isBusy}
              aria-invalid={Boolean(errors.refundAmount)}
              className="tabular-nums"
              {...register("refundAmount")}
            />
          </FormField>
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
        <Button type="submit" disabled={isBusy || allowedStatuses.length === 0}>
          {isBusy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            "Update payment"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function UpdatePaymentModal({
  open,
  onOpenChange,
  order,
}: UpdatePaymentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="modal" className="max-w-lg">
        {open ? (
          <UpdatePaymentBody
            key={`${order.id}-${order.paymentStatus}-${order.updatedAt ?? "init"}`}
            order={order}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
