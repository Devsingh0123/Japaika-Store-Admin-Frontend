"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Banner } from "@/types/banner";

interface BannerActionsMenuProps {
  banner: Banner;
  canWrite: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onPreview: (banner: Banner) => void;
  onEdit: (banner: Banner) => void;
  onMoveUp: (banner: Banner) => void;
  onMoveDown: (banner: Banner) => void;
  onToggleStatus: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
}

export function BannerActionsMenu({
  banner,
  canWrite,
  canMoveUp,
  canMoveDown,
  onPreview,
  onEdit,
  onMoveUp,
  onMoveDown,
  onToggleStatus,
  onDelete,
}: BannerActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${banner.title}`}
            className="cursor-pointer"
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        }
      />

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onPreview(banner)}>
          <Eye
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          Preview banner
        </DropdownMenuItem>

        {canWrite ? (
          <>
            <DropdownMenuItem onClick={() => onEdit(banner)}>
              <Pencil
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              Edit banner
            </DropdownMenuItem>

            {canMoveUp ? (
              <DropdownMenuItem onClick={() => onMoveUp(banner)}>
                <ArrowUp
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                Move earlier
              </DropdownMenuItem>
            ) : null}

            {canMoveDown ? (
              <DropdownMenuItem onClick={() => onMoveDown(banner)}>
                <ArrowDown
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                Move later
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuItem onClick={() => onToggleStatus(banner)}>
              <Power
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              {banner.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(banner)}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete banner
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
