"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/lib/api/categories";
import { ApiError } from "@/lib/api/error";
import type {
  CategoryListQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/category";

export const CATEGORIES_QUERY_KEY = ["categories"] as const;

export function useCategoriesQuery(query: CategoryListQuery, enabled = true) {
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, "list", query],
    queryFn: () => listCategories(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCategoryTreeQuery(
  query: Pick<CategoryListQuery, "search" | "isActive">,
  enabled = true
) {
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, "tree", query],
    queryFn: () =>
      listCategories({
        tree: true,
        page: 1,
        limit: 100,
        search: query.search,
        isActive: query.isActive,
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useRootCategoriesQuery(enabled = true) {
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, "roots"],
    queryFn: () => listCategories({ parentId: "root", page: 1, limit: 100 }),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory(input),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      toast.success(`Created "${category.name}"`);
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      updateCategory(id, input),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      toast.success(`Saved "${category.name}"`);
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      toast.success("Category deleted");
    },
    onError: (error: unknown) => {
      if (
        error instanceof ApiError &&
        error.code === "CATEGORY_HAS_SUBCATEGORIES"
      ) {
        toast.error(
          "Delete or reassign subcategories under this category before deleting it."
        );
        return;
      }
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to delete category right now.";
      toast.error(message);
    },
  });
}
