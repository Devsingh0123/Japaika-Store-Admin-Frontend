import { apiClient } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  Coupon,
  CouponItemData,
  CouponListData,
  CouponListQuery,
  CreateCouponInput,
  DeleteCouponData,
  UpdateCouponInput,
} from "@/types/coupon";

export async function listCoupons(
  query: CouponListQuery = {}
): Promise<CouponListData> {
  const params: Record<string, string | number> = {};

  if (query.page !== undefined) params.page = query.page;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.search && query.search.trim() !== "") {
    params.search = query.search.trim();
  }
  if (query.isActive !== undefined) {
    params.isActive = String(query.isActive);
  }
  if (query.visibility) {
    params.visibility = query.visibility;
  }
  if (query.status) {
    params.status = query.status;
  }
  if (query.sortBy) {
    params.sortBy = query.sortBy;
  }
  if (query.sortOrder) {
    params.sortOrder = query.sortOrder;
  }

  const response = await apiClient.get<ApiSuccessResponse<CouponListData>>(
    "/coupons",
    { params }
  );
  return response.data.data;
}

export async function getCouponById(id: string): Promise<Coupon> {
  const response = await apiClient.get<ApiSuccessResponse<CouponItemData>>(
    `/coupons/${id}`
  );
  return response.data.data.coupon;
}

export async function createCoupon(input: CreateCouponInput): Promise<Coupon> {
  const response = await apiClient.post<ApiSuccessResponse<CouponItemData>>(
    "/coupons",
    input
  );
  return response.data.data.coupon;
}

export async function updateCoupon(
  id: string,
  input: UpdateCouponInput
): Promise<Coupon> {
  const response = await apiClient.patch<ApiSuccessResponse<CouponItemData>>(
    `/coupons/${id}`,
    input
  );
  return response.data.data.coupon;
}

export async function updateCouponStatus(
  id: string,
  isActive: boolean
): Promise<Coupon> {
  const response = await apiClient.patch<ApiSuccessResponse<CouponItemData>>(
    `/coupons/${id}/status`,
    { isActive }
  );
  return response.data.data.coupon;
}

export async function deleteCoupon(id: string): Promise<DeleteCouponData> {
  const response = await apiClient.delete<
    ApiSuccessResponse<DeleteCouponData>
  >(`/coupons/${id}`);
  return response.data.data;
}
