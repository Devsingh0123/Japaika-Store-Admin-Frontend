import type { PaginationMeta } from "@/types/api";

export type BannerPlacement = "homepage_hero" | "homepage_promo";
export type BannerScheduleStatus = "live" | "scheduled" | "expired";

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  badgeText: string | null;
  imageUrl: string;
  imagePublicId: string | null;
  mobileImageUrl: string | null;
  mobileImagePublicId: string | null;
  altText: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  placement: BannerPlacement;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  isCurrentlyLive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BannerListQuery {
  page?: number;
  limit?: number;
  search?: string;
  placement?: BannerPlacement;
  isActive?: boolean;
  scheduleStatus?: BannerScheduleStatus;
}

export interface BannerListData {
  items: Banner[];
  pagination: PaginationMeta;
}

export interface BannerItemData {
  banner: Banner;
}

export interface ReorderBannerItem {
  id: string;
  sortOrder: number;
}

export interface ReorderBannersData {
  items: Banner[];
}

export interface DeleteBannerData {
  id: string;
  deleted: boolean;
}

export interface CreateBannerInput {
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  altText?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  placement: BannerPlacement;
  sortOrder?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  image: File;
  mobileImage?: File | null;
}

export interface UpdateBannerInput {
  title?: string;
  subtitle?: string | null;
  badgeText?: string | null;
  altText?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  placement?: BannerPlacement;
  sortOrder?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  image?: File | null;
  mobileImage?: File | null;
  removeMobileImage?: boolean;
}
