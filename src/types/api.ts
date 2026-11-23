export const ADMIN_ROLES = [
  "super_admin",
  "catalog_manager",
  "operations_manager",
  "support_moderator",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminAccountStatus = "active" | "suspended";

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorDetail {
  field?: string;
  path?: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
