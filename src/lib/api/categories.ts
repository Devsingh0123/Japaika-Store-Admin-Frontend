import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  Category,
  CategoryItemData,
  CategoryListData,
  CategoryListQuery,
  CreateCategoryInput,
  DeleteCategoryData,
  UpdateCategoryInput,
} from "@/types/category";

function buildCategoryFormData(
  input: CreateCategoryInput | UpdateCategoryInput
): FormData {
  const formData = new FormData();

  if (input.name !== undefined) {
    formData.append("name", input.name);
  }
  if (input.slug !== undefined && input.slug !== "") {
    formData.append("slug", input.slug);
  }
  if (input.parentId !== undefined) {
    formData.append("parentId", input.parentId === null ? "" : input.parentId);
  }
  if (input.description !== undefined) {
    formData.append("description", input.description ?? "");
  }
  if (input.isActive !== undefined) {
    formData.append("isActive", String(input.isActive));
  }
  if (input.sortOrder !== undefined) {
    formData.append("sortOrder", String(input.sortOrder));
  }
  if (input.seoTitle !== undefined) {
    formData.append("seoTitle", input.seoTitle ?? "");
  }
  if (input.seoDescription !== undefined) {
    formData.append("seoDescription", input.seoDescription ?? "");
  }
  if ("removeImage" in input && input.removeImage !== undefined) {
    formData.append("removeImage", String(input.removeImage));
  }
  if (input.image) {
    formData.append("image", input.image);
  }

  return formData;
}

export async function listCategories(
  query: CategoryListQuery = {}
): Promise<CategoryListData> {
  const params: Record<string, string | number | boolean> = {};

  if (query.page !== undefined) params.page = query.page;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.search && query.search.trim() !== "") {
    params.search = query.search.trim();
  }
  if (query.parentId && query.parentId !== "") {
    params.parentId = query.parentId;
  }
  if (query.isActive !== undefined) {
    params.isActive = String(query.isActive);
  }
  if (query.tree !== undefined) {
    params.tree = String(query.tree);
  }

  const response = await apiClient.get<ApiSuccessResponse<CategoryListData>>(
    "/categories",
    { params }
  );
  return response.data.data;
}

export async function createCategory(
  input: CreateCategoryInput
): Promise<Category> {
  if (input.image) {
    const formData = buildCategoryFormData(input);
    const response = await apiClient.post<ApiSuccessResponse<CategoryItemData>>(
      "/categories",
      formData
    );
    return response.data.data.category;
  }

  const payload: Record<string, unknown> = {
    name: input.name,
    parentId: input.parentId ?? null,
    description: input.description ?? null,
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? 0,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
  };

  if (input.slug && input.slug.trim() !== "") {
    payload.slug = input.slug.trim();
  }

  const response = await apiClient.post<ApiSuccessResponse<CategoryItemData>>(
    "/categories",
    payload
  );
  return response.data.data.category;
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<Category> {
  if (input.image) {
    const formData = buildCategoryFormData(input);
    const response = await apiClient.patch<
      ApiSuccessResponse<CategoryItemData>
    >(`/categories/${id}`, formData);
    return response.data.data.category;
  }

  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.slug !== undefined && input.slug.trim() !== "") {
    payload.slug = input.slug.trim();
  }
  if (input.parentId !== undefined) payload.parentId = input.parentId;
  if (input.description !== undefined) payload.description = input.description;
  if (input.isActive !== undefined) payload.isActive = input.isActive;
  if (input.sortOrder !== undefined) payload.sortOrder = input.sortOrder;
  if (input.seoTitle !== undefined) payload.seoTitle = input.seoTitle;
  if (input.seoDescription !== undefined) {
    payload.seoDescription = input.seoDescription;
  }
  if (input.removeImage !== undefined) payload.removeImage = input.removeImage;

  const response = await apiClient.patch<ApiSuccessResponse<CategoryItemData>>(
    `/categories/${id}`,
    payload
  );
  return response.data.data.category;
}

export async function deleteCategory(id: string): Promise<DeleteCategoryData> {
  const response = await apiClient.delete<
    ApiSuccessResponse<DeleteCategoryData>
  >(`/categories/${id}`);
  return response.data.data;
}
