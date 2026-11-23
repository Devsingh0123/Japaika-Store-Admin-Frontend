import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminShell } from "@/components/layout/admin-shell";

interface PortalLayoutProps {
  children: ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <AuthGuard>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
