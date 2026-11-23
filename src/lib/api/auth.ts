import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  AdminAuthData,
  AdminUser,
  LoginRequestPayload,
} from "@/types/auth";

export async function loginAdmin(
  payload: LoginRequestPayload
): Promise<AdminUser> {
  const response = await apiClient.post<ApiSuccessResponse<AdminAuthData>>(
    "/auth/login",
    payload
  );
  return response.data.data.admin;
}

export async function logoutAdmin(): Promise<void> {
  await apiClient.post<ApiSuccessResponse<null>>("/auth/logout");
}

export async function logoutAllAdminSessions(): Promise<void> {
  await apiClient.post<ApiSuccessResponse<null>>("/auth/logout-all");
}

export async function getCurrentAdmin(): Promise<AdminUser> {
  const response = await apiClient.get<ApiSuccessResponse<AdminAuthData>>(
    "/auth/me"
  );
  return response.data.data.admin;
}
