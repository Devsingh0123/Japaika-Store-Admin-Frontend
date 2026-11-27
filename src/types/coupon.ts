import type { PaginationMeta } from "@/types/api";

export type CouponDiscountType = "percentage";

export type CouponVisibility = "public" | "hidden";

export type CouponEffectiveStatus =
  | "active"
  | "inactive"
  | "expired"
  | "exhausted";

export type CouponSortBy =
  | "createdAt"
  | "updatedAt"
  | "code"
  | "discountPercentage"
  | "expiresAt"
  | "redemptionCount";

export type CouponSortOrder = "asc" | "desc";

export interface CouponMoneyMap {
  INR: string;
  USD: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: CouponDiscountType;
  discountPercentage: string;
  minCartSubtotal: CouponMoneyMap;
  maxDiscount: CouponMoneyMap | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  remainingRedemptions: number | null;
  visibility: CouponVisibility;
  isActive: boolean;
  expiresAt: string | null;
  isExpired: boolean;
  isExhausted: boolean;
  effectiveStatus: CouponEffectiveStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CouponListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  visibility?: CouponVisibility;
  status?: CouponEffectiveStatus;
  sortBy?: CouponSortBy;
  sortOrder?: CouponSortOrder;
}

export interface CouponListData {
  items: Coupon[];
  pagination: PaginationMeta;
}

export interface CouponItemData {
  coupon: Coupon;
}

export interface DeleteCouponData {
  id: string;
  deleted: boolean;
}

export interface CreateCouponInput {
  code: string;
  description?: string | null;
  discountPercentage: number | string;
  minCartSubtotal: {
    INR: number | string;
    USD: number | string;
  };
  maxDiscount?: {
    INR: number | string;
    USD: number | string;
  } | null;
  maxRedemptions?: number | null;
  visibility?: CouponVisibility;
  isActive?: boolean;
  expiresAt?: string | null;
}

export interface UpdateCouponInput {
  code?: string;
  description?: string | null;
  discountPercentage?: number | string;
  minCartSubtotal?: {
    INR: number | string;
    USD: number | string;
  };
  maxDiscount?: {
    INR: number | string;
    USD: number | string;
  } | null;
  maxRedemptions?: number | null;
  visibility?: CouponVisibility;
  isActive?: boolean;
  expiresAt?: string | null;
}
