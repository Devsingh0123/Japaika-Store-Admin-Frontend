import type { AdminAccountStatus, AdminRole } from "@/types/api";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  status: AdminAccountStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminAuthData {
  admin: AdminUser;
}

export interface LoginRequestPayload {
  email: string;
  password: string;
}

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";
