"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useDeleteCouponMutation } from "@/hooks/use-coupons";
import { ApiError } from "@/lib/api/error";
import type { Coupon } from "@/types/coupon";

interface DeleteCouponDialogProps {
  coupon: Pick<Coupon, "id" | "code"> | null;
  onClose: () => void;
}

export function DeleteCouponDialog({
  coupon,
  onClose,
}: DeleteCouponDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteCouponMutation();

  const handleOpenChange = (open: boolean) => {
    if (!open && !deleteMutation.isPending) {
      setErrorMessage(null);
      onClose();
    }
  };

  const handleConfirmDelete = async () => {
    if (!coupon) {
      return;
    }

    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(coupon.id);
      onClose();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        return;
      }
      setErrorMessage("Unable to delete this coupon right now. Try again.");
    }
  };

  return (
    <ConfirmDialog
      open={coupon !== null}
      onOpenChange={handleOpenChange}
      title={`Delete coupon "${coupon?.code ?? ""}"?`}
      description="This immediately deactivates and soft-deletes the coupon so customers can no longer apply it at checkout. Past order redemption history is preserved."
      confirmLabel="Delete coupon"
      pendingLabel="Deleting..."
      variant="destructive"
      pending={deleteMutation.isPending}
      errorMessage={errorMessage}
      onConfirm={handleConfirmDelete}
    />
  );
}
