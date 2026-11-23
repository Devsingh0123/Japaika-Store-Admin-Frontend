import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/error";

export { zodResolver };

/**
 * Maps backend VALIDATION_ERROR field details from ADMIN_API_CONTRACTS.md
 * onto React Hook Form field errors. Returns true if at least one field error was applied.
 */
export function applyApiValidationErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>
): boolean {
  if (!(error instanceof ApiError) || error.details.length === 0) {
    return false;
  }

  let applied = false;

  for (const detail of error.details) {
    const fieldName = detail.field ?? detail.path;
    if (!fieldName) {
      continue;
    }

    setError(fieldName as FieldPath<TFieldValues>, {
      type: "server",
      message: detail.message,
    });
    applied = true;
  }

  return applied;
}
