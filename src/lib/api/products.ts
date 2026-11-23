import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  CreateProductInput,
  DeleteCertificateData,
  DeleteProductData,
  ProductCertificate,
  ProductCertificateData,
  ProductDetail,
  ProductItemData,
  ProductListData,
  ProductListQuery,
  ProductMediaItem,
  ProductMediaItemData,
  ProductMediaListData,
  ProductStatus,
  ProductVariant,
  ProductVariantData,
  UpdateProductMediaInput,
  UpdateProductPayload,
  UpdateVariantStockInput,
  UpsertProductCertificateInput,
} from "@/types/product";

export async function listProducts(
  query: ProductListQuery = {}
): Promise<ProductListData> {
  const params: Record<string, string | number | boolean> = {};

  if (query.page !== undefined) params.page = query.page;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.search && query.search.trim() !== "") {
    params.search = query.search.trim();
  }
  if (query.status) params.status = query.status;
  if (query.categoryId) params.categoryId = query.categoryId;
  if (query.productType) params.productType = query.productType;
  if (query.isFeatured !== undefined) {
    params.isFeatured = String(query.isFeatured);
  }
  if (query.stockStatus) params.stockStatus = query.stockStatus;
  if (query.sortBy) params.sortBy = query.sortBy;
  if (query.sortOrder) params.sortOrder = query.sortOrder;

  const response = await apiClient.get<ApiSuccessResponse<ProductListData>>(
    "/products",
    { params }
  );
  return response.data.data;
}

export async function getProductById(id: string): Promise<ProductDetail> {
  const response = await apiClient.get<ApiSuccessResponse<ProductItemData>>(
    `/products/${id}`
  );
  return response.data.data.product;
}

export async function createProduct(
  input: CreateProductInput
): Promise<ProductDetail> {
  const mediaFiles = input.mediaFiles ?? [];
  const hasFiles = mediaFiles.length > 0 || Boolean(input.certificateFile);

  if (hasFiles) {
    const formData = new FormData();
    formData.append("payload", JSON.stringify(input.payload));

    for (const file of mediaFiles) {
      formData.append("media", file);
    }

    if (input.certificateFile) {
      formData.append("certificate", input.certificateFile);
    }

    const response = await apiClient.post<ApiSuccessResponse<ProductItemData>>(
      "/products",
      formData
    );
    return response.data.data.product;
  }

  const response = await apiClient.post<ApiSuccessResponse<ProductItemData>>(
    "/products",
    input.payload
  );
  return response.data.data.product;
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload
): Promise<ProductDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<ProductItemData>>(
    `/products/${id}`,
    payload
  );
  return response.data.data.product;
}

export async function updateProductStatus(
  id: string,
  status: ProductStatus
): Promise<ProductDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<ProductItemData>>(
    `/products/${id}/status`,
    { status }
  );
  return response.data.data.product;
}

export async function updateVariantStock(
  productId: string,
  variantId: string,
  input: UpdateVariantStockInput
): Promise<ProductVariant> {
  const response = await apiClient.patch<
    ApiSuccessResponse<ProductVariantData>
  >(`/products/${productId}/variants/${variantId}/stock`, input);
  return response.data.data.variant;
}

export async function deleteProduct(id: string): Promise<DeleteProductData> {
  const response = await apiClient.delete<
    ApiSuccessResponse<DeleteProductData>
  >(`/products/${id}`);
  return response.data.data;
}

export async function addProductMedia(
  productId: string,
  files: File[],
  altText?: string
): Promise<ProductMediaItem[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("media", file);
  }
  if (altText && altText.trim() !== "") {
    formData.append("altText", altText.trim());
  }

  const response = await apiClient.post<
    ApiSuccessResponse<ProductMediaListData>
  >(`/products/${productId}/media`, formData);
  return response.data.data.media;
}

export async function updateProductMedia(
  productId: string,
  mediaId: string,
  input: UpdateProductMediaInput
): Promise<ProductMediaItem> {
  const response = await apiClient.patch<
    ApiSuccessResponse<ProductMediaItemData>
  >(`/products/${productId}/media/${mediaId}`, input);
  return response.data.data.mediaItem;
}

export async function deleteProductMedia(
  productId: string,
  mediaId: string
): Promise<DeleteProductData> {
  const response = await apiClient.delete<
    ApiSuccessResponse<DeleteProductData>
  >(`/products/${productId}/media/${mediaId}`);
  return response.data.data;
}

export async function upsertProductCertificate(
  productId: string,
  input: UpsertProductCertificateInput
): Promise<ProductCertificate> {
  const formData = new FormData();
  if (input.file) {
    formData.append("certificate", input.file);
  }
  if (input.certificateLabel !== undefined) {
    formData.append("certificateLabel", input.certificateLabel ?? "");
  }

  const response = await apiClient.put<
    ApiSuccessResponse<ProductCertificateData>
  >(`/products/${productId}/certificate`, formData);
  return response.data.data.certificate;
}

export async function deleteProductCertificate(
  productId: string
): Promise<DeleteCertificateData> {
  const response = await apiClient.delete<
    ApiSuccessResponse<DeleteCertificateData>
  >(`/products/${productId}/certificate`);
  return response.data.data;
}
