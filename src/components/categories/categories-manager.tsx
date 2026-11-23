"use client";

import { useEffect, useState } from "react";
import {
  CornerDownRight,
  FolderTree,
  List,
  Network,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import { CategoryActionsMenu } from "@/components/categories/category-actions-menu";
import { CategoryFormModal } from "@/components/categories/category-form-modal";
import { CategoryThumbnail } from "@/components/categories/category-thumbnail";
import { CategoryTreeView } from "@/components/categories/category-tree-view";
import { DeleteCategoryDialog } from "@/components/categories/delete-category-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PaginationBar } from "@/components/common/pagination-bar";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  useCategoriesQuery,
  useCategoryTreeQuery,
  useRootCategoriesQuery,
  useUpdateCategoryMutation,
} from "@/hooks/use-categories";
import { ApiError } from "@/lib/api/error";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/types/api";
import type { Category } from "@/types/category";

const CATALOG_WRITE_ROLES: readonly AdminRole[] = [
  "super_admin",
  "catalog_manager",
];

type ViewMode = "table" | "tree";

function CategoriesSkeleton() {
  return (
    <div className="divide-y divide-border" aria-label="Loading categories">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="hidden h-5 w-24 sm:block" />
          <Skeleton className="hidden h-5 w-16 md:block" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CategoriesManager() {
  const { hasRole } = useAuth();
  const canWrite = hasRole(CATALOG_WRITE_ROLES);

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [parentFilter, setParentFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const parsedIsActive =
    statusFilter === "" ? undefined : statusFilter === "true";

  const tableQuery = useCategoriesQuery(
    {
      page,
      limit,
      search: debouncedSearch || undefined,
      parentId: parentFilter || undefined,
      isActive: parsedIsActive,
    },
    viewMode === "table"
  );

  const treeQuery = useCategoryTreeQuery(
    {
      search: debouncedSearch || undefined,
      isActive: parsedIsActive,
    },
    viewMode === "tree"
  );

  const rootCategoriesQuery = useRootCategoriesQuery(true);
  const updateMutation = useUpdateCategoryMutation();

  const activeQuery = viewMode === "table" ? tableQuery : treeQuery;
  const items = activeQuery.data?.items ?? [];
  const pagination = tableQuery.data?.pagination ?? {
    page,
    limit,
    totalItems: 0,
    totalPages: 1,
  };

  const hasActiveFilters =
    debouncedSearch !== "" ||
    (viewMode === "table" && parentFilter !== "") ||
    statusFilter !== "";

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setParentFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setDefaultParentId(null);
    setModalOpen(true);
  };

  const handleOpenAddSubcategory = (parentId: string) => {
    setEditingCategory(null);
    setDefaultParentId(parentId);
    setModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setDefaultParentId(null);
    setModalOpen(true);
  };

  const handleToggleStatus = async (category: Category) => {
    if (!canWrite) return;

    setTogglingId(category.id);
    try {
      await updateMutation.mutateAsync({
        id: category.id,
        input: { isActive: !category.isActive },
      });
    } finally {
      setTogglingId(null);
    }
  };

  const totalCountBadge =
    viewMode === "table"
      ? tableQuery.data?.pagination.totalItems
      : treeQuery.data?.items.length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Categories"
        count={totalCountBadge}
        description="Organize top-level categories and subcategories, manage display order, visibility, and storefront imagery."
        badge={
          !canWrite ? (
            <Badge variant="outline">
              <ShieldCheck
                className="size-3 text-muted-foreground"
                aria-hidden="true"
              />
              Read-only access
            </Badge>
          ) : undefined
        }
        actions={
          <RoleGate allowedRoles={CATALOG_WRITE_ROLES}>
            <Button
              type="button"
              size="default"
              onClick={handleOpenCreate}
              className="h-9 cursor-pointer px-3.5 shadow-[var(--shadow-xs)]"
            >
              <Plus className="size-4" aria-hidden="true" />
              New category
            </Button>
          </RoleGate>
        }
      />

      <Card className="p-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_210px_150px_auto]">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, slug, or description..."
                aria-label="Search categories"
                className="pr-9 pl-9"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setDebouncedSearch("");
                    setPage(1);
                  }}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-0 inline-flex w-9 cursor-pointer items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {viewMode === "table" ? (
              <Select
                aria-label="Filter by hierarchy level"
                value={parentFilter}
                onChange={(e) => {
                  setParentFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All levels</option>
                <option value="root">Top-level only</option>
                {(rootCategoriesQuery.data?.items ?? []).length > 0 ? (
                  <optgroup label="Subcategories of">
                    {(rootCategoriesQuery.data?.items ?? []).map((root) => (
                      <option key={root.id} value={root.id}>
                        {root.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </Select>
            ) : null}

            <Select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "" | "true" | "false");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>

            {hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleResetFilters}
                className="h-9 cursor-pointer px-3"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Reset
              </Button>
            ) : null}
          </div>

          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as ViewMode)}
            className="shrink-0 self-start lg:self-auto"
          >
            <TabsList aria-label="Category view mode">
              <TabsTrigger value="table">
                <List className="size-3.5" aria-hidden="true" />
                Table
              </TabsTrigger>
              <TabsTrigger value="tree">
                <Network className="size-3.5" aria-hidden="true" />
                Tree
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {activeQuery.isPending ? (
          <CategoriesSkeleton />
        ) : activeQuery.isError ? (
          <ErrorState
            title="Unable to load categories"
            message={
              activeQuery.error instanceof ApiError
                ? activeQuery.error.message
                : "An unexpected error occurred while fetching categories."
            }
            onRetry={() => activeQuery.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FolderTree className="size-5" aria-hidden="true" />}
            title={
              hasActiveFilters ? "No matching categories" : "No categories yet"
            }
            description={
              hasActiveFilters
                ? "Adjust your search terms or filters to find the category you are looking for."
                : "Create your first top-level category to begin organizing the Japaika catalog."
            }
            action={
              hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="cursor-pointer"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Reset filters
                </Button>
              ) : (
                <RoleGate allowedRoles={CATALOG_WRITE_ROLES}>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleOpenCreate}
                    className="cursor-pointer"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    New category
                  </Button>
                </RoleGate>
              )
            }
          />
        ) : viewMode === "tree" ? (
          <div
            className={cn(
              "transition-opacity",
              treeQuery.isFetching && "opacity-70"
            )}
          >
            <CategoryTreeView
              items={items}
              canWrite={canWrite}
              togglingId={togglingId}
              onEdit={handleOpenEdit}
              onDelete={setDeletingCategory}
              onAddSubcategory={handleOpenAddSubcategory}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        ) : (
          <>
            {/* Mobile Stacked Cards (< md) */}
            <ul
              className={cn(
                "divide-y divide-border md:hidden",
                tableQuery.isFetching && "opacity-70"
              )}
            >
              {items.map((category) => {
                const isRowToggling = togglingId === category.id;
                const isSubcategory = Boolean(category.parentId);

                return (
                  <li key={category.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <CategoryThumbnail
                          imageUrl={category.imageUrl}
                          name={category.name}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {category.name}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            /{category.slug}
                          </p>
                        </div>
                      </div>

                      {canWrite ? (
                        <CategoryActionsMenu
                          category={category}
                          onEdit={handleOpenEdit}
                          onAddSubcategory={handleOpenAddSubcategory}
                          onToggleStatus={handleToggleStatus}
                          onDelete={setDeletingCategory}
                        />
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {isSubcategory ? (
                          <Badge variant="secondary">
                            <CornerDownRight
                              className="size-3 text-muted-foreground"
                              aria-hidden="true"
                            />
                            {category.parent?.name ?? "Subcategory"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Top-level</Badge>
                        )}
                        <span className="font-mono tabular-nums text-muted-foreground">
                          Sort {category.sortOrder}
                        </span>
                      </div>

                      {canWrite ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={category.isActive}
                            disabled={isRowToggling}
                            onCheckedChange={() => handleToggleStatus(category)}
                            aria-label={`Set ${category.name} as ${
                              category.isActive ? "inactive" : "active"
                            }`}
                          />
                          <span className="font-medium text-muted-foreground">
                            {category.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      ) : (
                        <StatusBadge
                          label={category.isActive ? "Active" : "Inactive"}
                          tone={category.isActive ? "success" : "muted"}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop Operational Data Table (md+) */}
            <div
              className={cn(
                "hidden overflow-x-auto transition-opacity md:block",
                tableQuery.isFetching && "opacity-70"
              )}
            >
              <table className="w-full min-w-[700px] border-collapse text-left text-[0.84375rem]">
                <thead>
                  <tr className="border-b border-border bg-muted/45 text-xs font-medium text-muted-foreground">
                    <th scope="col" className="px-5 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Hierarchy
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Sort
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Updated
                    </th>
                    {canWrite ? (
                      <th scope="col" className="px-5 py-3 text-right">
                        Actions
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((category) => {
                    const isRowToggling = togglingId === category.id;
                    const isSubcategory = Boolean(category.parentId);

                    return (
                      <tr
                        key={category.id}
                        className="group transition-colors hover:bg-muted/30"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <CategoryThumbnail
                              imageUrl={category.imageUrl}
                              name={category.name}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">
                                {category.name}
                              </p>
                              <p className="truncate font-mono text-xs text-muted-foreground">
                                /{category.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {isSubcategory ? (
                            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CornerDownRight
                                className="size-3.5 shrink-0 text-muted-foreground/75"
                                aria-hidden="true"
                              />
                              <span className="font-medium text-foreground">
                                {category.parent?.name ?? "Subcategory"}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline">Top-level</Badge>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-xs text-muted-foreground">
                          {category.sortOrder}
                        </td>

                        <td className="px-4 py-3.5">
                          {canWrite ? (
                            <div className="inline-flex items-center gap-2.5">
                              <Switch
                                checked={category.isActive}
                                disabled={isRowToggling}
                                onCheckedChange={() =>
                                  handleToggleStatus(category)
                                }
                                aria-label={`Set ${category.name} as ${
                                  category.isActive ? "inactive" : "active"
                                }`}
                              />
                              <span
                                className={cn(
                                  "text-xs font-medium",
                                  category.isActive
                                    ? "text-success"
                                    : "text-muted-foreground"
                                )}
                              >
                                {category.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          ) : (
                            <StatusBadge
                              label={category.isActive ? "Active" : "Inactive"}
                              tone={category.isActive ? "success" : "muted"}
                            />
                          )}
                        </td>

                        <td className="px-4 py-3.5 tabular-nums text-xs text-muted-foreground">
                          {formatDate(category.updatedAt)}
                        </td>

                        {canWrite ? (
                          <td className="px-5 py-3.5 text-right">
                            <CategoryActionsMenu
                              category={category}
                              onEdit={handleOpenEdit}
                              onAddSubcategory={handleOpenAddSubcategory}
                              onToggleStatus={handleToggleStatus}
                              onDelete={setDeletingCategory}
                            />
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationBar
              page={pagination.page}
              limit={pagination.limit}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
              itemLabelSingular="category"
              itemLabelPlural="categories"
              onPageChange={setPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
            />
          </>
        )}
      </Card>

      <CategoryFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        category={editingCategory}
        defaultParentId={defaultParentId}
      />

      <DeleteCategoryDialog
        category={deletingCategory}
        onClose={() => setDeletingCategory(null)}
      />
    </div>
  );
}
