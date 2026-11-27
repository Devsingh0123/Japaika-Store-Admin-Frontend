"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useForm } from "react-hook-form";
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
import { useUpdateOrderTrackingMutation } from "@/hooks/use-orders";
import { ApiError } from "@/lib/api/error";
import { applyApiValidationErrors, zodResolver } from "@/lib/forms/zod";
import {
  createEditTrackingSchema,
  type EditTrackingFormValues,
} from "@/lib/orders/schemas";
import type { OrderDetail } from "@/types/order";

interface EditTrackingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetail;
}

function EditTrackingBody({
  order,
  onClose,
}: {
  order: OrderDetail;
  onClose: () => void;
}) {
  const isShipped = order.status === "shipped";
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useUpdateOrderTrackingMutation();

  const schema = useMemo(
    () => createEditTrackingSchema(isShipped),
    [isShipped]
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditTrackingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      courierName: order.tracking.courierName ?? "",
      awbNumber: order.tracking.awbNumber ?? "",
      trackingUrl: order.tracking.trackingUrl ?? "",
    },
  });

  const isBusy = isSubmitting || mutation.isPending;

  const onSubmit = async (values: EditTrackingFormValues) => {
    setFormError(null);
    try {
      await mutation.mutateAsync({
        id: order.id,
        input: {
          courierName: values.courierName.trim() || null,
          awbNumber: values.awbNumber.trim() || null,
          trackingUrl: values.trackingUrl.trim() || null,
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
      setFormError("Unable to update tracking details. Please try again.");
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
          <DialogTitle>Edit shipment tracking</DialogTitle>
          <DialogDescription>
            Update courier details for{" "}
            <span className="font-mono font-medium">{order.orderNumber}</span>.
            {isShipped
              ? " Courier name and AWB cannot be cleared once shipped."
              : ""}
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
            htmlFor="edit-courier-name"
            label="Courier name"
            required={isShipped}
            error={errors.courierName?.message}
          >
            <Input
              id="edit-courier-name"
              placeholder="e.g. BlueDart, Delhivery, DHL"
              disabled={isBusy}
              aria-invalid={Boolean(errors.courierName)}
              {...register("courierName")}
            />
          </FormField>

          <FormField
            htmlFor="edit-awb-number"
            label="AWB / Tracking number"
            required={isShipped}
            error={errors.awbNumber?.message}
          >
            <Input
              id="edit-awb-number"
              placeholder="e.g. BD123456789IN"
              disabled={isBusy}
              aria-invalid={Boolean(errors.awbNumber)}
              className="font-mono"
              {...register("awbNumber")}
            />
          </FormField>
        </div>

        <FormField
          htmlFor="edit-tracking-url"
          label="Tracking URL"
          error={errors.trackingUrl?.message}
          hint="Optional http:// or https:// tracking link."
        >
          <Input
            id="edit-tracking-url"
            type="url"
            placeholder="https://..."
            disabled={isBusy}
            aria-invalid={Boolean(errors.trackingUrl)}
            {...register("trackingUrl")}
          />
        </FormField>
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
              Saving...
            </>
          ) : (
            "Save tracking"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditTrackingModal({
  open,
  onOpenChange,
  order,
}: EditTrackingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="modal" className="max-w-lg">
        {open ? (
          <EditTrackingBody
            key={`${order.id}-${order.updatedAt ?? "init"}`}
            order={order}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
