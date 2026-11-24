import { z } from "zod";
import type { BannerPlacement } from "@/types/banner";

export const BANNER_PLACEMENTS = [
  "homepage_hero",
  "homepage_promo",
] as const;

export const BANNER_PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  homepage_hero: "Homepage Hero",
  homepage_promo: "Homepage Promo",
};

export const ALLOWED_BANNER_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_BANNER_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateBannerImageFile(file: File): string | null {
  if (
    !ALLOWED_BANNER_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_BANNER_IMAGE_TYPES)[number]
    )
  ) {
    return "Image must be a JPEG, PNG, WebP, or AVIF file.";
  }

  if (file.size > MAX_BANNER_IMAGE_BYTES) {
    return "Image size must not exceed 5 MB.";
  }

  return null;
}

export function isValidBannerCtaUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") {
    return true;
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export const bannerFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Banner title is required.")
      .max(160, "Banner title must not exceed 160 characters."),
    subtitle: z
      .string()
      .trim()
      .max(320, "Subtitle must not exceed 320 characters."),
    badgeText: z
      .string()
      .trim()
      .max(60, "Badge text must not exceed 60 characters."),
    altText: z
      .string()
      .trim()
      .max(160, "Alt text must not exceed 160 characters."),
    ctaLabel: z
      .string()
      .trim()
      .max(60, "CTA label must not exceed 60 characters."),
    ctaUrl: z
      .string()
      .trim()
      .max(500, "CTA URL must not exceed 500 characters.")
      .refine(isValidBannerCtaUrl, {
        message:
          'CTA URL must be a relative storefront path starting with "/" or an http(s) URL.',
      }),
    placement: z.enum(BANNER_PLACEMENTS),
    sortOrder: z
      .string()
      .trim()
      .refine(
        (val) => {
          if (val === "") return true;
          const parsed = Number(val);
          return (
            Number.isInteger(parsed) && parsed >= -10000 && parsed <= 100000
          );
        },
        { message: "Sort order must be an integer between -10000 and 100000." }
      ),
    isActive: z.boolean(),
    startsAt: z
      .string()
      .trim()
      .refine((val) => val === "" || !Number.isNaN(Date.parse(val)), {
        message: "Start time must be a valid date and time.",
      }),
    endsAt: z
      .string()
      .trim()
      .refine((val) => val === "" || !Number.isNaN(Date.parse(val)), {
        message: "End time must be a valid date and time.",
      }),
  })
  .superRefine((values, ctx) => {
    if (values.startsAt && values.endsAt) {
      const startMs = Date.parse(values.startsAt);
      const endMs = Date.parse(values.endsAt);
      if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs <= startMs) {
        ctx.addIssue({
          code: "custom",
          path: ["endsAt"],
          message: "End time must be later than start time.",
        });
      }
    }
  });

export type BannerFormValues = z.infer<typeof bannerFormSchema>;
