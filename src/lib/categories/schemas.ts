import { z } from "zod";

export const ALLOWED_CATEGORY_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_CATEGORY_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required.")
    .max(120, "Category name must not exceed 120 characters."),
  slug: z
    .string()
    .trim()
    .max(150, "Slug must not exceed 150 characters."),
  parentId: z.string().trim(),
  description: z
    .string()
    .trim()
    .max(5000, "Description must not exceed 5000 characters."),
  isActive: z.boolean(),
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
  seoTitle: z
    .string()
    .trim()
    .max(160, "SEO title must not exceed 160 characters."),
  seoDescription: z
    .string()
    .trim()
    .max(320, "SEO description must not exceed 320 characters."),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function validateCategoryImageFile(file: File): string | null {
  if (
    !ALLOWED_CATEGORY_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_CATEGORY_IMAGE_TYPES)[number]
    )
  ) {
    return "Image must be a JPEG, PNG, WebP, or AVIF file.";
  }

  if (file.size > MAX_CATEGORY_IMAGE_BYTES) {
    return "Image size must not exceed 5 MB.";
  }

  return null;
}
