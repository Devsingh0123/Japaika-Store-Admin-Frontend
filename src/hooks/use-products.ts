"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/error";
import {
  addProductMedia,
  createProduct,
  deleteProduct,
  deleteProductCertificate,
  deleteProductMedia,
  getProductById,
  listProducts,
  updateProduct,
  updateProductMedia,
  updateProductStatus,
  updateVariantStock,
  upsertProductCertificate,
} from "@/lib/api/products";
import type {
  CreateProductInput,
  ProductListQuery,
  ProductStatus,
  UpdateProductMediaInput,
  UpdateProductPayload,
  UpdateVariantStockInput,
  UpsertProductCertificateInput,
} from "@/types/product";

export const PRODUCTS_QUERY_KEY = ["products"] as const;

export function productDetailQueryKey(id: string) {
  return [...PRODUCTS_QUERY_KEY, "detail", id] as const;
}

export function useProductsQuery(query: ProductListQuery, enabled = true) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, "list", query],
    queryFn: () => listProducts(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useProductQuery(id: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: productDetailQueryKey(id ?? ""),
    queryFn: () => getProductById(id as string),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success(
        product.status === "active"
          ? `Published "${product.name}"`
          : `Saved draft "${product.name}"`
      );
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateProductPayload;
    }) => updateProduct(id, payload),
    onSuccess: (product) => {
      queryClient.setQueryData(productDetailQueryKey(product.id), product);
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success(`Saved changes to "${product.name}"`);
    },
  });
}

export function useUpdateProductStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) =>
      updateProductStatus(id, status),
    onSuccess: (product) => {
      queryClient.setQueryData(productDetailQueryKey(product.id), product);
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      const actionLabel =
        product.status === "active"
          ? "Published"
          : product.status === "archived"
            ? "Archived"
            : "Moved to draft";
      toast.success(`${actionLabel} "${product.name}"`);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to update product status.";
      toast.error(message);
    },
  });
}

export function useUpdateVariantStockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      input,
    }: {
      productId: string;
      variantId: string;
      input: UpdateVariantStockInput;
    }) => updateVariantStock(productId, variantId, input),
    onSuccess: (_variant, variables) => {
      queryClient.invalidateQueries({
        queryKey: productDetailQueryKey(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success("Variant stock updated");
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: (_data, deletedId) => {
      queryClient.removeQueries({
        queryKey: productDetailQueryKey(deletedId),
      });
      queryClient.invalidateQueries({
        queryKey: [...PRODUCTS_QUERY_KEY, "list"],
      });
      toast.success("Product deleted");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to delete product right now.";
      toast.error(message);
    },
  });
}

export function useAddProductMediaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      files,
      altText,
    }: {
      productId: string;
      files: File[];
      altText?: string;
    }) => addProductMedia(productId, files, altText),
    onSuccess: (media, variables) => {
      queryClient.invalidateQueries({
        queryKey: productDetailQueryKey(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success(
        `Uploaded ${variables.files.length} media ${
          variables.files.length === 1 ? "file" : "files"
        } (${media.length} total)`
      );
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to upload product media.";
      toast.error(message);
    },
  });
}

export function useUpdateProductMediaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      mediaId,
      input,
    }: {
      productId: string;
      mediaId: string;
      input: UpdateProductMediaInput;
    }) => updateProductMedia(productId, mediaId, input),
    onSuccess: (_item, variables) => {
      queryClient.invalidateQueries({
        queryKey: productDetailQueryKey(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success(
        variables.input.isPrimary
          ? "Primary product image updated"
          : "Media details updated"
      );
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to update media item.";
      toast.error(message);
    },
  });
}

export function useDeleteProductMediaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      mediaId,
    }: {
      productId: string;
      mediaId: string;
    }) => deleteProductMedia(productId, mediaId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: productDetailQueryKey(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success("Media item removed");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to remove media item.";
      toast.error(message);
    },
  });
}

export function useUpsertProductCertificateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: UpsertProductCertificateInput;
    }) => upsertProductCertificate(productId, input),
    onSuccess: (_cert, variables) => {
      queryClient.invalidateQueries({
        queryKey: productDetailQueryKey(variables.productId),
      });
      toast.success(
        variables.input.file
          ? "Authenticity certificate uploaded"
          : "Certificate label updated"
      );
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to save certificate.";
      toast.error(message);
    },
  });
}

export function useDeleteProductCertificateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => deleteProductCertificate(productId),
    onSuccess: (_data, productId) => {
      queryClient.invalidateQueries({
        queryKey: productDetailQueryKey(productId),
      });
      toast.success("Certificate removed");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to remove certificate.";
      toast.error(message);
    },
  });
}
