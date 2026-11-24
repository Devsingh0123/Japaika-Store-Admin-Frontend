"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useDeleteBannerMutation } from "@/hooks/use-banners";
import { ApiError } from "@/lib/api/error";
import type { Banner } from "@/types/banner";

interface DeleteBannerDialogProps {
  banner: Pick<Banner, "id" | "title"> | null;
  onClose: () => void;
}

export function DeleteBannerDialog({
  banner,
  onClose,
}: DeleteBannerDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteBannerMutation();

  const handleOpenChange = (open: boolean) => {
    if (!open && !deleteMutation.isPending) {
      setErrorMessage(null);
      onClose();
    }
  };

  const handleConfirmDelete = async () => {
    if (!banner) {
      return;
    }

    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(banner.id);
      onClose();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        return;
      }
      setErrorMessage("Unable to delete this banner right now. Try again.");
    }
  };

  return (
    <ConfirmDialog
      open={banner !== null}
      onOpenChange={handleOpenChange}
      title={`Delete "${banner?.title ?? ""}"?`}
      description="This soft-deletes the banner from storefront rotation and permanently removes both its desktop and mobile artwork from storage."
      confirmLabel="Delete banner"
      pendingLabel="Deleting..."
      variant="destructive"
      pending={deleteMutation.isPending}
      errorMessage={errorMessage}
      onConfirm={handleConfirmDelete}
    />
  );
}
