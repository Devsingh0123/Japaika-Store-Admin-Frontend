"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/common/form-field";
import { ImageUploadField } from "@/components/common/image-upload-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCategoryMutation,
  useRootCategoriesQuery,
  useUpdateCategoryMutation,
} from "@/hooks/use-categories";
import { ApiError } from "@/lib/api/error";
import {
  categoryFormSchema,
  validateCategoryImageFile,
  type CategoryFormValues,
} from "@/lib/categories/schemas";
import { applyApiValidationErrors, zodResolver } from "@/lib/forms/zod";
import type { Category } from "@/types/category";

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  defaultParentId?: string | null;
}

function slugifyPreview(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDefaultValues(
  category: Category | null,
  defaultParentId?: string | null
): CategoryFormValues {
  if (!category) {
    return {
      name: "",
      slug: "",
      parentId: defaultParentId ?? "",
      description: "",
      isActive: true,
      sortOrder: "0",
      seoTitle: "",
      seoDescription: "",
    };
  }

  return {
    name: category.name,
    slug: category.slug,
    parentId: category.parentId ?? "",
    description: category.description ?? "",
    isActive: category.isActive,
    sortOrder: String(category.sortOrder ?? 0),
    seoTitle: category.seoTitle ?? "",
    seoDescription: category.seoDescription ?? "",
  };
}

interface CategoryFormBodyProps {
  category: Category | null;
  defaultParentId?: string | null;
  onClose: () => void;
}

function CategoryFormBody({
  category,
  defaultParentId,
  onClose,
}: CategoryFormBodyProps) {
  const isEditing = category !== null;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [seoExpanded, setSeoExpanded] = useState(
    Boolean(category?.seoTitle || category?.seoDescription)
  );

  const rootCategoriesQuery = useRootCategoriesQuery(true);
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: getDefaultValues(category, defaultParentId),
  });

  const nameValue = useWatch({ control, name: "name" }) ?? "";
  const slugValue = useWatch({ control, name: "slug" }) ?? "";
  const seoTitleValue = useWatch({ control, name: "seoTitle" }) ?? "";
  const seoDescriptionValue =
    useWatch({ control, name: "seoDescription" }) ?? "";

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const handleSelectFile = (file: File) => {
    setImageError(null);

    const validationMessage = validateCategoryImageFile(file);
    if (validationMessage) {
      setImageError(validationMessage);
      return;
    }

    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setSelectedFile(file);
    setRemoveExistingImage(false);
  };

  const handleRemoveImage = () => {
    setImageError(null);
    setSelectedFile(null);
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (category?.imageUrl) {
      setRemoveExistingImage(true);
    }
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setFormError(null);
    setImageError(null);

    const parsedSortOrder =
      values.sortOrder.trim() === "" ? 0 : Number(values.sortOrder.trim());

    const commonFields = {
      name: values.name.trim(),
      slug: values.slug.trim() || undefined,
      parentId: values.parentId.trim() || null,
      description: values.description.trim() || null,
      isActive: values.isActive,
      sortOrder: parsedSortOrder,
      seoTitle: values.seoTitle.trim() || null,
      seoDescription: values.seoDescription.trim() || null,
      image: selectedFile,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: category.id,
          input: {
            ...commonFields,
            removeImage:
              !selectedFile && removeExistingImage ? true : undefined,
          },
        });
      } else {
        await createMutation.mutateAsync(commonFields);
      }

      onClose();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.code === "CATEGORY_SLUG_EXISTS") {
          setError("slug", {
            type: "server",
            message: "This slug is already in use by another category.",
          });
          return;
        }
        if (
          error.code === "INVALID_CATEGORY_HIERARCHY" ||
          error.code === "PARENT_CATEGORY_NOT_FOUND"
        ) {
          setError("parentId", { type: "server", message: error.message });
          return;
        }
        if (error.code === "INVALID_IMAGE_FILE") {
          setImageError(error.message);
          return;
        }
        if (applyApiValidationErrors(error, setError)) {
          return;
        }
        setFormError(error.message);
        return;
      }

      setFormError("Unable to save category. Try again.");
    }
  };

  const pending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const availableParents = (rootCategoriesQuery.data?.items ?? []).filter(
    (item) => item.id !== category?.id
  );

  const previewUrl =
    localPreviewUrl ??
    (!removeExistingImage ? category?.imageUrl ?? null : null);

  const computedSlugPreview =
    slugValue.trim() || slugifyPreview(nameValue) || "category-slug";

  return (
    <>
      <DialogHeader>
        <div className="space-y-1">
          <DialogTitle>
            {isEditing
              ? "Edit category"
              : defaultParentId
                ? "New subcategory"
                : "New category"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update category hierarchy, visibility, media, and SEO metadata."
              : "Create a top-level category or nest it beneath an existing parent category."}
          </DialogDescription>
        </div>

        <DialogClose
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close modal"
              disabled={pending}
              className="cursor-pointer"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          }
        />
      </DialogHeader>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {formError ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive-muted px-3.5 py-3 text-xs leading-5 font-medium text-destructive"
            >
              <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p>{formError}</p>
            </div>
          ) : null}

          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-foreground">
              General details
            </h3>

            <FormField
              htmlFor="category-name"
              label="Category name"
              required
              error={errors.name?.message}
              errorId="category-name-error"
            >
              <Input
                id="category-name"
                placeholder="e.g. Natural Gemstones"
                disabled={pending}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? "category-name-error" : undefined
                }
                {...register("name")}
              />
            </FormField>

            <FormField
              htmlFor="category-slug"
              label="URL slug"
              hint={`Storefront path: /categories/${computedSlugPreview}`}
              hintId="category-slug-help"
              error={errors.slug?.message}
              errorId="category-slug-error"
            >
              <Input
                id="category-slug"
                placeholder="Auto-generated from name"
                disabled={pending}
                aria-invalid={Boolean(errors.slug)}
                aria-describedby={
                  errors.slug ? "category-slug-error" : "category-slug-help"
                }
                className="font-mono text-xs"
                {...register("slug")}
              />
            </FormField>

            <FormField
              htmlFor="category-description"
              label="Description"
              error={errors.description?.message}
              errorId="category-description-error"
            >
              <Textarea
                id="category-description"
                rows={3}
                placeholder="Concise editorial summary for this category"
                disabled={pending}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "category-description-error" : undefined
                }
                {...register("description")}
              />
            </FormField>
          </section>

          <section className="space-y-4 border-t border-border pt-5">
            <h3 className="text-xs font-semibold text-foreground">
              Hierarchy &amp; visibility
            </h3>

            <div className="grid gap-4 sm:grid-cols-[1fr_132px]">
              <FormField
                htmlFor="category-parent"
                label="Parent category"
                hint="Select a top-level category to create a subcategory."
                hintId="category-parent-help"
                error={errors.parentId?.message}
                errorId="category-parent-error"
              >
                <Select
                  id="category-parent"
                  disabled={pending || rootCategoriesQuery.isLoading}
                  aria-invalid={Boolean(errors.parentId)}
                  aria-describedby={
                    errors.parentId
                      ? "category-parent-error"
                      : "category-parent-help"
                  }
                  {...register("parentId")}
                >
                  <option value="">None (Top-level category)</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                htmlFor="category-sort-order"
                label="Sort order"
                error={errors.sortOrder?.message}
                errorId="category-sort-error"
              >
                <Input
                  id="category-sort-order"
                  type="number"
                  inputMode="numeric"
                  step={1}
                  disabled={pending}
                  aria-invalid={Boolean(errors.sortOrder)}
                  aria-describedby={
                    errors.sortOrder ? "category-sort-error" : undefined
                  }
                  className="tabular-nums"
                  {...register("sortOrder")}
                />
              </FormField>
            </div>

            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/60 px-4 py-3">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="category-active"
                      className="cursor-pointer text-[0.8125rem]"
                    >
                      Active status
                    </Label>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Active categories appear in storefront navigation and
                      catalog filters.
                    </p>
                  </div>
                  <Switch
                    id="category-active"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    disabled={pending}
                    aria-label="Active status"
                  />
                </div>
              )}
            />
          </section>

          <section className="space-y-3 border-t border-border pt-5">
            <h3 className="text-xs font-semibold text-foreground">
              Category image
            </h3>
            <ImageUploadField
              id="category-image"
              previewUrl={previewUrl}
              fileName={selectedFile?.name ?? null}
              fileSizeBytes={selectedFile?.size ?? null}
              error={imageError}
              disabled={pending}
              onSelectFile={handleSelectFile}
              onRemoveImage={handleRemoveImage}
            />
          </section>

          <section className="border-t border-border pt-5">
            <button
              type="button"
              onClick={() => setSeoExpanded((prev) => !prev)}
              aria-expanded={seoExpanded}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md py-1 text-left text-xs font-semibold text-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>Search engine metadata (optional)</span>
              {seoExpanded ? (
                <ChevronDown
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <ChevronRight
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </button>

            {seoExpanded ? (
              <div className="mt-4 space-y-4">
                <FormField
                  htmlFor="category-seo-title"
                  label="SEO title"
                  meta={`${seoTitleValue.length}/160`}
                  error={errors.seoTitle?.message}
                >
                  <Input
                    id="category-seo-title"
                    placeholder="e.g. Certified Natural Gemstones"
                    disabled={pending}
                    aria-invalid={Boolean(errors.seoTitle)}
                    {...register("seoTitle")}
                  />
                </FormField>

                <FormField
                  htmlFor="category-seo-description"
                  label="SEO description"
                  meta={`${seoDescriptionValue.length}/320`}
                  error={errors.seoDescription?.message}
                >
                  <Textarea
                    id="category-seo-description"
                    rows={2}
                    placeholder="Concise search snippet describing this category"
                    disabled={pending}
                    aria-invalid={Boolean(errors.seoDescription)}
                    {...register("seoDescription")}
                  />
                </FormField>
              </div>
            ) : null}
          </section>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={pending}
            className="cursor-pointer"
          >
            {pending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                {isEditing ? "Saving..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Save changes"
            ) : (
              "Create category"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function CategoryFormModal({
  open,
  onOpenChange,
  category,
  defaultParentId = null,
}: CategoryFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="modal" className="max-w-2xl">
        {open ? (
          <CategoryFormBody
            key={`${category?.id ?? "create"}-${defaultParentId ?? "root"}`}
            category={category}
            defaultParentId={defaultParentId}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
