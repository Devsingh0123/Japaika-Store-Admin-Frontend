import axios from "axios";
import type { ApiErrorDetail, ApiErrorResponse } from "@/types/api";

export interface ApiErrorInit {
  message: string;
  code: string;
  status: number;
  details?: ApiErrorDetail[];
  cause?: unknown;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: ApiErrorDetail[];

  constructor({ message, code, status, details = [], cause }: ApiErrorInit) {
    super(message, { cause });
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isValidationError(): boolean {
    return this.status === 400 && this.code === "VALIDATION_ERROR";
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<ApiErrorResponse>;
  return (
    candidate.success === false &&
    typeof candidate.error === "object" &&
    candidate.error !== null &&
    typeof candidate.error.code === "string" &&
    typeof candidate.error.message === "string"
  );
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const responseData = error.response?.data;

    if (isApiErrorResponse(responseData)) {
      return new ApiError({
        message: responseData.error.message,
        code: responseData.error.code,
        status,
        details: Array.isArray(responseData.error.details)
          ? responseData.error.details
          : [],
        cause: error,
      });
    }

    if (error.code === "ECONNABORTED") {
      return new ApiError({
        message: "The request timed out. Try again.",
        code: "REQUEST_TIMEOUT",
        status: 0,
        cause: error,
      });
    }

    if (!error.response) {
      return new ApiError({
        message: "Unable to reach the admin API server. Check your connection.",
        code: "NETWORK_ERROR",
        status: 0,
        cause: error,
      });
    }

    return new ApiError({
      message: error.message || "An unexpected API error occurred.",
      code: "HTTP_ERROR",
      status,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      message: error.message,
      code: "UNKNOWN_ERROR",
      status: 0,
      cause: error,
    });
  }

  return new ApiError({
    message: "An unexpected error occurred.",
    code: "UNKNOWN_ERROR",
    status: 0,
    cause: error,
  });
}
