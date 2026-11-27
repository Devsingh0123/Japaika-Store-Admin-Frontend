import { z } from "zod";
import { fromDateTimeLocalValue } from "@/lib/format";
import type {
  Coupon,
  CouponEffectiveStatus,
  CouponVisibility,
  CreateCouponInput,
  UpdateCouponInput,
} from "@/types/coupon";

export const COUPON_CODE_REGEX = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;
const DECIMAL_TWO_PLACES_REGEX = /^\d+(\.\d{1,2})?$/;
const POSITIVE_INT_REGEX = /^\d+$/;
const MAX_MONEY_AMOUNT = 99999999.99;

export const COUPON_VISIBILITY_OPTIONS: readonly CouponVisibility[] = [
  "public",
  "hidden",
];

export const COUPON_VISIBILITY_LABELS: Record<CouponVisibility, string> = {
  public: "Public",
  hidden: "Hidden",
};

export const COUPON_STATUS_LABELS: Record<CouponEffectiveStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  expired: "Expired",
  exhausted: "Exhausted",
};

export interface CouponFormValues {
  code: string;
  description: string;
  discountPercentage: string;
  minCartSubtotalInr: string;
  minCartSubtotalUsd: string;
  hasMaxDiscount: boolean;
  maxDiscountInr: string;
  maxDiscountUsd: string;
  maxRedemptions: string;
  visibility: CouponVisibility;
  isActive: boolean;
  expiresAt: string;
}

interface CouponSchemaOptions {
  isCodeLocked?: boolean;
  minRedemptions?: number;
  initialExpiresAt?: string;
}

function isValidMoneyString(
  value: string,
  minValue: number,
  maxValue = MAX_MONEY_AMOUNT
): boolean {
  const trimmed = value.trim();
  if (!DECIMAL_TWO_PLACES_REGEX.test(trimmed)) {
    return false;
  }
  const num = Number(trimmed);
  return Number.isFinite(num) && num >= minValue && num <= maxValue;
}

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function createCouponFormSchema(options: CouponSchemaOptions = {}) {
  const {
    isCodeLocked = false,
    minRedemptions = 0,
    initialExpiresAt = "",
  } = options;

  return z
    .object({
      code: z.string(),
      description: z
        .string()
        .max(255, "Description cannot exceed 255 characters."),
      discountPercentage: z.string(),
      minCartSubtotalInr: z.string(),
      minCartSubtotalUsd: z.string(),
      hasMaxDiscount: z.boolean(),
      maxDiscountInr: z.string(),
      maxDiscountUsd: z.string(),
      maxRedemptions: z.string(),
      visibility: z.enum(["public", "hidden"]),
      isActive: z.boolean(),
      expiresAt: z.string(),
    })
    .superRefine((data, ctx) => {
      if (!isCodeLocked) {
        const normalizedCode = normalizeCouponCode(data.code);
        if (!normalizedCode) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["code"],
            message: "Coupon code is required.",
          });
        } else if (!COUPON_CODE_REGEX.test(normalizedCode)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["code"],
            message:
              "Use 3–32 characters: A–Z, 0–9, hyphen (-), or underscore (_), starting with a letter or number.",
          });
        }
      }

      const pctTrimmed = data.discountPercentage.trim();
      if (!pctTrimmed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discountPercentage"],
          message: "Discount percentage is required.",
        });
      } else if (!isValidMoneyString(pctTrimmed, 0.01, 100)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discountPercentage"],
          message:
            "Enter a percentage between 0.01 and 100 (up to 2 decimal places).",
        });
      }

      const minInr = data.minCartSubtotalInr.trim();
      if (!minInr) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["minCartSubtotalInr"],
          message: "India (INR) minimum cart value is required.",
        });
      } else if (!isValidMoneyString(minInr, 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["minCartSubtotalInr"],
          message: "Enter a valid non-negative INR amount (max 2 decimals).",
        });
      }

      const minUsd = data.minCartSubtotalUsd.trim();
      if (!minUsd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["minCartSubtotalUsd"],
          message: "USA (USD) minimum cart value is required.",
        });
      } else if (!isValidMoneyString(minUsd, 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["minCartSubtotalUsd"],
          message: "Enter a valid non-negative USD amount (max 2 decimals).",
        });
      }

      if (data.hasMaxDiscount) {
        const capInr = data.maxDiscountInr.trim();
        if (!capInr) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["maxDiscountInr"],
            message: "India (INR) max discount cap is required when capping.",
          });
        } else if (!isValidMoneyString(capInr, 0.01)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["maxDiscountInr"],
            message: "INR cap must be at least 0.01 (max 2 decimals).",
          });
        }

        const capUsd = data.maxDiscountUsd.trim();
        if (!capUsd) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["maxDiscountUsd"],
            message: "USA (USD) max discount cap is required when capping.",
          });
        } else if (!isValidMoneyString(capUsd, 0.01)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["maxDiscountUsd"],
            message: "USD cap must be at least 0.01 (max 2 decimals).",
          });
        }
      }

      const maxRedemptionsTrimmed = data.maxRedemptions.trim();
      if (maxRedemptionsTrimmed !== "") {
        if (!POSITIVE_INT_REGEX.test(maxRedemptionsTrimmed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["maxRedemptions"],
            message: "Enter a whole number of at least 1, or leave blank.",
          });
        } else {
          const parsedLimit = Number(maxRedemptionsTrimmed);
          if (parsedLimit < 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["maxRedemptions"],
              message: "Usage limit must be at least 1.",
            });
          } else if (minRedemptions > 0 && parsedLimit < minRedemptions) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["maxRedemptions"],
              message: `Cannot be lower than current redemptions (${minRedemptions}).`,
            });
          }
        }
      }

      const expiresTrimmed = data.expiresAt.trim();
      const expiryChanged = expiresTrimmed !== initialExpiresAt;
      if (expiresTrimmed !== "" && expiryChanged) {
        const iso = fromDateTimeLocalValue(expiresTrimmed);
        if (!iso) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["expiresAt"],
            message: "Enter a valid expiry date and time.",
          });
        } else if (new Date(iso).getTime() <= Date.now()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["expiresAt"],
            message: "Expiry date and time must be in the future.",
          });
        }
      }
    });
}

export function buildCreateCouponPayload(
  values: CouponFormValues
): CreateCouponInput {
  const description = values.description.trim();
  const maxRedemptionsTrimmed = values.maxRedemptions.trim();

  return {
    code: normalizeCouponCode(values.code),
    description: description === "" ? null : description,
    discountPercentage: values.discountPercentage.trim(),
    minCartSubtotal: {
      INR: values.minCartSubtotalInr.trim(),
      USD: values.minCartSubtotalUsd.trim(),
    },
    maxDiscount: values.hasMaxDiscount
      ? {
          INR: values.maxDiscountInr.trim(),
          USD: values.maxDiscountUsd.trim(),
        }
      : null,
    maxRedemptions:
      maxRedemptionsTrimmed === "" ? null : Number(maxRedemptionsTrimmed),
    visibility: values.visibility,
    isActive: values.isActive,
    expiresAt: values.expiresAt.trim()
      ? fromDateTimeLocalValue(values.expiresAt)
      : null,
  };
}

export function buildUpdateCouponPayload(
  values: CouponFormValues,
  existing: Coupon,
  initialExpiresAt: string
): UpdateCouponInput {
  const description = values.description.trim();
  const maxRedemptionsTrimmed = values.maxRedemptions.trim();
  const isCodeLocked = existing.redemptionCount > 0;

  const payload: UpdateCouponInput = {
    description: description === "" ? null : description,
    discountPercentage: values.discountPercentage.trim(),
    minCartSubtotal: {
      INR: values.minCartSubtotalInr.trim(),
      USD: values.minCartSubtotalUsd.trim(),
    },
    maxDiscount: values.hasMaxDiscount
      ? {
          INR: values.maxDiscountInr.trim(),
          USD: values.maxDiscountUsd.trim(),
        }
      : null,
    maxRedemptions:
      maxRedemptionsTrimmed === "" ? null : Number(maxRedemptionsTrimmed),
    visibility: values.visibility,
    isActive: values.isActive,
  };

  if (!isCodeLocked) {
    payload.code = normalizeCouponCode(values.code);
  }

  const nextExpiresTrimmed = values.expiresAt.trim();
  if (nextExpiresTrimmed !== initialExpiresAt) {
    payload.expiresAt = nextExpiresTrimmed
      ? fromDateTimeLocalValue(nextExpiresTrimmed)
      : null;
  }

  return payload;
}

export function formatDiscountPercent(value: string | number): string {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return `${value}%`;
  }
  return `${Number.isInteger(num) ? num.toFixed(0) : num.toFixed(2).replace(/\.?0+$/, "")}%`;
}
