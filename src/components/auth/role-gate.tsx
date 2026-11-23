"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { AdminRole } from "@/types/api";

interface RoleGateProps {
  allowedRoles: readonly AdminRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Declarative UI helper for role-aware controls and sections.
 * Never a substitute for backend RBAC enforcement in admin-backend.
 */
export function RoleGate({
  allowedRoles,
  children,
  fallback = null,
}: RoleGateProps) {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated || !hasRole(allowedRoles)) {
    return fallback;
  }

  return children;
}
