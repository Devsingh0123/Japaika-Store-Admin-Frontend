"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, useLoginMutation } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/error";
import { getSafeReturnPath } from "@/lib/auth/rbac";
import { loginSchema, type LoginFormValues } from "@/lib/auth/schemas";
import { applyApiValidationErrors, zodResolver } from "@/lib/forms/zod";

interface LoginFormProps {
  returnTo?: string | null;
}

function getFormErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Unable to sign in right now. Try again.";
  }

  switch (error.code) {
    case "INVALID_CREDENTIALS":
      return "The email address or password is incorrect.";
    case "ACCOUNT_SUSPENDED":
      return "This administrator account is suspended. Contact a Super Admin.";
    case "RATE_LIMIT_EXCEEDED":
      return "Too many sign-in attempts. Wait a few minutes before trying again.";
    case "NETWORK_ERROR":
      return "Cannot reach the admin API server. Verify the service is running and try again.";
    default:
      return error.message || "Unable to sign in right now. Try again.";
  }
}

export function LoginForm({ returnTo }: LoginFormProps) {
  const router = useRouter();
  const { isAuthenticated, sessionNotice, clearNotice } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const safeReturnTo = getSafeReturnPath(returnTo);
  const loginMutation = useLoginMutation({ returnTo: safeReturnTo });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(safeReturnTo);
    }
  }, [isAuthenticated, router, safeReturnTo]);

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    if (sessionNotice) {
      clearNotice();
    }

    try {
      await loginMutation.mutateAsync({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
    } catch (error: unknown) {
      const appliedToFields = applyApiValidationErrors(error, setError);
      if (!appliedToFields) {
        setFormError(getFormErrorMessage(error));
      }
    }
  };

  const pending = isSubmitting || loginMutation.isPending;
  const activeBannerMessage = formError ?? sessionNotice;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {activeBannerMessage ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive-muted px-3.5 py-3 text-xs leading-5 font-medium text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{activeBannerMessage}</p>
        </div>
      ) : null}

      <FormField
        htmlFor="admin-email"
        label="Email address"
        error={errors.email?.message}
        errorId="admin-email-error"
      >
        <Input
          id="admin-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="admin@japaika.com"
          disabled={pending}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "admin-email-error" : undefined}
          className="h-10"
          {...register("email")}
        />
      </FormField>

      <FormField
        htmlFor="admin-password"
        label="Password"
        error={errors.password?.message}
        errorId="admin-password-error"
      >
        <div className="relative">
          <Input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            disabled={pending}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "admin-password-error" : undefined
            }
            className="h-10 pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={pending}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 inline-flex w-10 cursor-pointer items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </FormField>

      <div className="pt-1">
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-10 w-full cursor-pointer font-medium shadow-[var(--shadow-xs)]"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </div>
    </form>
  );
}
