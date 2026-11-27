import type { AdminRole } from "@/types/api";
import type { AdminUser } from "@/types/auth";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  catalog_manager: "Catalog Manager",
  operations_manager: "Operations Manager",
  support_moderator: "Support Moderator",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin:
    "Full platform governance, store settings, admin accounts, and audit logs.",
  catalog_manager:
    "Categories, products, variants, astrology attributes, media, pricing, banners, and coupons.",
  operations_manager:
    "Order fulfillment, shipping and AWB tracking, inventory adjustments, cancellations, returns, and refunds.",
  support_moderator:
    "Customer directory, order inquiry lookup, and product review moderation.",
};

export type AdminModuleKey =
  | "dashboard"
  | "catalog"
  | "inventory"
  | "orders"
  | "payments"
  | "shipping"
  | "coupons"
  | "customers"
  | "reviews"
  | "audit_logs"
  | "admin_accounts"
  | "settings";

export const MODULE_ROLE_ACCESS: Record<AdminModuleKey, readonly AdminRole[]> =
  {
    dashboard: [
      "super_admin",
      "catalog_manager",
      "operations_manager",
      "support_moderator",
    ],
    catalog: ["super_admin", "catalog_manager"],
    inventory: ["super_admin", "catalog_manager", "operations_manager"],
    orders: ["super_admin", "operations_manager", "support_moderator"],
    payments: ["super_admin", "operations_manager"],
    shipping: ["super_admin", "operations_manager"],
    coupons: ["super_admin", "catalog_manager"],
    customers: ["super_admin", "operations_manager", "support_moderator"],
    reviews: ["super_admin", "support_moderator"],
    audit_logs: ["super_admin"],
    admin_accounts: ["super_admin"],
    settings: ["super_admin"],
  };

export function hasAnyRole(
  role: AdminRole | null | undefined,
  allowedRoles: readonly AdminRole[]
): boolean {
  if (!role) {
    return false;
  }
  return allowedRoles.includes(role);
}

export function hasRole(
  admin: Pick<AdminUser, "role"> | null | undefined,
  allowedRoles: readonly AdminRole[]
): boolean {
  return hasAnyRole(admin?.role, allowedRoles);
}

/**
 * Validates post-login redirect paths to prevent open redirects or login loops.
 */
export function getSafeReturnPath(
  nextPath: string | null | undefined,
  fallback = "/"
): string {
  if (!nextPath) {
    return fallback;
  }

  const trimmed = nextPath.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed === "/login" || trimmed.startsWith("/login?")) {
    return fallback;
  }

  return trimmed;
}
