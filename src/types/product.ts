import type { PaginationMeta } from "@/types/api";

export type ProductType = "simple" | "variant";
export type ProductStatus = "draft" | "active" | "archived";
export type ProductStockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type ProductSortBy = "createdAt" | "updatedAt" | "name" | "status";
export type ProductSortOrder = "asc" | "desc";
export type ProductMediaType = "image" | "video";

export type PricingCountry = "IN" | "US";
export type PricingCurrency = "INR" | "USD";

export interface VariantMarketPrice {
  currency: PricingCurrency;
  price: number;
  salePrice: number | null;
  effectivePrice: number;
}

export type VariantPricesMap = Partial<
  Record<PricingCountry, VariantMarketPrice>
>;

export interface VariantMarketPriceInput {
  currency: PricingCurrency;
  price: number;
  salePrice?: number | null;
}

export type VariantPricesInputMap = Partial<
  Record<PricingCountry, VariantMarketPriceInput>
>;

export interface MarketPriceRange {
  currency: PricingCurrency;
  minPrice: string;
  maxPrice: string;
}

export type ProductPriceSummary = Partial<
  Record<PricingCountry, MarketPriceRange>
>;

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface ProductVariantOption {
  name: string;
  values: string[];
}

export interface ProductCategorySummary {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  isActive?: boolean;
}

export interface ProductPrimaryImage {
  id: string;
  imageUrl: string;
  altText?: string | null;
}

export interface ProductCertificate {
  url: string;
  publicId: string | null;
  resourceType: "image" | "raw" | string;
  label: string | null;
}

export interface ProductShipping {
  weightGrams: number | null;
  lengthCm: string | null;
  widthCm: string | null;
  heightCm: string | null;
  shippingNotes: string | null;
}

export interface ProductMediaItem {
  id: string;
  productId: string;
  mediaType: ProductMediaType;
  mediaUrl: string;
  mediaPublicId: string;
  thumbnailUrl: string | null;
  mimeType: string | null;
  durationSeconds: number | null;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string | null;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string | null;
  optionValues: Record<string, string> | null;
  optionSignature: string | null;
  prices: VariantPricesMap;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isDefault: boolean;
  isOutOfStock: boolean;
  isLowStock: boolean;
  isPurchasable: boolean;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  productType: ProductType;
  status: ProductStatus;
  category: ProductCategorySummary | null;
  primaryImage: ProductPrimaryImage | null;
  gstRate: string;
  hsnCode: string | null;
  isFeatured: boolean;
  variantCount: number;
  priceSummary: ProductPriceSummary;
  totalStock: number;
  hasLowStock: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail {
  id: string;
  categoryId: string | null;
  category: ProductCategorySummary | null;
  name: string;
  slug: string;
  productType: ProductType;
  status: ProductStatus;
  shortDescription: string | null;
  description: string | null;
  traditionalSignificance: string | null;
  wearingInstructions: string | null;
  careInstructions: string | null;
  specifications: ProductSpecification[];
  variantOptions: ProductVariantOption[] | null;
  gstRate: string;
  hsnCode: string | null;
  certificate: ProductCertificate | null;
  shipping: ProductShipping;
  isFeatured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  media: ProductMediaItem[];
  variants: ProductVariant[];
}

export interface ProductListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
  productType?: ProductType;
  isFeatured?: boolean;
  stockStatus?: ProductStockStatus;
  country?: PricingCountry;
  sortBy?: ProductSortBy;
  sortOrder?: ProductSortOrder;
}

export interface ProductListData {
  items: ProductListItem[];
  pagination: PaginationMeta;
}

export interface ProductItemData {
  product: ProductDetail;
}

export interface ProductVariantData {
  variant: ProductVariant;
}

export interface ProductMediaListData {
  media: ProductMediaItem[];
}

export interface ProductMediaItemData {
  mediaItem: ProductMediaItem;
}

export interface ProductCertificateData {
  certificate: ProductCertificate;
}

export interface DeleteProductData {
  id: string;
  deleted: boolean;
}

export interface DeleteCertificateData {
  deleted: boolean;
}

export interface ProductVariantInput {
  id?: string;
  sku?: string;
  title?: string | null;
  optionValues?: Record<string, string> | null;
  prices: VariantPricesInputMap;
  stockQuantity: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface CreateProductPayload {
  name: string;
  slug?: string;
  categoryId?: string | null;
  productType: ProductType;
  status: ProductStatus;
  shortDescription?: string | null;
  description?: string | null;
  traditionalSignificance?: string | null;
  wearingInstructions?: string | null;
  careInstructions?: string | null;
  specifications?: ProductSpecification[];
  variantOptions?: ProductVariantOption[] | null;
  gstRate: number;
  hsnCode?: string | null;
  certificateLabel?: string | null;
  weightGrams?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  shippingNotes?: string | null;
  isFeatured: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  variants: ProductVariantInput[];
}

export interface CreateProductInput {
  payload: CreateProductPayload;
  mediaFiles?: File[];
  certificateFile?: File | null;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface UpdateVariantStockInput {
  stockQuantity?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
}

export interface UpdateProductMediaInput {
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface UpsertProductCertificateInput {
  file?: File | null;
  certificateLabel?: string | null;
}
