"use client";

import {
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Coupon } from "@/types/coupon";

interface CouponActionsMenuProps {
  coupon: Coupon;
  canWrite: boolean;
  onView: (coupon: Coupon) => void;
  onEdit: (coupon: Coupon) => void;
  onToggleStatus: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
}

export function CouponActionsMenu({
  coupon,
  canWrite,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: CouponActionsMenuProps) {
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      toast.success(`Copied "${coupon.code}"`);
    } catch {
      toast.error("Unable to copy coupon code.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${coupon.code}`}
            className="cursor-pointer"
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        }
      />

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyCode}>
          <Copy
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          Copy code
        </DropdownMenuItem>

        {canWrite ? (
          <>
            <DropdownMenuItem onClick={() => onEdit(coupon)}>
              <Pencil
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              Edit coupon
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onToggleStatus(coupon)}>
              <Power
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              {coupon.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(coupon)}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete coupon
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={() => onView(coupon)}>
            <Eye
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            View details
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
