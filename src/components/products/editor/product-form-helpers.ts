import type { ProductFormValues } from "@/lib/products/schemas";
import type {
  CreateProductPayload,
  ProductDetail,
  ProductStatus,
  ProductVariantInput,
} from "@/types/product";

function toNumericString(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") {
    return "";
  }
  const num = Number(val);
  if (!Number.isFinite(num)) {
    return "";
  }
  return String(num);
}

function toNullableTrimmed(val: string): string | null {
  const trimmed = val.trim();
  return trimmed === "" ? null : trimmed;
}

function toNullableNumber(val: string): number | null {
  const trimmed = val.trim();
  if (trimmed === "") return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

export function createEmptyVariantRow(
  optionValues: Record<string, string> = {},
  isDefault = false
): ProductFormValues["variants"][number] {
  return {
    sku: "",
    title: "",
    optionValues,
    price: "",
    salePrice: "",
    stockQuantity: "0",
    lowStockThreshold: "5",
    isActive: true,
    isDefault,
  };
}

export function getProductFormDefaultValues(
  product?: ProductDetail | null
): ProductFormValues {
  if (!product) {
    return {
      name: "",
      slug: "",
      categoryId: "",
      productType: "simple",
      status: "draft",
      shortDescription: "",
      description: "",
      traditionalSignificance: "",
      wearingInstructions: "",
      careInstructions: "",
      specifications: [],
      variantOptions: [],
      gstRate: "0",
      hsnCode: "",
      certificateLabel: "",
      weightGrams: "",
      lengthCm: "",
      widthCm: "",
      heightCm: "",
      shippingNotes: "",
      isFeatured: false,
      seoTitle: "",
      seoDescription: "",
      variants: [
        {
          sku: "",
          title: "Default",
          optionValues: {},
          price: "",
          salePrice: "",
          stockQuantity: "0",
          lowStockThreshold: "5",
          isActive: true,
          isDefault: true,
        },
      ],
    };
  }

  const mappedVariants: ProductFormValues["variants"] =
    product.variants.length > 0
      ? product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          title: v.title ?? "",
          optionValues: v.optionValues ? { ...v.optionValues } : {},
          price: toNumericString(v.price),
          salePrice: toNumericString(v.salePrice),
          stockQuantity: String(v.stockQuantity),
          lowStockThreshold: String(v.lowStockThreshold),
          isActive: v.isActive,
          isDefault: v.isDefault,
        }))
      : [createEmptyVariantRow({}, true)];

  return {
    name: product.name,
    slug: product.slug,
    categoryId: product.categoryId ?? "",
    productType: product.productType,
    status: product.status,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    traditionalSignificance: product.traditionalSignificance ?? "",
    wearingInstructions: product.wearingInstructions ?? "",
    careInstructions: product.careInstructions ?? "",
    specifications: Array.isArray(product.specifications)
      ? product.specifications.map((s) => ({ key: s.key, value: s.value }))
      : [],
    variantOptions: Array.isArray(product.variantOptions)
      ? product.variantOptions.map((o) => ({
          name: o.name,
          values: [...o.values],
        }))
      : [],
    gstRate: toNumericString(product.gstRate) || "0",
    hsnCode: product.hsnCode ?? "",
    certificateLabel: product.certificate?.label ?? "",
    weightGrams:
      product.shipping.weightGrams !== null &&
      product.shipping.weightGrams !== undefined
        ? String(product.shipping.weightGrams)
        : "",
    lengthCm: toNumericString(product.shipping.lengthCm),
    widthCm: toNumericString(product.shipping.widthCm),
    heightCm: toNumericString(product.shipping.heightCm),
    shippingNotes: product.shipping.shippingNotes ?? "",
    isFeatured: product.isFeatured,
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    variants: mappedVariants,
  };
}

export function buildProductPayload(
  values: ProductFormValues,
  overrideStatus?: ProductStatus
): CreateProductPayload {
  const status = overrideStatus ?? values.status;

  const cleanedSpecs = values.specifications
    .map((s) => ({ key: s.key.trim(), value: s.value.trim() }))
    .filter((s) => s.key.length > 0 && s.value.length > 0);

  const cleanedVariantOptions =
    values.productType === "variant"
      ? values.variantOptions
          .map((opt) => ({
            name: opt.name.trim(),
            values: Array.from(
              new Set(opt.values.map((v) => v.trim()).filter(Boolean))
            ),
          }))
          .filter((opt) => opt.name.length > 0 && opt.values.length > 0)
      : null;

  let variants: ProductVariantInput[];

  if (values.productType === "simple") {
    const first = values.variants[0];
    variants = [
      {
        ...(first?.id ? { id: first.id } : {}),
        ...(first?.sku.trim() ? { sku: first.sku.trim().toUpperCase() } : {}),
        title: first?.title.trim() || "Default",
        optionValues: null,
        price: Number(first?.price || 0),
        salePrice: toNullableNumber(first?.salePrice ?? ""),
        stockQuantity: Number(first?.stockQuantity || 0),
        lowStockThreshold: Number(first?.lowStockThreshold || 5),
        isActive: first?.isActive ?? true,
        isDefault: true,
        sortOrder: 0,
      },
    ];
  } else {
    const validOptionNames = new Set(
      (cleanedVariantOptions ?? []).map((o) => o.name)
    );

    variants = values.variants.map((row, index) => {
      const filteredOptionValues: Record<string, string> = {};
      for (const [k, v] of Object.entries(row.optionValues ?? {})) {
        const cleanKey = k.trim();
        const cleanVal = v.trim();
        if (
          cleanKey &&
          cleanVal &&
          (validOptionNames.size === 0 || validOptionNames.has(cleanKey))
        ) {
          filteredOptionValues[cleanKey] = cleanVal;
        }
      }

      const fallbackTitle = Object.values(filteredOptionValues).join(" / ");

      return {
        ...(row.id ? { id: row.id } : {}),
        ...(row.sku.trim() ? { sku: row.sku.trim().toUpperCase() } : {}),
        title: row.title.trim() || fallbackTitle || `Variant ${index + 1}`,
        optionValues: filteredOptionValues,
        price: Number(row.price || 0),
        salePrice: toNullableNumber(row.salePrice),
        stockQuantity: Number(row.stockQuantity || 0),
        lowStockThreshold: Number(row.lowStockThreshold || 5),
        isActive: row.isActive,
        isDefault: row.isDefault,
        sortOrder: index,
      };
    });
  }

  const payload: CreateProductPayload = {
    name: values.name.trim(),
    categoryId: toNullableTrimmed(values.categoryId),
    productType: values.productType,
    status,
    shortDescription: toNullableTrimmed(values.shortDescription),
    description: toNullableTrimmed(values.description),
    traditionalSignificance: toNullableTrimmed(values.traditionalSignificance),
    wearingInstructions: toNullableTrimmed(values.wearingInstructions),
    careInstructions: toNullableTrimmed(values.careInstructions),
    specifications: cleanedSpecs,
    variantOptions: cleanedVariantOptions,
    gstRate: Number(values.gstRate || 0),
    hsnCode: toNullableTrimmed(values.hsnCode),
    certificateLabel: toNullableTrimmed(values.certificateLabel),
    weightGrams: toNullableNumber(values.weightGrams),
    lengthCm: toNullableNumber(values.lengthCm),
    widthCm: toNullableNumber(values.widthCm),
    heightCm: toNullableNumber(values.heightCm),
    shippingNotes: toNullableTrimmed(values.shippingNotes),
    isFeatured: values.isFeatured,
    seoTitle: toNullableTrimmed(values.seoTitle),
    seoDescription: toNullableTrimmed(values.seoDescription),
    variants,
  };

  if (values.slug.trim() !== "") {
    payload.slug = values.slug.trim().toLowerCase();
  }

  return payload;
}
