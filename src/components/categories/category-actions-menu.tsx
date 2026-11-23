"use client";

import {
  FolderPlus,
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
import type { Category } from "@/types/category";

interface CategoryActionsMenuProps {
  category: Category;
  onEdit: (category: Category) => void;
  onAddSubcategory?: (parentId: string) => void;
  onToggleStatus: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryActionsMenu({
  category,
  onEdit,
  onAddSubcategory,
  onToggleStatus,
  onDelete,
}: CategoryActionsMenuProps) {
  const isSubcategory = Boolean(category.parentId);
  const entityLabel = isSubcategory ? "subcategory" : "category";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${category.name}`}
            className="cursor-pointer"
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        }
      />

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(category)}>
          <Pencil
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          Edit {entityLabel}
        </DropdownMenuItem>

        {!isSubcategory && onAddSubcategory ? (
          <DropdownMenuItem onClick={() => onAddSubcategory(category.id)}>
            <FolderPlus
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            Add subcategory
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem onClick={() => onToggleStatus(category)}>
          <Power
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          {category.isActive ? "Deactivate" : "Activate"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(category)}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Delete {entityLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
