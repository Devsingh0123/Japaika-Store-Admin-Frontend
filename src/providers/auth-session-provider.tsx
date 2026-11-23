"use client";

import { useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AUTH_QUERY_KEY } from "@/hooks/use-auth";
import { getCurrentAdmin } from "@/lib/api/auth";
import { configureApiAuthHandlers } from "@/lib/api/client";
import { ApiError } from "@/lib/api/error";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearAuthSession,
  setAuthenticatedAdmin,
  setAuthLoading,
} from "@/store/slices/auth.slice";
import type { AdminUser } from "@/types/auth";

interface AuthSessionProviderProps {
  children: ReactNode;
}

function getSessionFailureNotice(error: ApiError): string | null {
  if (error.code === "ACCOUNT_SUSPENDED") {
    return "Your administrator account has been suspended. Contact a Super Admin.";
  }

  if (error.code === "REFRESH_TOKEN_REUSE_DETECTED") {
    return "Your session was ended for security reasons. Sign in again to continue.";
  }

  return null;
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const authStatus = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    return configureApiAuthHandlers({
      onSessionRefreshed: (admin) => {
        queryClient.setQueryData<AdminUser | null>(AUTH_QUERY_KEY, admin);
        dispatch(setAuthenticatedAdmin(admin));
      },
      onAuthFailure: (error) => {
        dispatch(clearAuthSession(getSessionFailureNotice(error)));
        queryClient.removeQueries({
          predicate: (query) => query.queryKey[0] !== "auth",
        });
        queryClient.setQueryData<AdminUser | null>(AUTH_QUERY_KEY, null);
      },
    });
  }, [dispatch, queryClient]);

  const { data, isPending, isError, error } = useQuery<AdminUser | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getCurrentAdmin,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: authStatus === "authenticated",
  });

  useEffect(() => {
    if (isPending) {
      dispatch(setAuthLoading());
      return;
    }

    if (data) {
      dispatch(setAuthenticatedAdmin(data));
      return;
    }

    if (isError) {
      const notice =
        error instanceof ApiError ? getSessionFailureNotice(error) : null;
      dispatch(clearAuthSession(notice));
      return;
    }

    if (data === null) {
      dispatch(clearAuthSession(undefined));
    }
  }, [data, isPending, isError, error, dispatch]);

  return children;
}
