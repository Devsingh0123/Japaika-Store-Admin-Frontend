"use client";

import {
  Archive,
  Boxes,
  CheckCircle2,
  Eye,
  FileEdit,
  MoreHorizontal,
  Pencil,
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
import type { ProductListItem, ProductStatus } from "@/types/product";

interface ProductActionsMenuProps {
  product: ProductListItem;
  canWriteCatalog: boolean;
  canUpdateStock: boolean;
  onOpenDetail: (product: ProductListItem) => void;
  onOpenStock: (product: ProductListItem) => void;
  onChangeStatus: (product: ProductListItem, status: ProductStatus) => void;
  onDelete: (product: ProductListItem) => void;
}

export function ProductActionsMenu({
  product,
  canWriteCatalog,
  canUpdateStock,
  onOpenDetail,
  onOpenStock,
  onChangeStatus,
  onDelete,
}: ProductActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${product.name}`}
            className="cursor-pointer"
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        }
      />

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onOpenDetail(product)}>
          {canWriteCatalog ? (
            <Pencil
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
          ) : (
            <Eye
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
          )}
          {canWriteCatalog ? "Edit product" : "View details"}
        </DropdownMenuItem>

        {canUpdateStock ? (
          <DropdownMenuItem onClick={() => onOpenStock(product)}>
            <Boxes
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            Update stock
          </DropdownMenuItem>
        ) : null}

        {canWriteCatalog ? (
          <>
            <DropdownMenuSeparator />

            {product.status !== "active" ? (
              <DropdownMenuItem
                onClick={() => onChangeStatus(product, "active")}
              >
                <CheckCircle2
                  className="size-3.5 text-success"
                  aria-hidden="true"
                />
                Publish product
              </DropdownMenuItem>
            ) : null}

            {product.status !== "draft" ? (
              <DropdownMenuItem
                onClick={() => onChangeStatus(product, "draft")}
              >
                <FileEdit
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                Move to draft
              </DropdownMenuItem>
            ) : null}

            {product.status !== "archived" ? (
              <DropdownMenuItem
                onClick={() => onChangeStatus(product, "archived")}
              >
                <Archive
                  className="size-3.5 text-warning"
                  aria-hidden="true"
                />
                Archive product
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(product)}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete product
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
