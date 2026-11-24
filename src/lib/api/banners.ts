import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  Banner,
  BannerItemData,
  BannerListData,
  BannerListQuery,
  CreateBannerInput,
  DeleteBannerData,
  ReorderBannerItem,
  ReorderBannersData,
  UpdateBannerInput,
} from "@/types/banner";

function buildBannerFormData(
  input: CreateBannerInput | UpdateBannerInput
): FormData {
  const formData = new FormData();

  if (input.title !== undefined) {
    formData.append("title", input.title);
  }
  if (input.subtitle !== undefined) {
    formData.append("subtitle", input.subtitle ?? "");
  }
  if (input.badgeText !== undefined) {
    formData.append("badgeText", input.badgeText ?? "");
  }
  if (input.altText !== undefined) {
    formData.append("altText", input.altText ?? "");
  }
  if (input.ctaLabel !== undefined) {
    formData.append("ctaLabel", input.ctaLabel ?? "");
  }
  if (input.ctaUrl !== undefined) {
    formData.append("ctaUrl", input.ctaUrl ?? "");
  }
  if (input.placement !== undefined) {
    formData.append("placement", input.placement);
  }
  if (input.sortOrder !== undefined) {
    formData.append("sortOrder", String(input.sortOrder));
  }
  if (input.isActive !== undefined) {
    formData.append("isActive", String(input.isActive));
  }
  if (input.startsAt !== undefined) {
    formData.append("startsAt", input.startsAt ?? "");
  }
  if (input.endsAt !== undefined) {
    formData.append("endsAt", input.endsAt ?? "");
  }
  if ("removeMobileImage" in input && input.removeMobileImage !== undefined) {
    formData.append("removeMobileImage", String(input.removeMobileImage));
  }
  if (input.image) {
    formData.append("image", input.image);
  }
  if (input.mobileImage) {
    formData.append("mobileImage", input.mobileImage);
  }

  return formData;
}

export async function listBanners(
  query: BannerListQuery = {}
): Promise<BannerListData> {
  const params: Record<string, string | number> = {};

  if (query.page !== undefined) params.page = query.page;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.search && query.search.trim() !== "") {
    params.search = query.search.trim();
  }
  if (query.placement) params.placement = query.placement;
  if (query.isActive !== undefined) {
    params.isActive = String(query.isActive);
  }
  if (query.scheduleStatus) {
    params.scheduleStatus = query.scheduleStatus;
  }

  const response = await apiClient.get<ApiSuccessResponse<BannerListData>>(
    "/banners",
    { params }
  );
  return response.data.data;
}

export async function getBannerById(id: string): Promise<Banner> {
  const response = await apiClient.get<ApiSuccessResponse<BannerItemData>>(
    `/banners/${id}`
  );
  return response.data.data.banner;
}

export async function createBanner(input: CreateBannerInput): Promise<Banner> {
  const formData = buildBannerFormData(input);
  const response = await apiClient.post<ApiSuccessResponse<BannerItemData>>(
    "/banners",
    formData
  );
  return response.data.data.banner;
}

export async function updateBanner(
  id: string,
  input: UpdateBannerInput
): Promise<Banner> {
  if (input.image || input.mobileImage) {
    const formData = buildBannerFormData(input);
    const response = await apiClient.patch<ApiSuccessResponse<BannerItemData>>(
      `/banners/${id}`,
      formData
    );
    return response.data.data.banner;
  }

  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = input.title;
  if (input.subtitle !== undefined) payload.subtitle = input.subtitle;
  if (input.badgeText !== undefined) payload.badgeText = input.badgeText;
  if (input.altText !== undefined) payload.altText = input.altText;
  if (input.ctaLabel !== undefined) payload.ctaLabel = input.ctaLabel;
  if (input.ctaUrl !== undefined) payload.ctaUrl = input.ctaUrl;
  if (input.placement !== undefined) payload.placement = input.placement;
  if (input.sortOrder !== undefined) payload.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) payload.isActive = input.isActive;
  if (input.startsAt !== undefined) payload.startsAt = input.startsAt;
  if (input.endsAt !== undefined) payload.endsAt = input.endsAt;
  if (input.removeMobileImage !== undefined) {
    payload.removeMobileImage = input.removeMobileImage;
  }

  const response = await apiClient.patch<ApiSuccessResponse<BannerItemData>>(
    `/banners/${id}`,
    payload
  );
  return response.data.data.banner;
}

export async function updateBannerStatus(
  id: string,
  isActive: boolean
): Promise<Banner> {
  const response = await apiClient.patch<ApiSuccessResponse<BannerItemData>>(
    `/banners/${id}/status`,
    { isActive }
  );
  return response.data.data.banner;
}

export async function reorderBanners(
  items: ReorderBannerItem[]
): Promise<Banner[]> {
  const response = await apiClient.patch<
    ApiSuccessResponse<ReorderBannersData>
  >("/banners/reorder", { items });
  return response.data.data.items;
}

export async function deleteBanner(id: string): Promise<DeleteBannerData> {
  const response = await apiClient.delete<
    ApiSuccessResponse<DeleteBannerData>
  >(`/banners/${id}`);
  return response.data.data;
}
