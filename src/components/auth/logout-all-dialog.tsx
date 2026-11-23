"use client";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useLogoutAllMutation } from "@/hooks/use-auth";

interface LogoutAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutAllDialog({ open, onOpenChange }: LogoutAllDialogProps) {
  const logoutAllMutation = useLogoutAllMutation();

  const handleConfirm = () => {
    logoutAllMutation.mutate(undefined, {
      onSettled: () => onOpenChange(false),
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign out from all devices?"
      description="This immediately revokes every active administrator session across all browsers and devices. You will need to sign in again."
      confirmLabel="Sign out all devices"
      pendingLabel="Signing out..."
      variant="destructive"
      pending={logoutAllMutation.isPending}
      onConfirm={handleConfirm}
    />
  );
}
