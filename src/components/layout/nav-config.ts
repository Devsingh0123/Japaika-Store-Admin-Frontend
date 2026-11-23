import { FolderTree, LayoutGrid, Package, type LucideIcon } from "lucide-react";
import type { AdminRole } from "@/types/api";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  allowedRoles?: readonly AdminRole[];
}

export interface AdminNavGroup {
  id: string;
  label: string;
  items: readonly AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: readonly AdminNavGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        label: "Overview",
        href: "/",
        icon: LayoutGrid,
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      {
        label: "Categories",
        href: "/categories",
        icon: FolderTree,
      },
      {
        label: "Products",
        href: "/products",
        icon: Package,
      },
    ],
  },
];

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export function getBreadcrumbsForPath(pathname: string): BreadcrumbSegment[] {
  if (pathname === "/" || pathname === "") {
    return [{ label: "Overview" }];
  }

  if (pathname === "/categories" || pathname.startsWith("/categories/")) {
    return [
      { label: "Catalog" },
      { label: "Categories", href: "/categories" },
    ];
  }

  if (pathname === "/products") {
    return [
      { label: "Catalog" },
      { label: "Products", href: "/products" },
    ];
  }

  if (pathname === "/products/new") {
    return [
      { label: "Catalog" },
      { label: "Products", href: "/products" },
      { label: "New product" },
    ];
  }

  if (pathname.startsWith("/products/")) {
    return [
      { label: "Catalog" },
      { label: "Products", href: "/products" },
      { label: "Product details" },
    ];
  }

  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
  }));
}
