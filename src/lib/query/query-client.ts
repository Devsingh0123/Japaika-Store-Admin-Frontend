import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/error";

const NON_RETRYABLE_STATUS_CODES = new Set([400, 401, 403, 404, 409, 422, 429]);

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) {
    return false;
  }

  if (error instanceof ApiError && NON_RETRYABLE_STATUS_CODES.has(error.status)) {
    return false;
  }

  return true;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keep operational admin data fresh while avoiding redundant duplicate fetches
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
