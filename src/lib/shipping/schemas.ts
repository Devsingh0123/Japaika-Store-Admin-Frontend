import { z } from "zod";
import type { PricingCountry } from "@/types/product";
import type {
  ShippingSetting,
  UpdateShippingSettingInput,
} from "@/types/shipping";

export const MAX_ESTIMATED_DAYS = 90;
const DECIMAL_TWO_PLACES_REGEX = /^\d+(\.\d{1,2})?$/;
const POSITIVE_INT_REGEX = /^\d+$/;
const MAX_MONEY_AMOUNT = 99999999.99;

export const SHIPPING_COUNTRY_META: Record<
  PricingCountry,
  { name: string; regionLabel: string; symbol: string }
> = {
  IN: {
    name: "India",
    regionLabel: "Domestic shipping (INR)",
    symbol: "₹",
  },
  US: {
    name: "United States",
    regionLabel: "International shipping (USD)",
    symbol: "$",
  },
};

export interface ShippingSettingFormValues {
  flatCharge: string;
  freeShippingThreshold: string;
  estimatedDaysMin: string;
  estimatedDaysMax: string;
}

function isValidMoney(value: string): boolean {
  const trimmed = value.trim();
  if (!DECIMAL_TWO_PLACES_REGEX.test(trimmed)) {
    return false;
  }
  const num = Number(trimmed);
  return Number.isFinite(num) && num >= 0 && num <= MAX_MONEY_AMOUNT;
}

export const shippingSettingFormSchema = z
  .object({
    flatCharge: z.string(),
    freeShippingThreshold: z.string(),
    estimatedDaysMin: z.string(),
    estimatedDaysMax: z.string(),
  })
  .superRefine((data, ctx) => {
    const flatTrimmed = data.flatCharge.trim();
    if (!flatTrimmed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["flatCharge"],
        message: "Flat shipping charge is required (use 0 for free shipping).",
      });
    } else if (!isValidMoney(flatTrimmed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["flatCharge"],
        message: "Enter a valid non-negative amount (up to 2 decimal places).",
      });
    }

    const thresholdTrimmed = data.freeShippingThreshold.trim();
    if (thresholdTrimmed !== "" && !isValidMoney(thresholdTrimmed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["freeShippingThreshold"],
        message: "Enter a valid non-negative amount or leave blank.",
      });
    }

    const minTrimmed = data.estimatedDaysMin.trim();
    const maxTrimmed = data.estimatedDaysMax.trim();
    const hasMin = minTrimmed !== "";
    const hasMax = maxTrimmed !== "";

    if (hasMin !== hasMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasMin ? "estimatedDaysMax" : "estimatedDaysMin"],
        message: "Provide both minimum and maximum days, or leave both blank.",
      });
      return;
    }

    if (hasMin && hasMax) {
      let minVal: number | null = null;
      let maxVal: number | null = null;

      if (!POSITIVE_INT_REGEX.test(minTrimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["estimatedDaysMin"],
          message: `Enter a whole number between 1 and ${MAX_ESTIMATED_DAYS}.`,
        });
      } else {
        minVal = Number(minTrimmed);
        if (minVal < 1 || minVal > MAX_ESTIMATED_DAYS) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["estimatedDaysMin"],
            message: `Must be between 1 and ${MAX_ESTIMATED_DAYS} days.`,
          });
        }
      }

      if (!POSITIVE_INT_REGEX.test(maxTrimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["estimatedDaysMax"],
          message: `Enter a whole number between 1 and ${MAX_ESTIMATED_DAYS}.`,
        });
      } else {
        maxVal = Number(maxTrimmed);
        if (maxVal < 1 || maxVal > MAX_ESTIMATED_DAYS) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["estimatedDaysMax"],
            message: `Must be between 1 and ${MAX_ESTIMATED_DAYS} days.`,
          });
        }
      }

      if (minVal !== null && maxVal !== null && minVal > maxVal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["estimatedDaysMin"],
          message: "Minimum days cannot exceed maximum days.",
        });
      }
    }
  });

export function getShippingFormDefaults(
  setting: ShippingSetting
): ShippingSettingFormValues {
  return {
    flatCharge: setting.flatCharge,
    freeShippingThreshold: setting.freeShippingThreshold ?? "",
    estimatedDaysMin:
      setting.estimatedDaysMin === null ? "" : String(setting.estimatedDaysMin),
    estimatedDaysMax:
      setting.estimatedDaysMax === null ? "" : String(setting.estimatedDaysMax),
  };
}

export function buildUpdateShippingPayload(
  values: ShippingSettingFormValues
): UpdateShippingSettingInput {
  const thresholdTrimmed = values.freeShippingThreshold.trim();
  const minTrimmed = values.estimatedDaysMin.trim();
  const maxTrimmed = values.estimatedDaysMax.trim();

  return {
    flatCharge: values.flatCharge.trim(),
    freeShippingThreshold: thresholdTrimmed === "" ? null : thresholdTrimmed,
    estimatedDaysMin: minTrimmed === "" ? null : Number(minTrimmed),
    estimatedDaysMax: maxTrimmed === "" ? null : Number(maxTrimmed),
  };
}
