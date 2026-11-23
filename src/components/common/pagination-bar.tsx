import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationBarProps {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  itemLabelSingular?: string;
  itemLabelPlural?: string;
  pageSizeOptions?: readonly number[];
  onPageChange: (nextPage: number) => void;
  onLimitChange?: (nextLimit: number) => void;
}

export function PaginationBar({
  page,
  limit,
  totalItems,
  totalPages,
  itemLabelSingular = "item",
  itemLabelPlural = "items",
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onLimitChange,
}: PaginationBarProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-5 py-3 text-xs text-muted-foreground">
      <p className="tabular-nums">
        Showing{" "}
        <span className="font-medium text-foreground">
          {startItem}–{endItem}
        </span>{" "}
        of{" "}
        <span className="font-medium text-foreground">{totalItems}</span>{" "}
        {totalItems === 1 ? itemLabelSingular : itemLabelPlural}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {onLimitChange ? (
          <div className="flex items-center gap-2">
            <label
              htmlFor="pagination-page-size"
              className="text-xs text-muted-foreground"
            >
              Rows
            </label>
            <select
              id="pagination-page-size"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-8 cursor-pointer rounded-md border border-input bg-card px-2 text-xs text-foreground outline-none transition-colors hover:border-border-strong focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="cursor-pointer"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Previous
          </Button>
          <span className="px-2 tabular-nums text-xs font-medium text-foreground">
            Page {page} of {safeTotalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= safeTotalPages}
            onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
            className="cursor-pointer"
          >
            Next
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
