import type { PaginationMeta } from "@/types/api";

export interface CategoryParentSummary {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
}

export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isActive: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: CategoryParentSummary | null;
  subcategories?: Category[];
}

export interface CategoryListQuery {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: string;
  isActive?: boolean;
  tree?: boolean;
}

export interface CategoryListData {
  items: Category[];
  pagination: PaginationMeta;
}

export interface CategoryItemData {
  category: Category;
}

export interface DeleteCategoryData {
  id: string;
  deleted: boolean;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  parentId?: string | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  image?: File | null;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  parentId?: string | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  removeImage?: boolean;
  image?: File | null;
}
