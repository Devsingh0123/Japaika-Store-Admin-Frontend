"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { ADMIN_NAV_GROUPS } from "@/components/layout/nav-config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { ADMIN_ROLE_LABELS } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";

interface SidebarNavContentProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNavContent({
  collapsed = false,
  onNavigate,
}: SidebarNavContentProps) {
  const pathname = usePathname();
  const { admin, hasRole } = useAuth();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand Anchor */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "px-4"
        )}
      >
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="Japaika Admin Overview"
          className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <BrandMark size="sm" showWordmark={!collapsed} priority />
        </Link>
      </div>

      {/* Grouped Navigation */}
      <nav
        aria-label="Admin sidebar navigation"
        className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4"
      >
        {ADMIN_NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.allowedRoles || hasRole(item.allowedRoles)
          );

          if (visibleItems.length === 0) {
            return null;
          }

          return (
            <div key={group.id} className="space-y-1">
              {!collapsed ? (
                <p className="px-2.5 pb-1 text-[0.7rem] font-medium text-sidebar-muted">
                  {group.label}
                </p>
              ) : (
                <div
                  className="mx-auto my-2 h-px w-6 bg-sidebar-border"
                  aria-hidden="true"
                />
              )}

              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);

                  const linkNode = (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex h-9 items-center rounded-lg text-[0.84375rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                        collapsed
                          ? "justify-center px-0"
                          : "gap-2.5 px-2.5",
                        isActive
                          ? "border border-border/80 bg-card text-foreground shadow-[var(--shadow-xs)]"
                          : "border border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      {isActive ? (
                        <span
                          aria-hidden="true"
                          className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-r-full bg-brand"
                        />
                      ) : null}
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          isActive
                            ? "text-brand"
                            : "text-sidebar-muted group-hover:text-sidebar-accent-foreground"
                        )}
                        aria-hidden="true"
                      />
                      {!collapsed ? (
                        <span className="truncate">{item.label}</span>
                      ) : (
                        <span className="sr-only">{item.label}</span>
                      )}
                    </Link>
                  );

                  return (
                    <li key={item.href}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger render={linkNode} />
                          <TooltipContent side="right">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        linkNode
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Role Footer */}
      {admin ? (
        <div className="shrink-0 border-t border-sidebar-border p-3">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className="mx-auto flex size-8 items-center justify-center rounded-lg border border-sidebar-border bg-card/80 text-brand">
                    <Shield className="size-4" aria-hidden="true" />
                  </div>
                }
              />
              <TooltipContent side="right">
                {ADMIN_ROLE_LABELS[admin.role]}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-card/75 px-3 py-2">
              <Shield
                className="size-4 shrink-0 text-brand"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {ADMIN_ROLE_LABELS[admin.role]}
                </p>
                <p className="truncate text-[0.6875rem] text-muted-foreground">
                  Isolated admin portal
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

interface AdminSidebarProps {
  collapsed: boolean;
}

export function AdminSidebar({ collapsed }: AdminSidebarProps) {
  return (
    <aside
      aria-label="Primary sidebar"
      className={cn(
        "hidden shrink-0 border-r border-sidebar-border transition-[width] duration-200 lg:block",
        collapsed ? "w-[68px]" : "w-[248px]"
      )}
    >
      <div className="sticky top-0 h-screen">
        <SidebarNavContent collapsed={collapsed} />
      </div>
    </aside>
  );
}
