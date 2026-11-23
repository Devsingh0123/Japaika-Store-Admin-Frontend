"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  loginAdmin,
  logoutAdmin,
  logoutAllAdminSessions,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/error";
import { getSafeReturnPath, hasRole } from "@/lib/auth/rbac";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearAuthSession,
  dismissSessionNotice,
  setAuthenticatedAdmin,
} from "@/store/slices/auth.slice";
import type { AdminRole } from "@/types/api";
import type { LoginRequestPayload } from "@/types/auth";

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

export function useAuth() {
  const dispatch = useAppDispatch();
  const { admin, status, sessionNotice } = useAppSelector(
    (state) => state.auth
  );

  const checkRole = useCallback(
    (allowedRoles: readonly AdminRole[]) => hasRole(admin, allowedRoles),
    [admin]
  );

  const clearNotice = useCallback(() => {
    dispatch(dismissSessionNotice());
  }, [dispatch]);

  return {
    admin,
    role: admin?.role ?? null,
    status,
    sessionNotice,
    isAuthenticated: status === "authenticated" && admin !== null,
    isLoading: status === "idle" || status === "loading",
    hasRole: checkRole,
    clearNotice,
  };
}

interface UseLoginMutationOptions {
  returnTo?: string | null;
}

export function useLoginMutation(options: UseLoginMutationOptions = {}) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginRequestPayload) => loginAdmin(payload),
    onSuccess: (admin) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, admin);
      dispatch(setAuthenticatedAdmin(admin));
      toast.success(`Signed in as ${admin.fullName}`);
      router.replace(getSafeReturnPath(options.returnTo));
    },
  });
}

export function useLogoutMutation() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => logoutAdmin(),
    onSuccess: async () => {
      await queryClient.cancelQueries();
      dispatch(clearAuthSession(null));
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      toast.success("Signed out");
      router.replace("/login");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to sign out right now. Try again.";
      toast.error(message);
    },
  });
}

export function useLogoutAllMutation() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => logoutAllAdminSessions(),
    onSuccess: async () => {
      await queryClient.cancelQueries();
      dispatch(clearAuthSession(null));
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      toast.success("Signed out from all devices");
      router.replace("/login");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to sign out from all devices right now. Try again.";
      toast.error(message);
    },
  });
}
