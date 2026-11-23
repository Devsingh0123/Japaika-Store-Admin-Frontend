"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PaginationBar } from "@/components/common/pagination-bar";
import { DeleteProductDialog } from "@/components/products/delete-product-dialog";
import { ProductActionsMenu } from "@/components/products/product-actions-menu";
import {
  ProductStatusBadge,
  ProductStockBadge,
  ProductThumbnail,
} from "@/components/products/product-status-badge";
import { QuickStockModal } from "@/components/products/quick-stock-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useCategoryTreeQuery } from "@/hooks/use-categories";
import {
  useProductsQuery,
  useUpdateProductStatusMutation,
} from "@/hooks/use-products";
import { ApiError } from "@/lib/api/error";
import { formatDate, formatPriceRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/types/api";
import type {
  ProductListItem,
  ProductSortBy,
  ProductSortOrder,
  ProductStatus,
  ProductStockStatus,
  ProductType,
} from "@/types/product";

const CATALOG_WRITE_ROLES: readonly AdminRole[] = [
  "super_admin",
  "catalog_manager",
];

const STOCK_UPDATE_ROLES: readonly AdminRole[] = [
  "super_admin",
  "catalog_manager",
  "operations_manager",
];

type SortOptionValue =
  | "createdAt:desc"
  | "updatedAt:desc"
  | "name:asc"
  | "name:desc"
  | "status:asc";

function ProductsSkeleton() {
  return (
    <div className="divide-y divide-border" aria-label="Loading products">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="hidden h-5 w-24 sm:block" />
          <Skeleton className="hidden h-5 w-20 md:block" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ProductsManager() {
  const router = useRouter();
  const { hasRole } = useAuth();
  const canWriteCatalog = hasRole(CATALOG_WRITE_ROLES);
  const canUpdateStock = hasRole(STOCK_UPDATE_ROLES);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ProductStatus>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"" | ProductType>("");
  const [stockFilter, setStockFilter] = useState<"" | ProductStockStatus>("");
  const [featuredFilter, setFeaturedFilter] = useState<"" | "true" | "false">(
    ""
  );
  const [sortOption, setSortOption] =
    useState<SortOptionValue>("createdAt:desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [deletingProduct, setDeletingProduct] =
    useState<ProductListItem | null>(null);
  const [stockModalProduct, setStockModalProduct] =
    useState<ProductListItem | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const [sortBy, sortOrder] = sortOption.split(":") as [
    ProductSortBy,
    ProductSortOrder,
  ];

  const productsQuery = useProductsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    categoryId: categoryFilter || undefined,
    productType: typeFilter || undefined,
    stockStatus: stockFilter || undefined,
    isFeatured:
      featuredFilter === "" ? undefined : featuredFilter === "true",
    sortBy,
    sortOrder,
  });

  const categoriesTreeQuery = useCategoryTreeQuery({}, true);
  const statusMutation = useUpdateProductStatusMutation();

  const items = productsQuery.data?.items ?? [];
  const pagination = productsQuery.data?.pagination ?? {
    page,
    limit,
    totalItems: 0,
    totalPages: 1,
  };

  const hasActiveFilters =
    debouncedSearch !== "" ||
    statusFilter !== "" ||
    categoryFilter !== "" ||
    typeFilter !== "" ||
    stockFilter !== "" ||
    featuredFilter !== "" ||
    sortOption !== "createdAt:desc";

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setTypeFilter("");
    setStockFilter("");
    setFeaturedFilter("");
    setSortOption("createdAt:desc");
    setPage(1);
  };

  const handleOpenDetail = (product: ProductListItem) => {
    router.push(`/products/${product.id}`);
  };

  const handleChangeStatus = (
    product: ProductListItem,
    nextStatus: ProductStatus
  ) => {
    if (!canWriteCatalog) return;
    statusMutation.mutate({ id: product.id, status: nextStatus });
  };

  const roleBadge = !canWriteCatalog ? (
    canUpdateStock ? (
      <Badge variant="outline">
        <Boxes
          className="size-3 text-muted-foreground"
          aria-hidden="true"
        />
        Stock updates only
      </Badge>
    ) : (
      <Badge variant="outline">
        <ShieldCheck
          className="size-3 text-muted-foreground"
          aria-hidden="true"
        />
        Read-only access
      </Badge>
    )
  ) : undefined;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Products"
        count={productsQuery.data?.pagination.totalItems}
        description="Manage simple and variant products, GST-inclusive INR pricing, inventory levels, media, and authenticity certificates."
        badge={roleBadge}
        actions={
          <RoleGate allowedRoles={CATALOG_WRITE_ROLES}>
            <Link
              href="/products/new"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-xs)] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-4" aria-hidden="true" />
              New product
            </Link>
          </RoleGate>
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-3.5">
        <div className="flex flex-col gap-3">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1.5fr)_repeat(3,minmax(135px,1fr))]">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, slug, or SKU..."
                aria-label="Search products"
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

            <Select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "" | ProductStatus);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </Select>

            <Select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {(categoriesTreeQuery.data?.items ?? []).map((root) => (
                <optgroup key={root.id} label={root.name}>
                  <option value={root.id}>{root.name} (All / Direct)</option>
                  {(root.subcategories ?? []).map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      ↳ {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>

            <Select
              aria-label="Filter by stock status"
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value as "" | ProductStockStatus);
                setPage(1);
              }}
            >
              <option value="">All stock levels</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="grid w-full gap-2.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <Select
                aria-label="Filter by product type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as "" | ProductType);
                  setPage(1);
                }}
                className="sm:w-36"
              >
                <option value="">All types</option>
                <option value="simple">Simple</option>
                <option value="variant">Variant</option>
              </Select>

              <Select
                aria-label="Filter by featured"
                value={featuredFilter}
                onChange={(e) => {
                  setFeaturedFilter(
                    e.target.value as "" | "true" | "false"
                  );
                  setPage(1);
                }}
                className="sm:w-40"
              >
                <option value="">All visibility</option>
                <option value="true">Featured only</option>
                <option value="false">Standard only</option>
              </Select>

              <Select
                aria-label="Sort products"
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value as SortOptionValue);
                  setPage(1);
                }}
                className="sm:w-44"
              >
                <option value="createdAt:desc">Newest first</option>
                <option value="updatedAt:desc">Recently updated</option>
                <option value="name:asc">Name A–Z</option>
                <option value="name:desc">Name Z–A</option>
                <option value="status:asc">Status</option>
              </Select>
            </div>

            {hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleResetFilters}
                className="h-9 cursor-pointer px-3"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Reset filters
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Main List Card */}
      <Card className="overflow-hidden">
        {productsQuery.isPending ? (
          <ProductsSkeleton />
        ) : productsQuery.isError ? (
          <ErrorState
            title="Unable to load products"
            message={
              productsQuery.error instanceof ApiError
                ? productsQuery.error.message
                : "An unexpected error occurred while fetching products."
            }
            onRetry={() => productsQuery.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Package className="size-5" aria-hidden="true" />}
            title={
              hasActiveFilters ? "No matching products" : "No products yet"
            }
            description={
              hasActiveFilters
                ? "Try adjusting your search terms, status, category, or stock filters."
                : "Create your first product to start building the Japaika catalog."
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
                  <Link
                    href="/products/new"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-[var(--shadow-xs)] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    New product
                  </Link>
                </RoleGate>
              )
            }
          />
        ) : (
          <>
            {/* Mobile Stacked Cards (< md) */}
            <ul
              className={cn(
                "divide-y divide-border md:hidden",
                productsQuery.isFetching && "opacity-70"
              )}
            >
              {items.map((product) => (
                <li key={product.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <ProductThumbnail
                        imageUrl={product.primaryImage?.imageUrl}
                        name={product.name}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/products/${product.id}`}
                            className="truncate text-sm font-semibold text-foreground transition-colors hover:text-brand"
                          >
                            {product.name}
                          </Link>
                          {product.isFeatured ? (
                            <Star
                              className="size-3.5 shrink-0 fill-brand text-brand"
                              aria-label="Featured product"
                            />
                          ) : null}
                        </div>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          /{product.slug}
                        </p>
                      </div>
                    </div>

                    <ProductActionsMenu
                      product={product}
                      canWriteCatalog={canWriteCatalog}
                      canUpdateStock={canUpdateStock}
                      onOpenDetail={handleOpenDetail}
                      onOpenStock={setStockModalProduct}
                      onChangeStatus={handleChangeStatus}
                      onDelete={setDeletingProduct}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <ProductStatusBadge status={product.status} />
                    <ProductStockBadge
                      totalStock={product.totalStock}
                      hasLowStock={product.hasLowStock}
                    />
                    <Badge variant="outline" className="capitalize">
                      {product.productType === "variant"
                        ? `${product.variantCount} variants`
                        : "Simple"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-2.5 text-xs">
                    <div className="min-w-0 truncate text-muted-foreground">
                      {product.category?.name ?? "Uncategorized"}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatPriceRange(product.minPrice, product.maxPrice)}
                      </span>
                      <span className="ml-1.5 text-muted-foreground tabular-nums">
                        · {product.totalStock} in stock
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop Operational Data Table (md+) */}
            <div
              className={cn(
                "hidden overflow-x-auto transition-opacity md:block",
                productsQuery.isFetching && "opacity-70"
              )}
            >
              <table className="w-full min-w-[820px] border-collapse text-left text-[0.84375rem]">
                <thead>
                  <tr className="border-b border-border bg-muted/45 text-xs font-medium text-muted-foreground">
                    <th scope="col" className="px-5 py-3">
                      Product
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Price (incl. GST)
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Inventory
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Updated
                    </th>
                    <th scope="col" className="px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((product) => (
                    <tr
                      key={product.id}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <ProductThumbnail
                            imageUrl={product.primaryImage?.imageUrl}
                            name={product.name}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/products/${product.id}`}
                                className="truncate font-semibold text-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                              >
                                {product.name}
                              </Link>
                              {product.isFeatured ? (
                                <Badge
                                  variant="brand"
                                  className="px-1.5 py-0 text-[0.65rem]"
                                >
                                  <Star
                                    className="size-2.5 fill-brand text-brand"
                                    aria-hidden="true"
                                  />
                                  Featured
                                </Badge>
                              ) : null}
                            </div>
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              /{product.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        {product.category ? (
                          <span className="font-medium text-foreground">
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Uncategorized
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-start gap-0.5">
                          <Badge variant="outline" className="capitalize">
                            {product.productType}
                          </Badge>
                          <span className="text-[0.7rem] tabular-nums text-muted-foreground">
                            {product.variantCount}{" "}
                            {product.variantCount === 1
                              ? "variant"
                              : "variants"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <p className="font-semibold tabular-nums text-foreground">
                          {formatPriceRange(product.minPrice, product.maxPrice)}
                        </p>
                        <p className="text-[0.7rem] tabular-nums text-muted-foreground">
                          GST {Number(product.gstRate)}%
                          {product.hsnCode ? ` · HSN ${product.hsnCode}` : ""}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <ProductStockBadge
                            totalStock={product.totalStock}
                            hasLowStock={product.hasLowStock}
                          />
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {product.totalStock} units
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <ProductStatusBadge status={product.status} />
                      </td>

                      <td className="px-4 py-3.5 tabular-nums text-xs text-muted-foreground">
                        {formatDate(product.updatedAt)}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <ProductActionsMenu
                          product={product}
                          canWriteCatalog={canWriteCatalog}
                          canUpdateStock={canUpdateStock}
                          onOpenDetail={handleOpenDetail}
                          onOpenStock={setStockModalProduct}
                          onChangeStatus={handleChangeStatus}
                          onDelete={setDeletingProduct}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationBar
              page={pagination.page}
              limit={pagination.limit}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
              itemLabelSingular="product"
              itemLabelPlural="products"
              onPageChange={setPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
            />
          </>
        )}
      </Card>

      <QuickStockModal
        product={stockModalProduct}
        onClose={() => setStockModalProduct(null)}
      />

      <DeleteProductDialog
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
      />
    </div>
  );
}
