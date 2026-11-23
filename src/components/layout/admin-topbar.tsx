"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
} from "lucide-react";
import { LogoutAllDialog } from "@/components/auth/logout-all-dialog";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { getBreadcrumbsForPath } from "@/components/layout/nav-config";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useLogoutMutation } from "@/hooks/use-auth";
import { ADMIN_ROLE_LABELS } from "@/lib/auth/rbac";

interface AdminTopbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
}

export function AdminTopbar({
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileNav,
}: AdminTopbarProps) {
  const pathname = usePathname();
  const { admin } = useAuth();
  const logoutMutation = useLogoutMutation();
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);

  const breadcrumbs = getBreadcrumbsForPath(pathname);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur-[2px] sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Mobile Drawer Trigger */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Open navigation menu"
            onClick={onOpenMobileNav}
            className="cursor-pointer lg:hidden"
          >
            <Menu className="size-4" aria-hidden="true" />
          </Button>

          {/* Desktop Sidebar Rail Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            onClick={onToggleSidebar}
            className="hidden cursor-pointer text-muted-foreground hover:text-foreground lg:inline-flex"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-4" aria-hidden="true" />
            )}
          </Button>

          <span className="h-4 w-px bg-border" aria-hidden="true" />

          {/* Route Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-1.5 text-sm"
          >
            <Link
              href="/"
              className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Japaika Admin
            </Link>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <Fragment key={`${crumb.label}-${index}`}>
                  <ChevronRight
                    className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:inline"
                    aria-hidden="true"
                  />
                  {index > 0 ? (
                    <ChevronRight
                      className="size-3.5 shrink-0 text-muted-foreground/60 sm:hidden"
                      aria-hidden="true"
                    />
                  ) : null}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="truncate text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={
                        isLast
                          ? "truncate font-medium text-foreground"
                          : "truncate text-muted-foreground"
                      }
                    >
                      {crumb.label}
                    </span>
                  )}
                </Fragment>
              );
            })}
          </nav>
        </div>

        {/* Theme Toggle & Account Menu */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {admin ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label="Account menu"
                    className="inline-flex h-9 cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-2 text-left transition-colors outline-none hover:border-border hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    <Avatar name={admin.fullName} size="sm" />
                    <div className="hidden min-w-0 sm:block">
                      <p className="max-w-36 truncate text-xs font-semibold leading-tight text-foreground">
                        {admin.fullName}
                      </p>
                      <p className="max-w-36 truncate text-[0.6875rem] leading-tight text-muted-foreground">
                        {ADMIN_ROLE_LABELS[admin.role]}
                      </p>
                    </div>
                    <ChevronDown
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </button>
                }
              />

              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="space-y-1.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {admin.fullName}
                    </p>
                    <Badge variant="brand" className="text-[0.65rem]">
                      {ADMIN_ROLE_LABELS[admin.role]}
                    </Badge>
                  </div>
                  <p className="truncate text-[0.7rem] text-muted-foreground">
                    {admin.email}
                  </p>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setLogoutAllOpen(true)}
                >
                  <ShieldAlert className="size-3.5" aria-hidden="true" />
                  Sign out all devices
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </header>

      <LogoutAllDialog open={logoutAllOpen} onOpenChange={setLogoutAllOpen} />
    </>
  );
}
