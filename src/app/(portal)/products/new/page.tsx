"use client";

import { AccessDenied } from "@/components/auth/access-denied";
import { ProductEditor } from "@/components/products/editor/product-editor";
import { useAuth } from "@/hooks/use-auth";
import type { AdminRole } from "@/types/api";

const CATALOG_WRITE_ROLES: readonly AdminRole[] = [
  "super_admin",
  "catalog_manager",
];

export default function NewProductPage() {
  const { hasRole } = useAuth();

  if (!hasRole(CATALOG_WRITE_ROLES)) {
    return (
      <AccessDenied
        title="Product creation restricted"
        description="Only Super Admins and Catalog Managers can create new products in the Japaika catalog."
      />
    );
  }

  return <ProductEditor mode="create" />;
}
