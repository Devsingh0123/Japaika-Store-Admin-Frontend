"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
  updateCouponStatus,
} from "@/lib/api/coupons";
import { ApiError } from "@/lib/api/error";
import type {
  CouponListQuery,
  CreateCouponInput,
  UpdateCouponInput,
} from "@/types/coupon";

export const COUPONS_QUERY_KEY = ["coupons"] as const;

export function useCouponsQuery(query: CouponListQuery, enabled = true) {
  return useQuery({
    queryKey: [...COUPONS_QUERY_KEY, "list", query],
    queryFn: () => listCoupons(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCreateCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCouponInput) => createCoupon(input),
    onSuccess: (coupon) => {
      queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
      toast.success(`Created coupon "${coupon.code}"`);
    },
  });
}

export function useUpdateCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCouponInput }) =>
      updateCoupon(id, input),
    onSuccess: (coupon) => {
      queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
      toast.success(`Saved coupon "${coupon.code}"`);
    },
  });
}

export function useUpdateCouponStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateCouponStatus(id, isActive),
    onSuccess: (coupon) => {
      queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
      toast.success(
        coupon.isActive
          ? `Activated "${coupon.code}"`
          : `Deactivated "${coupon.code}"`
      );
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to update coupon status.";
      toast.error(message);
    },
  });
}

export function useDeleteCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
      toast.success("Coupon deleted");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to delete coupon right now.";
      toast.error(message);
    },
  });
}
