"use client";

import { CornerDownRight, FolderPlus } from "lucide-react";
import { CategoryActionsMenu } from "@/components/categories/category-actions-menu";
import { CategoryThumbnail } from "@/components/categories/category-thumbnail";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Category } from "@/types/category";

interface CategoryTreeViewProps {
  items: Category[];
  canWrite: boolean;
  togglingId: string | null;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddSubcategory: (parentId: string) => void;
  onToggleStatus: (category: Category) => void;
}

export function CategoryTreeView({
  items,
  canWrite,
  togglingId,
  onEdit,
  onDelete,
  onAddSubcategory,
  onToggleStatus,
}: CategoryTreeViewProps) {
  return (
    <div className="divide-y divide-border">
      {items.map((root) => {
        const subcategories = root.subcategories ?? [];
        const isRootToggling = togglingId === root.id;

        return (
          <div key={root.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <CategoryThumbnail
                  imageUrl={root.imageUrl}
                  name={root.name}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {root.name}
                    </p>
                    <Badge variant="outline" className="text-[0.6875rem]">
                      Top-level
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="font-mono tabular-nums text-[0.6875rem]"
                    >
                      {subcategories.length}{" "}
                      {subcategories.length === 1
                        ? "subcategory"
                        : "subcategories"}
                    </Badge>
                  </div>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    /{root.slug}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {canWrite ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={root.isActive}
                      disabled={isRootToggling}
                      onCheckedChange={() => onToggleStatus(root)}
                      aria-label={`Set ${root.name} as ${
                        root.isActive ? "inactive" : "active"
                      }`}
                    />
                    <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                      {root.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                ) : (
                  <StatusBadge
                    label={root.isActive ? "Active" : "Inactive"}
                    tone={root.isActive ? "success" : "muted"}
                  />
                )}

                {canWrite ? (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onAddSubcategory(root.id)}
                      className="hidden cursor-pointer sm:inline-flex"
                    >
                      <FolderPlus className="size-3.5" aria-hidden="true" />
                      Add subcategory
                    </Button>

                    <CategoryActionsMenu
                      category={root}
                      onEdit={onEdit}
                      onAddSubcategory={onAddSubcategory}
                      onToggleStatus={onToggleStatus}
                      onDelete={onDelete}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {subcategories.length > 0 ? (
              <ul className="mt-3 ml-5 space-y-2 border-l border-border pl-4 sm:ml-6 sm:pl-5">
                {subcategories.map((sub) => {
                  const isSubToggling = togglingId === sub.id;

                  return (
                    <li
                      key={sub.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-background/55 px-3.5 py-2.5 transition-colors hover:bg-background"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <CornerDownRight
                          className="size-3.5 shrink-0 text-muted-foreground/70"
                          aria-hidden="true"
                        />
                        <CategoryThumbnail
                          imageUrl={sub.imageUrl}
                          name={sub.name}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {sub.name}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            /{sub.slug}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="hidden font-mono tabular-nums text-xs text-muted-foreground md:inline">
                          Sort {sub.sortOrder}
                        </span>

                        {canWrite ? (
                          <Switch
                            checked={sub.isActive}
                            disabled={isSubToggling}
                            onCheckedChange={() => onToggleStatus(sub)}
                            aria-label={`Set ${sub.name} as ${
                              sub.isActive ? "inactive" : "active"
                            }`}
                          />
                        ) : (
                          <StatusBadge
                            label={sub.isActive ? "Active" : "Inactive"}
                            tone={sub.isActive ? "success" : "muted"}
                          />
                        )}

                        {canWrite ? (
                          <CategoryActionsMenu
                            category={sub}
                            onEdit={onEdit}
                            onToggleStatus={onToggleStatus}
                            onDelete={onDelete}
                          />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-2.5 ml-5 flex items-center gap-2 border-l border-border pl-4 text-xs text-muted-foreground sm:ml-6 sm:pl-5">
                <span>No subcategories yet.</span>
                {canWrite ? (
                  <button
                    type="button"
                    onClick={() => onAddSubcategory(root.id)}
                    className="cursor-pointer font-medium text-foreground underline-offset-4 hover:text-brand hover:underline"
                  >
                    Add one
                  </button>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
