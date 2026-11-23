import type { Metadata } from "next";
import Image from "next/image";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Japaika E-commerce administrative portal.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawNext = Array.isArray(resolvedSearchParams.next)
    ? resolvedSearchParams.next[0]
    : resolvedSearchParams.next;

  return (
    <div className="grid min-h-screen flex-1 bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Cohesive Brand Anchor Panel — shares exact Admin Sidebar surface tokens */}
      <aside
        aria-label="Japaika Admin Portal overview"
        className="relative hidden flex-col justify-between overflow-hidden border-r border-sidebar-border bg-sidebar p-12 text-sidebar-foreground lg:flex"
      >
        <div className="relative z-10 flex items-center justify-between gap-4">
          <BrandMark size="md" priority />
          <Badge variant="brand">
            <ShieldCheck className="size-3 text-brand" aria-hidden="true" />
            Admin Portal
          </Badge>
        </div>

        <div className="relative z-10 max-w-md space-y-5">
          <div className="h-0.5 w-10 rounded-full bg-brand" aria-hidden="true" />
          <h2 className="text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.025em] text-foreground">
            Commerce operations for authentic spiritual retail.
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Manage certified gemstones, Rudraksha collections, category
            hierarchies, customer orders, and moderation workflows from one
            isolated administrative console.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 border-t border-sidebar-border pt-6 text-xs text-muted-foreground">
          <LockKeyhole
            className="size-3.5 shrink-0 text-brand"
            aria-hidden="true"
          />
          <span>
            Restricted to provisioned Japaika staff with role-based access
            control.
          </span>
        </div>

        {/* Quiet architectural lotus watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -bottom-28 size-[420px] opacity-[0.06] select-none"
        >
          <Image
            src="/japaikaLogo.svg"
            alt=""
            width={420}
            height={420}
            className="h-full w-full"
          />
        </div>
      </aside>

      {/* Sign-In Workspace */}
      <div className="relative flex flex-col">
        {/* Desktop Theme Switcher */}
        <div className="hidden lg:block lg:absolute lg:top-5 lg:right-6">
          <ThemeToggle />
        </div>

        {/* Compact Mobile / Tablet Brand Header */}
        <header className="flex h-15 items-center justify-between border-b border-sidebar-border bg-sidebar px-5 lg:hidden">
          <BrandMark size="sm" priority />
          <div className="flex items-center gap-2">
            <Badge variant="brand">
              <ShieldCheck className="size-3 text-brand" aria-hidden="true" />
              Admin Portal
            </Badge>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:px-14">
          <div className="mx-auto w-full max-w-[420px] space-y-5">
            <Card className="shadow-[var(--shadow-sm)]">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="space-y-1.5">
                  <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em] text-foreground">
                    Sign in to Japaika Admin
                  </h1>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Enter your provisioned administrator email and password to
                    continue.
                  </p>
                </div>

                <LoginForm returnTo={rawNext} />
              </CardContent>
            </Card>

            <p className="px-1 text-center text-xs leading-5 text-muted-foreground">
              Public registration is disabled. Contact a Super Admin if you need
              portal access or a role update.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
