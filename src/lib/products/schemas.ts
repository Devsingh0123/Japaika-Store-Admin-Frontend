import { z } from "zod";
import type { PricingCountry, PricingCurrency } from "@/types/product";

export const SUPPORTED_COUNTRIES = ["IN", "US"] as const;

export const SUPPORTED_MARKETS: Record<
  PricingCountry,
  {
    country: PricingCountry;
    currency: PricingCurrency;
    label: string;
    symbol: string;
    taxNote?: string;
    placeholder: string;
  }
> = {
  IN: {
    country: "IN",
    currency: "INR",
    label: "India",
    symbol: "₹",
    taxNote: "incl. GST",
    placeholder: "e.g. 4999",
  },
  US: {
    country: "US",
    currency: "USD",
    label: "USA",
    symbol: "$",
    placeholder: "e.g. 69",
  },
};

export const ALLOWED_GST_RATES = [0, 0.25, 3, 5, 12, 18, 28] as const;

export const MAX_PRODUCT_MEDIA = 10;
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PRODUCT_VIDEO_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_CERTIFICATE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_PRODUCT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const ALLOWED_PRODUCT_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
] as const;

export const ALLOWED_PRODUCT_MEDIA_TYPES = [
  ...ALLOWED_PRODUCT_IMAGE_TYPES,
  ...ALLOWED_PRODUCT_VIDEO_TYPES,
] as const;

export const ALLOWED_CERTIFICATE_TYPES = [
  ...ALLOWED_PRODUCT_IMAGE_TYPES,
  "application/pdf",
] as const;

export const PRODUCT_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const HSN_CODE_REGEX = /^[0-9]{4,8}$/;

export function isVideoMimeType(mimeType: string): boolean {
  return (ALLOWED_PRODUCT_VIDEO_TYPES as readonly string[]).includes(mimeType);
}

export function isImageMimeType(mimeType: string): boolean {
  return (ALLOWED_PRODUCT_IMAGE_TYPES as readonly string[]).includes(mimeType);
}

export function validateProductMediaFile(file: File): string | null {
  if (
    !(ALLOWED_PRODUCT_MEDIA_TYPES as readonly string[]).includes(file.type)
  ) {
    return "Only JPEG, PNG, WebP, AVIF images and MP4, WebM short videos are supported.";
  }

  if (isImageMimeType(file.type) && file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return `Image "${file.name}" exceeds the 5 MB limit.`;
  }

  if (isVideoMimeType(file.type) && file.size > MAX_PRODUCT_VIDEO_BYTES) {
    return `Video "${file.name}" exceeds the 20 MB limit.`;
  }

  return null;
}

export function validateProductCertificateFile(file: File): string | null {
  if (!(ALLOWED_CERTIFICATE_TYPES as readonly string[]).includes(file.type)) {
    return "Certificate must be a JPEG, PNG, WebP, AVIF image or PDF document.";
  }

  if (file.size > MAX_CERTIFICATE_BYTES) {
    return "Certificate file size must not exceed 5 MB.";
  }

  return null;
}

export function slugifyProductName(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220)
    .replace(/-+$/g, "");
}

function isNonNegativeDecimal(value: string): boolean {
  if (value === "") return true;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
}

function isNonNegativeInteger(value: string): boolean {
  if (value === "") return false;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0;
}

export const productSpecificationSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Attribute name is required.")
    .max(80, "Attribute name must not exceed 80 characters."),
  value: z
    .string()
    .trim()
    .min(1, "Attribute value is required.")
    .max(255, "Attribute value must not exceed 255 characters."),
});

export const productVariantOptionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Option name is required.")
    .max(60, "Option name must not exceed 60 characters."),
  values: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Option value cannot be empty.")
        .max(60, "Option value must not exceed 60 characters.")
    )
    .min(1, "Add at least one value for this option.")
    .max(30, "Maximum 30 values per option."),
});

const marketPriceFormSchema = z
  .object({
    price: z
      .string()
      .trim()
      .refine((v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0), {
        message: "Price must be a non-negative number.",
      }),
    salePrice: z
      .string()
      .trim()
      .refine((v) => v === "" || (Number.isFinite(Number(v)) && Number(v) > 0), {
        message: "Sale price must be greater than 0.",
      }),
  })
  .superRefine((entry, ctx) => {
    if (entry.salePrice !== "") {
      if (entry.price === "") {
        ctx.addIssue({
          code: "custom",
          path: ["price"],
          message: "Enter a regular price before setting a sale price.",
        });
        return;
      }

      const regular = Number(entry.price);
      const sale = Number(entry.salePrice);
      if (Number.isFinite(regular) && Number.isFinite(sale) && sale >= regular) {
        ctx.addIssue({
          code: "custom",
          path: ["salePrice"],
          message: "Sale price must be strictly less than regular price.",
        });
      }
    }
  });

export const productVariantFormSchema = z.object({
  id: z.string().optional(),
  sku: z
    .string()
    .trim()
    .max(64, "SKU must not exceed 64 characters."),
  title: z
    .string()
    .trim()
    .max(160, "Variant title must not exceed 160 characters."),
  optionValues: z.record(z.string(), z.string()),
  prices: z.object({
    IN: marketPriceFormSchema,
    US: marketPriceFormSchema,
  }),
  stockQuantity: z
    .string()
    .trim()
    .refine(isNonNegativeInteger, {
      message: "Stock must be a whole number (0 or more).",
    }),
  lowStockThreshold: z
    .string()
    .trim()
    .refine(isNonNegativeInteger, {
      message: "Threshold must be a whole number (0 or more).",
    }),
  isActive: z.boolean(),
  isDefault: z.boolean(),
});

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Product name is required.")
      .max(200, "Product name must not exceed 200 characters."),
    slug: z
      .string()
      .trim()
      .max(220, "Slug must not exceed 220 characters.")
      .refine((v) => v === "" || PRODUCT_SLUG_REGEX.test(v), {
        message: "Use lowercase letters, numbers, and single hyphens only.",
      }),
    categoryId: z.string().trim(),
    productType: z.enum(["simple", "variant"]),
    status: z.enum(["draft", "active", "archived"]),
    shortDescription: z
      .string()
      .trim()
      .max(500, "Short description must not exceed 500 characters."),
    description: z
      .string()
      .trim()
      .max(20000, "Description must not exceed 20,000 characters."),
    traditionalSignificance: z
      .string()
      .trim()
      .max(10000, "Traditional significance must not exceed 10,000 characters."),
    wearingInstructions: z
      .string()
      .trim()
      .max(10000, "Wearing instructions must not exceed 10,000 characters."),
    careInstructions: z
      .string()
      .trim()
      .max(10000, "Care instructions must not exceed 10,000 characters."),
    specifications: z
      .array(productSpecificationSchema)
      .max(50, "Maximum 50 specifications allowed."),
    variantOptions: z
      .array(productVariantOptionSchema)
      .max(5, "Maximum 5 variant options allowed."),
    gstRate: z
      .string()
      .trim()
      .refine(
        (v) =>
          (ALLOWED_GST_RATES as readonly number[]).includes(Number(v)),
        {
          message: "Select a valid Indian GST slab.",
        }
      ),
    hsnCode: z
      .string()
      .trim()
      .refine((v) => v === "" || HSN_CODE_REGEX.test(v), {
        message: "HSN code must be 4 to 8 digits.",
      }),
    certificateLabel: z
      .string()
      .trim()
      .max(160, "Certificate label must not exceed 160 characters."),
    weightGrams: z
      .string()
      .trim()
      .refine(
        (v) =>
          v === "" ||
          (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 1000000),
        { message: "Weight must be a whole number in grams." }
      ),
    lengthCm: z
      .string()
      .trim()
      .refine(isNonNegativeDecimal, {
        message: "Length must be a non-negative number.",
      }),
    widthCm: z
      .string()
      .trim()
      .refine(isNonNegativeDecimal, {
        message: "Width must be a non-negative number.",
      }),
    heightCm: z
      .string()
      .trim()
      .refine(isNonNegativeDecimal, {
        message: "Height must be a non-negative number.",
      }),
    shippingNotes: z
      .string()
      .trim()
      .max(1000, "Shipping notes must not exceed 1,000 characters."),
    isFeatured: z.boolean(),
    seoTitle: z
      .string()
      .trim()
      .max(160, "SEO title must not exceed 160 characters."),
    seoDescription: z
      .string()
      .trim()
      .max(320, "SEO description must not exceed 320 characters."),
    variants: z
      .array(productVariantFormSchema)
      .min(1, "At least one variant is required.")
      .max(100, "Maximum 100 variants per product."),
  })
  .superRefine((data, ctx) => {
    if (data.productType === "variant") {
      const optionNames = data.variantOptions
        .map((o) => o.name.trim())
        .filter(Boolean);

      const seenOptionNames = new Set<string>();
      data.variantOptions.forEach((opt, idx) => {
        const lower = opt.name.trim().toLowerCase();
        if (lower && seenOptionNames.has(lower)) {
          ctx.addIssue({
            code: "custom",
            path: ["variantOptions", idx, "name"],
            message: "Duplicate option name.",
          });
        }
        seenOptionNames.add(lower);
      });

      const seenSignatures = new Set<string>();
      const seenSkus = new Set<string>();

      data.variants.forEach((variant, idx) => {
        const normalizedSku = variant.sku.trim().toUpperCase();
        if (normalizedSku) {
          if (seenSkus.has(normalizedSku)) {
            ctx.addIssue({
              code: "custom",
              path: ["variants", idx, "sku"],
              message: `Duplicate SKU "${normalizedSku}".`,
            });
          }
          seenSkus.add(normalizedSku);
        }

        const entries = Object.entries(variant.optionValues || {})
          .map(([k, v]) => [k.trim().toLowerCase(), v.trim().toLowerCase()])
          .filter(([k, v]) => k.length > 0 && v.length > 0)
          .sort(([a], [b]) => a.localeCompare(b));

        if (entries.length === 0) {
          ctx.addIssue({
            code: "custom",
            path: ["variants", idx, "optionValues"],
            message: "Assign option values for this variant.",
          });
        } else {
          for (const optName of optionNames) {
            const found = entries.some(([k]) => k === optName.toLowerCase());
            if (!found) {
              ctx.addIssue({
                code: "custom",
                path: ["variants", idx, "optionValues"],
                message: `Select a value for "${optName}".`,
              });
            }
          }

          const sig = entries.map(([k, v]) => `${k}=${v}`).join("|");
          if (seenSignatures.has(sig)) {
            ctx.addIssue({
              code: "custom",
              path: ["variants", idx, "optionValues"],
              message: "Duplicate option combination.",
            });
          }
          seenSignatures.add(sig);
        }
      });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductVariantFormValue = z.infer<typeof productVariantFormSchema>;

export const quickStockFormSchema = z.object({
  stockQuantity: z
    .string()
    .trim()
    .refine(isNonNegativeInteger, {
      message: "Stock must be a whole number (0 or more).",
    }),
  lowStockThreshold: z
    .string()
    .trim()
    .refine(isNonNegativeInteger, {
      message: "Low-stock threshold must be a whole number (0 or more).",
    }),
  isActive: z.boolean(),
});

export type QuickStockFormValues = z.infer<typeof quickStockFormSchema>;
