"use client";

import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setMobileNavOpen,
  toggleSidebarCollapsed,
} from "@/store/slices/ui.slice";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed, mobileNavOpen } = useAppSelector(
    (state) => state.ui
  );

  return (
    <TooltipProvider delay={150}>
      <div className="flex min-h-screen flex-1 bg-background">
        <AdminSidebar collapsed={sidebarCollapsed} />

        <MobileNavDrawer
          open={mobileNavOpen}
          onOpenChange={(open) => dispatch(setMobileNavOpen(open))}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => dispatch(toggleSidebarCollapsed())}
            onOpenMobileNav={() => dispatch(setMobileNavOpen(true))}
          />

          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
