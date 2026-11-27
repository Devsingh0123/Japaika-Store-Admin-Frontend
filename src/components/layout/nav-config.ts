import {
  FolderTree,
  GalleryHorizontalEnd,
  LayoutGrid,
  Package,
  ShoppingBag,
  TicketPercent,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { MODULE_ROLE_ACCESS } from "@/lib/auth/rbac";
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
      {
        label: "Banners",
        href: "/banners",
        icon: GalleryHorizontalEnd,
      },
      {
        label: "Coupons",
        href: "/coupons",
        icon: TicketPercent,
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      {
        label: "Orders",
        href: "/orders",
        icon: ShoppingBag,
        allowedRoles: MODULE_ROLE_ACCESS.orders,
      },
      {
        label: "Shipping",
        href: "/shipping",
        icon: Truck,
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

  if (pathname === "/banners" || pathname.startsWith("/banners/")) {
    return [
      { label: "Catalog" },
      { label: "Banners", href: "/banners" },
    ];
  }

  if (pathname === "/coupons" || pathname.startsWith("/coupons/")) {
    return [
      { label: "Catalog" },
      { label: "Coupons", href: "/coupons" },
    ];
  }

  if (pathname === "/orders") {
    return [
      { label: "Operations" },
      { label: "Orders", href: "/orders" },
    ];
  }

  if (pathname.startsWith("/orders/")) {
    return [
      { label: "Operations" },
      { label: "Orders", href: "/orders" },
      { label: "Order details" },
    ];
  }

  if (pathname === "/shipping" || pathname.startsWith("/shipping/")) {
    return [
      { label: "Operations" },
      { label: "Shipping", href: "/shipping" },
    ];
  }

  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
  }));
}
