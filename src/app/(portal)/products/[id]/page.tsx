"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/common/error-state";
import { ProductEditor } from "@/components/products/editor/product-editor";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductQuery } from "@/hooks/use-products";
import { ApiError } from "@/lib/api/error";

function ProductDetailSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading product details">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = typeof params?.id === "string" ? params.id : "";

  const productQuery = useProductQuery(productId, Boolean(productId));

  if (productQuery.isPending) {
    return <ProductDetailSkeleton />;
  }

  if (productQuery.isError || !productQuery.data) {
    const isNotFound =
      productQuery.error instanceof ApiError &&
      productQuery.error.code === "PRODUCT_NOT_FOUND";

    return (
      <div className="space-y-4">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to products
        </Link>

        <Card>
          <ErrorState
            title={isNotFound ? "Product not found" : "Unable to load product"}
            message={
              productQuery.error instanceof ApiError
                ? productQuery.error.message
                : "This product could not be loaded or may have been deleted."
            }
            onRetry={isNotFound ? undefined : () => productQuery.refetch()}
          />
        </Card>
      </div>
    );
  }

  const product = productQuery.data;

  return (
    <ProductEditor
      key={`${product.id}-${product.updatedAt}`}
      mode="edit"
      product={product}
    />
  );
}
