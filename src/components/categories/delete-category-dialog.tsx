"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useDeleteCategoryMutation } from "@/hooks/use-categories";
import { ApiError } from "@/lib/api/error";
import type { Category } from "@/types/category";

interface DeleteCategoryDialogProps {
  category: Category | null;
  onClose: () => void;
}

export function DeleteCategoryDialog({
  category,
  onClose,
}: DeleteCategoryDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteCategoryMutation();

  const handleOpenChange = (open: boolean) => {
    if (!open && !deleteMutation.isPending) {
      setErrorMessage(null);
      onClose();
    }
  };

  const handleConfirmDelete = async () => {
    if (!category) {
      return;
    }

    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(category.id);
      onClose();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.code === "CATEGORY_HAS_SUBCATEGORIES") {
          setErrorMessage(
            "This category still has active subcategories. Reassign or delete its subcategories before deleting this parent category."
          );
          return;
        }
        if (error.code === "CATEGORY_HAS_PRODUCTS") {
          setErrorMessage(
            "This category still has products assigned to it. Reassign or remove those products before deleting this category."
          );
          return;
        }
        setErrorMessage(error.message);
        return;
      }
      setErrorMessage("Unable to delete this category. Try again.");
    }
  };

  return (
    <ConfirmDialog
      open={category !== null}
      onOpenChange={handleOpenChange}
      title={`Delete "${category?.name ?? ""}"?`}
      description="This soft-deletes the category from active administration and removes its uploaded category image. Top-level categories with existing subcategories cannot be deleted."
      confirmLabel="Delete category"
      pendingLabel="Deleting..."
      variant="destructive"
      pending={deleteMutation.isPending}
      errorMessage={errorMessage}
      onConfirm={handleConfirmDelete}
    />
  );
}
