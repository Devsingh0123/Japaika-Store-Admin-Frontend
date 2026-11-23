"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ADMIN_ROLE_LABELS } from "@/lib/auth/rbac";
import type { AdminRole } from "@/types/api";

interface AccessDeniedProps {
  currentRole?: AdminRole | null;
  allowedRoles?: readonly AdminRole[];
  title?: string;
  description?: string;
}

export function AccessDenied({
  currentRole,
  allowedRoles,
  title = "Access denied",
  description = "Your administrator role does not have permission to view this resource.",
}: AccessDeniedProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-destructive/25 bg-destructive-muted text-destructive">
              <ShieldAlert className="size-4" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <Badge variant="destructive" className="font-mono text-[0.6875rem]">
                403 Forbidden
              </Badge>
              <h1 className="pt-0.5 text-base font-semibold text-foreground">
                {title}
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          {currentRole || (allowedRoles && allowedRoles.length > 0) ? (
            <dl className="space-y-2 border-t border-border pt-4 text-xs">
              {currentRole ? (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Your role</dt>
                  <dd className="font-medium text-foreground">
                    {ADMIN_ROLE_LABELS[currentRole]}
                  </dd>
                </div>
              ) : null}
              {allowedRoles && allowedRoles.length > 0 ? (
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-foreground">
                    Permitted roles
                  </dt>
                  <dd className="text-right font-medium text-foreground">
                    {allowedRoles
                      .map((role) => ADMIN_ROLE_LABELS[role])
                      .join(", ")}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          <div className="pt-1">
            <Link
              href="/"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to overview
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
