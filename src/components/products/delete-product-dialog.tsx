"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useDeleteProductMutation } from "@/hooks/use-products";
import { ApiError } from "@/lib/api/error";
import type { ProductListItem } from "@/types/product";

interface DeleteProductDialogProps {
  product: Pick<ProductListItem, "id" | "name"> | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteProductDialog({
  product,
  onClose,
  onDeleted,
}: DeleteProductDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteProductMutation();

  const handleOpenChange = (open: boolean) => {
    if (!open && !deleteMutation.isPending) {
      setErrorMessage(null);
      onClose();
    }
  };

  const handleConfirmDelete = async () => {
    if (!product) {
      return;
    }

    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(product.id);
      onClose();
      onDeleted?.();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        return;
      }
      setErrorMessage("Unable to delete this product right now. Try again.");
    }
  };

  return (
    <ConfirmDialog
      open={product !== null}
      onOpenChange={handleOpenChange}
      title={`Delete "${product?.name ?? ""}"?`}
      description="This soft-deletes the product and all of its variants, and permanently removes its uploaded product media and authenticity certificate from storage."
      confirmLabel="Delete product"
      pendingLabel="Deleting..."
      variant="destructive"
      pending={deleteMutation.isPending}
      errorMessage={errorMessage}
      onConfirm={handleConfirmDelete}
    />
  );
}
