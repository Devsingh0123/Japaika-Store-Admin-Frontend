"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBanner,
  deleteBanner,
  listBanners,
  reorderBanners,
  updateBanner,
  updateBannerStatus,
} from "@/lib/api/banners";
import { ApiError } from "@/lib/api/error";
import type {
  BannerListQuery,
  CreateBannerInput,
  ReorderBannerItem,
  UpdateBannerInput,
} from "@/types/banner";

export const BANNERS_QUERY_KEY = ["banners"] as const;

export function useBannersQuery(query: BannerListQuery, enabled = true) {
  return useQuery({
    queryKey: [...BANNERS_QUERY_KEY, "list", query],
    queryFn: () => listBanners(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCreateBannerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBannerInput) => createBanner(input),
    onSuccess: (banner) => {
      queryClient.invalidateQueries({ queryKey: BANNERS_QUERY_KEY });
      toast.success(`Created banner "${banner.title}"`);
    },
  });
}

export function useUpdateBannerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBannerInput }) =>
      updateBanner(id, input),
    onSuccess: (banner) => {
      queryClient.invalidateQueries({ queryKey: BANNERS_QUERY_KEY });
      toast.success(`Saved "${banner.title}"`);
    },
  });
}

export function useUpdateBannerStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateBannerStatus(id, isActive),
    onSuccess: (banner) => {
      queryClient.invalidateQueries({ queryKey: BANNERS_QUERY_KEY });
      toast.success(
        banner.isActive
          ? `Activated "${banner.title}"`
          : `Deactivated "${banner.title}"`
      );
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to update banner status.";
      toast.error(message);
    },
  });
}

export function useReorderBannersMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: ReorderBannerItem[]) => reorderBanners(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANNERS_QUERY_KEY });
      toast.success("Banner display order updated");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to update banner display order.";
      toast.error(message);
    },
  });
}

export function useDeleteBannerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANNERS_QUERY_KEY });
      toast.success("Banner deleted");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to delete banner right now.";
      toast.error(message);
    },
  });
}
