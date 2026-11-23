"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { AccessDenied } from "@/components/auth/access-denied";
import { useAuth } from "@/hooks/use-auth";
import type { AdminRole } from "@/types/api";

const emptySubscribe = () => () => {};

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: readonly AdminRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { admin, isLoading, isAuthenticated, hasRole } = useAuth();

  useEffect(() => {
    if (!isHydrated || isLoading || isAuthenticated) {
      return;
    }

    const search =
      typeof window !== "undefined" ? window.location.search : "";
    const currentPath = `${pathname}${search}`;
    const loginUrl =
      currentPath && currentPath !== "/"
        ? `/login?next=${encodeURIComponent(currentPath)}`
        : "/login";

    router.replace(loginUrl);
  }, [isHydrated, isLoading, isAuthenticated, pathname, router]);

  if (!isHydrated || isLoading || !isAuthenticated) {
    return (
      <div
        className="flex flex-1 items-center justify-center bg-background p-6"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>Verifying administrator session...</span>
        </div>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <AccessDenied currentRole={admin?.role} allowedRoles={allowedRoles} />
    );
  }

  return children;
}
