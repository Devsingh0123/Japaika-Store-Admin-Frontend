import axios, { type InternalAxiosRequestConfig } from "axios";
import { env } from "@/lib/env";
import { ApiError, normalizeApiError } from "@/lib/api/error";
import type { ApiSuccessResponse } from "@/types/api";
import type { AdminAuthData, AdminUser } from "@/types/auth";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

interface ApiAuthHandlers {
  onSessionRefreshed?: (admin: AdminUser) => void;
  onAuthFailure?: (error: ApiError) => void;
}

const SKIP_REFRESH_PATHS = ["/auth/login", "/auth/refresh", "/auth/logout"];

let authHandlers: ApiAuthHandlers = {};
let activeRefreshPromise: Promise<AdminUser> | null = null;

export function configureApiAuthHandlers(handlers: ApiAuthHandlers): () => void {
  authHandlers = handlers;
  return () => {
    if (authHandlers === handlers) {
      authHandlers = {};
    }
  };
}

function shouldSkipRefresh(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  return SKIP_REFRESH_PATHS.some((path) => url.includes(path));
}

/**
 * Dedicated Axios instance without the 401 refresh interceptor so
 * POST /api/v1/auth/refresh can never trigger recursive retries.
 */
const refreshClient = axios.create({
  baseURL: env.adminApiUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/**
 * Executes a single-flight POST /api/v1/auth/refresh request.
 * Concurrent 401 responses share the same in-flight promise so rotated
 * refresh tokens are never replayed against admin-backend reuse detection.
 */
export function requestSingleFlightRefresh(): Promise<AdminUser> {
  if (!activeRefreshPromise) {
    activeRefreshPromise = refreshClient
      .post<ApiSuccessResponse<AdminAuthData>>("/auth/refresh")
      .then((response) => {
        const admin = response.data.data.admin;
        authHandlers.onSessionRefreshed?.(admin);
        return admin;
      })
      .catch((error: unknown) => {
        const normalized = normalizeApiError(error);
        authHandlers.onAuthFailure?.(normalized);
        throw normalized;
      })
      .finally(() => {
        activeRefreshPromise = null;
      });
  }

  return activeRefreshPromise;
}

/**
 * Shared Axios client for admin-backend REST APIs (/api/v1).
 * Uses `withCredentials: true` so HttpOnly admin auth cookies are sent automatically.
 */
export const apiClient = axios.create({
  baseURL: env.adminApiUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const normalized = normalizeApiError(error);

    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(normalized);
    }

    const originalRequest = error.config as RetryableRequestConfig;

    // 403 ACCOUNT_SUSPENDED invalidates the admin session immediately
    if (normalized.status === 403 && normalized.code === "ACCOUNT_SUSPENDED") {
      authHandlers.onAuthFailure?.(normalized);
      return Promise.reject(normalized);
    }

    // 403 FORBIDDEN (insufficient RBAC role) must never trigger refresh or logout
    if (normalized.isForbidden) {
      return Promise.reject(normalized);
    }

    // 401 Unauthorized: attempt a single-flight session refresh and retry once
    if (
      normalized.isUnauthorized &&
      !originalRequest._retried &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._retried = true;
      try {
        await requestSingleFlightRefresh();
        return await apiClient(originalRequest);
      } catch (refreshError: unknown) {
        return Promise.reject(normalizeApiError(refreshError));
      }
    }

    return Promise.reject(normalized);
  }
);
