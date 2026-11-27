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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useRefundOrderMutation } from "@/hooks/use-orders";
import { ApiError } from "@/lib/api/error";
import { formatCurrency } from "@/lib/format";
import { applyApiValidationErrors, zodResolver } from "@/lib/forms/zod";
import {
  createRefundOrderSchema,
  type RefundOrderFormValues,
} from "@/lib/orders/schemas";
import type { OrderDetail } from "@/types/order";

interface RefundOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetail;
}

function RefundOrderBody({
  order,
  onClose,
}: {
  order: OrderDetail;
  onClose: () => void;
}) {
  const canUseRazorpay =
    order.paymentMethod === "razorpay" && Boolean(order.payment.razorpayPaymentId);
  const schema = useMemo(() => createRefundOrderSchema(order), [order]);
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useRefundOrderMutation();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RefundOrderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mode: canUseRazorpay ? "razorpay" : "manual",
      amount: order.payment.refundAmount ?? order.pricing.grandTotalAmount,
      speed: "normal",
      razorpayRefundId: "",
      notes: "",
      restoreStock: false,
    },
  });

  const watchedMode = useWatch({ control, name: "mode" });
  const watchedNotes = useWatch({ control, name: "notes" }) ?? "";
  const isBusy = isSubmitting || mutation.isPending;

  const onSubmit = async (values: RefundOrderFormValues) => {
    setFormError(null);
    try {
      await mutation.mutateAsync({
        id: order.id,
        input: {
          mode: values.mode,
          amount: values.amount.trim() || null,
          ...(values.mode === "razorpay" ? { speed: values.speed } : {}),
          ...(values.mode === "manual" && values.razorpayRefundId.trim()
            ? { razorpayRefundId: values.razorpayRefundId.trim() }
            : {}),
          notes: values.notes.trim() || null,
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
      setFormError("Unable to process refund right now. Please try again.");
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
          <DialogTitle>Issue refund for {order.orderNumber}</DialogTitle>
          <DialogDescription>
            Order total:{" "}
            <strong className="tabular-nums text-foreground">
              {formatCurrency(order.pricing.grandTotalAmount, order.currency)}
            </strong>{" "}
            ({order.paymentMethod === "razorpay" ? "Razorpay" : "COD"}).
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            htmlFor="refund-mode"
            label="Refund mode"
            required
            hint={
              watchedMode === "razorpay"
                ? "Triggers an automated refund via Razorpay API."
                : "Records an offline / bank / manual refund."
            }
          >
            <Controller
              control={control}
              name="mode"
              render={({ field }) => (
                <Select
                  id="refund-mode"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={isBusy}
                >
                  {canUseRazorpay ? (
                    <option value="razorpay">Razorpay (Automated)</option>
                  ) : null}
                  <option value="manual">Manual refund record</option>
                </Select>
              )}
            />
          </FormField>

          <FormField
            htmlFor="refund-amount"
            label={`Refund amount (${order.currency})`}
            required
            error={errors.amount?.message}
            hint={`Up to ${formatCurrency(order.pricing.grandTotalAmount, order.currency)}.`}
          >
            <Input
              id="refund-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              max={order.pricing.grandTotalAmount}
              disabled={isBusy}
              aria-invalid={Boolean(errors.amount)}
              className="tabular-nums"
              {...register("amount")}
            />
          </FormField>
        </div>

        {watchedMode === "razorpay" ? (
          <FormField
            htmlFor="refund-speed"
            label="Razorpay refund speed"
            hint="Normal (5–7 business days) or Optimum (instant where supported)."
          >
            <Controller
              control={control}
              name="speed"
              render={({ field }) => (
                <Select
                  id="refund-speed"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={isBusy}
                >
                  <option value="normal">Normal</option>
                  <option value="optimum">Optimum (Instant)</option>
                </Select>
              )}
            />
          </FormField>
        ) : (
          <FormField
            htmlFor="refund-manual-id"
            label="Razorpay refund ID (optional)"
            error={errors.razorpayRefundId?.message}
            hint="Optional reference if refunded directly in Razorpay dashboard (rfnd_...)."
          >
            <Input
              id="refund-manual-id"
              placeholder="rfnd_..."
              disabled={isBusy}
              aria-invalid={Boolean(errors.razorpayRefundId)}
              className="font-mono"
              {...register("razorpayRefundId")}
            />
          </FormField>
        )}

        <FormField
          htmlFor="refund-notes"
          label="Refund notes"
          error={errors.notes?.message}
          hint={`${watchedNotes.length}/255 characters. Optional audit note.`}
        >
          <Textarea
            id="refund-notes"
            rows={2}
            maxLength={255}
            placeholder="e.g. Approved return refund after quality inspection"
            disabled={isBusy}
            aria-invalid={Boolean(errors.notes)}
            {...register("notes")}
          />
        </FormField>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
          <div className="space-y-0.5">
            <Label
              htmlFor="refund-restore-stock"
              className="text-sm font-medium text-foreground"
            >
              Restore inventory &amp; coupon usage
            </Label>
            <p className="text-xs text-muted-foreground">
              {order.stockRestored
                ? "Inventory has already been restored for this order."
                : "Enable only if returned items are back in sellable stock."}
            </p>
          </div>
          <Controller
            control={control}
            name="restoreStock"
            render={({ field }) => (
              <Switch
                id="refund-restore-stock"
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
          Cancel
        </Button>
        <Button type="submit" disabled={isBusy}>
          {isBusy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Processing...
            </>
          ) : watchedMode === "razorpay" ? (
            "Process Razorpay refund"
          ) : (
            "Record manual refund"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RefundOrderModal({
  open,
  onOpenChange,
  order,
}: RefundOrderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="modal" className="max-w-lg">
        {open ? (
          <RefundOrderBody
            key={`${order.id}-${order.updatedAt ?? "init"}`}
            order={order}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
