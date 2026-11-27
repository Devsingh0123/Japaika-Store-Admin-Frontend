"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  FolderTree,
  Package,
  Shield,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  ADMIN_ROLE_DESCRIPTIONS,
  ADMIN_ROLE_LABELS,
  MODULE_ROLE_ACCESS,
  type AdminModuleKey,
} from "@/lib/auth/rbac";
import { formatDateTime } from "@/lib/format";

const ACCESS_DIRECTORY: readonly {
  id: string;
  key: AdminModuleKey;
  label: string;
  description: string;
  href?: string;
}[] = [
  {
    id: "categories",
    key: "catalog",
    label: "Categories & Subcategories",
    description:
      "Organize 2-level catalog hierarchy, imagery, visibility, and SEO metadata.",
    href: "/categories",
  },
  {
    id: "products",
    key: "catalog",
    label: "Products & Variants",
    description:
      "Manage simple and variant products, GST-inclusive pricing, media, certificates, and specifications.",
    href: "/products",
  },
  {
    id: "banners",
    key: "catalog",
    label: "Banners & Hero Slides",
    description:
      "Curate homepage hero and promotional banners, desktop/mobile artwork, CTA links, order, and schedules.",
    href: "/banners",
  },
  {
    id: "inventory",
    key: "inventory",
    label: "Inventory & Stock Controls",
    description:
      "Track SKU stock levels, low-stock thresholds, and per-variant availability.",
    href: "/products",
  },
  {
    id: "orders",
    key: "orders",
    label: "Orders & Fulfillment",
    description:
      "Review orders, advance fulfillment states, and attach courier AWB tracking.",
  },
  {
    id: "payments",
    key: "payments",
    label: "Payments & Refunds",
    description:
      "Inspect payment records, reconcile transactions, and issue guarded refunds.",
  },
  {
    id: "coupons",
    key: "coupons",
    label: "Coupons & Promotions",
    description:
      "Configure percentage discounts, INR/USD cart thresholds, caps, visibility, and usage limits.",
    href: "/coupons",
  },
  {
    id: "customers",
    key: "customers",
    label: "Customer Directory",
    description:
      "Look up customer profiles, order history context, and account status.",
  },
  {
    id: "reviews",
    key: "reviews",
    label: "Review Moderation",
    description:
      "Approve, reject, or hide submitted customer product reviews.",
  },
  {
    id: "audit_logs",
    key: "audit_logs",
    label: "Audit Logs & Governance",
    description:
      "Inspect immutable administrative change history and manage staff roles.",
  },
];

export function AuthenticatedPortalHome() {
  const { admin } = useAuth();

  if (!admin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${admin.fullName}`}
        description={ADMIN_ROLE_DESCRIPTIONS[admin.role]}
        badge={
          <Badge variant="brand">
            <Shield className="size-3 text-brand" aria-hidden="true" />
            {ADMIN_ROLE_LABELS[admin.role]}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/categories"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-[var(--shadow-xs)] transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FolderTree className="size-4 text-muted-foreground" aria-hidden="true" />
              Categories
            </Link>
            <Link
              href="/products"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-xs)] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Package className="size-4" aria-hidden="true" />
              Open products
            </Link>
          </div>
        }
      />

      {/* Active Session Strip */}
      <Card>
        <CardHeader className="py-3.5">
          <div>
            <CardTitle>Active administrator session</CardTitle>
            <CardDescription>
              Authenticated via isolated HttpOnly cookies with automatic token
              rotation.
            </CardDescription>
          </div>
          <StatusBadge label="Active" tone="success" />
        </CardHeader>

        <CardContent className="p-0">
          <dl className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
            <div className="space-y-1 px-5 py-4 sm:border-r sm:border-border">
              <dt className="text-xs text-muted-foreground">Account email</dt>
              <dd className="truncate text-sm font-medium text-foreground">
                {admin.email}
              </dd>
            </div>

            <div className="space-y-1 px-5 py-4 lg:border-r lg:border-border">
              <dt className="text-xs text-muted-foreground">Assigned role</dt>
              <dd className="font-mono text-xs font-medium text-foreground">
                {admin.role}
              </dd>
            </div>

            <div className="space-y-1 px-5 py-4 sm:border-t sm:border-r sm:border-border lg:border-t-0">
              <dt className="text-xs text-muted-foreground">Account status</dt>
              <dd className="text-sm font-medium capitalize text-success">
                {admin.status}
              </dd>
            </div>

            <div className="space-y-1 px-5 py-4 sm:border-t sm:border-border lg:border-t-0">
              <dt className="text-xs text-muted-foreground">Last sign-in</dt>
              <dd className="tabular-nums text-sm font-medium text-foreground">
                {formatDateTime(admin.lastLoginAt)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Operations Directory & Role Scope */}
      <Card>
        <CardHeader className="py-3.5">
          <div>
            <CardTitle>Operations modules &amp; role access</CardTitle>
            <CardDescription>
              Client visibility mirrors backend RBAC rules; write authorization
              is enforced on admin-backend.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ul className="divide-y divide-border sm:grid sm:grid-cols-2 sm:divide-y-0">
            {ACCESS_DIRECTORY.map((item) => {
              const isLive = Boolean(item.href);

              return (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 last:border-b-0 sm:odd:border-r"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                        >
                          {item.label}
                          <ArrowUpRight
                            className="size-3.5 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-foreground">
                          {item.label}
                        </span>
                      )}
                      {isLive ? (
                        <Badge variant="info" className="text-[0.65rem]">
                          Live
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>

                  <RoleGate
                    allowedRoles={MODULE_ROLE_ACCESS[item.key]}
                    fallback={
                      <Badge variant="muted" className="mt-0.5 shrink-0">
                        <ShieldOff className="size-3" aria-hidden="true" />
                        Restricted
                      </Badge>
                    }
                  >
                    <Badge variant="success" className="mt-0.5 shrink-0">
                      <ShieldCheck className="size-3" aria-hidden="true" />
                      Permitted
                    </Badge>
                  </RoleGate>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
