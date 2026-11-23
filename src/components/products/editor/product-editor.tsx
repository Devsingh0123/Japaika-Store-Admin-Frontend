"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  FileEdit,
  Loader2,
  Save,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/common/form-field";
import { PageHeader } from "@/components/common/page-header";
import { DeleteProductDialog } from "@/components/products/delete-product-dialog";
import { ProductCertificateSection } from "@/components/products/editor/product-certificate-section";
import {
  buildProductPayload,
  getProductFormDefaultValues,
} from "@/components/products/editor/product-form-helpers";
import { ProductMediaSection } from "@/components/products/editor/product-media-section";
import { ProductSpecificationsSection } from "@/components/products/editor/product-specifications-section";
import { ProductVariantsSection } from "@/components/products/editor/product-variants-section";
import { ProductStatusBadge } from "@/components/products/product-status-badge";
import { QuickStockModal } from "@/components/products/quick-stock-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useCategoryTreeQuery } from "@/hooks/use-categories";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductStatusMutation,
} from "@/hooks/use-products";
import { ApiError } from "@/lib/api/error";
import { formatDateTime } from "@/lib/format";
import { applyApiValidationErrors, zodResolver } from "@/lib/forms/zod";
import {
  ALLOWED_GST_RATES,
  isImageMimeType,
  productFormSchema,
  slugifyProductName,
  type ProductFormValues,
} from "@/lib/products/schemas";
import type { AdminRole } from "@/types/api";
import type { ProductDetail, ProductStatus } from "@/types/product";

const CATALOG_WRITE_ROLES: readonly AdminRole[] = [
  "super_admin",
  "catalog_manager",
];

const STOCK_UPDATE_ROLES: readonly AdminRole[] = [
  "super_admin",
  "catalog_manager",
  "operations_manager",
];

interface ProductEditorProps {
  mode: "create" | "edit";
  product?: ProductDetail;
}

export function ProductEditor({ mode, product }: ProductEditorProps) {
  const router = useRouter();
  const { hasRole } = useAuth();
  const canWriteCatalog = hasRole(CATALOG_WRITE_ROLES);
  const canUpdateStock = hasRole(STOCK_UPDATE_ROLES);
  const canEdit = canWriteCatalog;

  const [queuedMediaFiles, setQueuedMediaFiles] = useState<File[]>([]);
  const [queuedCertificateFile, setQueuedCertificateFile] =
    useState<File | null>(null);
  const [seoOpen, setSeoOpen] = useState(
    Boolean(product?.seoTitle || product?.seoDescription)
  );
  const [guidanceOpen, setGuidanceOpen] = useState(
    Boolean(
      product?.traditionalSignificance ||
        product?.wearingInstructions ||
        product?.careInstructions
    )
  );
  const [submitBanner, setSubmitBanner] = useState<{
    title: string;
    issues: string[];
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "draft" | "active" | "save" | null
  >(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  const categoriesTreeQuery = useCategoryTreeQuery({}, true);
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const statusMutation = useUpdateProductStatusMutation();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: getProductFormDefaultValues(product),
  });

  const watchedName = useWatch({ control, name: "name" }) ?? "";
  const watchedSlug = useWatch({ control, name: "slug" }) ?? "";
  const watchedCategoryId = useWatch({ control, name: "categoryId" }) ?? "";
  const watchedProductType = useWatch({ control, name: "productType" });
  const watchedVariantOptions =
    useWatch({ control, name: "variantOptions" }) ?? [];
  const watchedVariants = useWatch({ control, name: "variants" }) ?? [];
  const watchedCertificateLabel =
    useWatch({ control, name: "certificateLabel" }) ?? "";
  const watchedSeoTitle = useWatch({ control, name: "seoTitle" }) ?? "";
  const watchedSeoDesc = useWatch({ control, name: "seoDescription" }) ?? "";

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    statusMutation.isPending;

  const slugPlaceholder =
    slugifyProductName(watchedName) || "auto-generated-from-name";

  // Live Publish Readiness Indicators
  const imageCount =
    mode === "create"
      ? queuedMediaFiles.filter((f) => isImageMimeType(f.type)).length
      : (product?.media ?? []).filter((m) => m.mediaType === "image").length;

  const hasActivePricedVariant = watchedVariants.some(
    (v) => v.isActive && Number(v.price) > 0
  );

  const hasValidVariantOptions =
    watchedProductType === "simple" ||
    watchedVariantOptions.some(
      (opt) => opt.name.trim().length > 0 && opt.values.length > 0
    );

  const publishChecklist = [
    {
      label: "Active category assigned",
      ready: watchedCategoryId.trim().length > 0,
    },
    {
      label: "At least 1 product image",
      ready: imageCount >= 1,
    },
    {
      label: "Active variant priced > ₹0",
      ready: hasActivePricedVariant,
    },
    ...(watchedProductType === "variant"
      ? [
          {
            label: "Variant options defined",
            ready: hasValidVariantOptions,
          },
        ]
      : []),
  ];

  const handleApiError = (error: unknown) => {
    if (error instanceof ApiError) {
      applyApiValidationErrors(error, setError);

      if (error.code === "PUBLISH_VALIDATION_FAILED") {
        const issues =
          error.details.length > 0
            ? error.details.map((d) => d.message)
            : [error.message];
        setSubmitBanner({
          title: "Product cannot be published yet",
          issues,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (error.code === "PRODUCT_SLUG_EXISTS") {
        setError("slug", { type: "server", message: error.message });
      }

      setSubmitBanner({
        title: "Unable to save product",
        issues:
          error.details.length > 0
            ? error.details.map((d) => d.message)
            : [error.message],
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitBanner({
      title: "Unable to save product",
      issues: ["An unexpected error occurred. Please try again."],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitFormWithStatus = (
    targetStatus?: ProductStatus,
    actionKind: "draft" | "active" | "save" = "save"
  ) =>
    handleSubmit(async (values) => {
      if (!canEdit) return;
      setSubmitBanner(null);
      setPendingAction(actionKind);

      try {
        const payload = buildProductPayload(values, targetStatus);

        if (mode === "create") {
          const created = await createMutation.mutateAsync({
            payload,
            mediaFiles: queuedMediaFiles,
            certificateFile: queuedCertificateFile,
          });
          router.push(`/products/${created.id}`);
        } else if (product) {
          await updateMutation.mutateAsync({
            id: product.id,
            payload,
          });
        }
      } catch (error: unknown) {
        handleApiError(error);
      } finally {
        setPendingAction(null);
      }
    });

  const handleQuickStatusTransition = async (nextStatus: ProductStatus) => {
    if (!canEdit || !product) return;
    setSubmitBanner(null);
    try {
      await statusMutation.mutateAsync({ id: product.id, status: nextStatus });
    } catch (error: unknown) {
      handleApiError(error);
    }
  };

  const currentStatus: ProductStatus =
    mode === "edit" && product ? product.status : "draft";

  return (
    <div className="flex flex-1 flex-col gap-6 pb-8">
      {/* Top Breadcrumb Back Link & Header */}
      <div className="space-y-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to products
        </Link>

        <PageHeader
          title={
            mode === "create"
              ? "New product"
              : product?.name ?? "Product details"
          }
          description={
            mode === "create"
              ? "Fill in product details, pricing, media, and compliance metadata. Save as a draft anytime or publish directly."
              : `/${product?.slug ?? ""}`
          }
          badge={
            <div className="flex flex-wrap items-center gap-2">
              {mode === "edit" && product ? (
                <ProductStatusBadge status={product.status} />
              ) : (
                <Badge variant="muted">New draft</Badge>
              )}
              {!canEdit ? (
                <Badge variant="outline">
                  {canUpdateStock ? (
                    <>
                      <Boxes
                        className="size-3 text-muted-foreground"
                        aria-hidden="true"
                      />
                      Stock updates only
                    </>
                  ) : (
                    <>
                      <ShieldCheck
                        className="size-3 text-muted-foreground"
                        aria-hidden="true"
                      />
                      Read-only
                    </>
                  )}
                </Badge>
              ) : null}
            </div>
          }
          actions={
            canEdit ? (
              <div className="flex flex-wrap items-center gap-2">
                {mode === "create" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={submitFormWithStatus("draft", "draft")}
                      className="h-9 cursor-pointer"
                    >
                      {pendingAction === "draft" ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Save className="size-4" aria-hidden="true" />
                      )}
                      Save draft
                    </Button>
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={submitFormWithStatus("active", "active")}
                      className="h-9 cursor-pointer shadow-[var(--shadow-xs)]"
                    >
                      {pendingAction === "active" ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Send className="size-4" aria-hidden="true" />
                      )}
                      Publish product
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => setShowDeleteDialog(true)}
                      className="h-9 cursor-pointer text-destructive hover:border-destructive/40 hover:bg-destructive-muted hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete
                    </Button>
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={submitFormWithStatus(undefined, "save")}
                      className="h-9 cursor-pointer shadow-[var(--shadow-xs)]"
                    >
                      {pendingAction === "save" ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Save className="size-4" aria-hidden="true" />
                      )}
                      Save changes
                    </Button>
                  </>
                )}
              </div>
            ) : canUpdateStock && product ? (
              <Button
                type="button"
                onClick={() => setShowStockModal(true)}
                className="h-9 cursor-pointer shadow-[var(--shadow-xs)]"
              >
                <Boxes className="size-4" aria-hidden="true" />
                Update stock
              </Button>
            ) : undefined
          }
        />
      </div>

      {/* Top Error / Publish Validation Banner */}
      {submitBanner ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/35 bg-destructive-muted p-4 text-destructive"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="space-y-1.5">
              <p className="text-sm font-semibold">{submitBanner.title}</p>
              <ul className="list-disc space-y-1 pl-4 text-xs">
                {submitBanner.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main 2-Column Layout */}
      <form
        onSubmit={submitFormWithStatus(
          mode === "create" ? "draft" : undefined,
          mode === "create" ? "draft" : "save"
        )}
        noValidate
        className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* 1. General Information */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>General information</CardTitle>
                <CardDescription>
                  Core storefront identity, URL slug, and customer-facing
                  descriptions.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Product name"
                  htmlFor="product-name"
                  required
                  error={errors.name?.message}
                >
                  <Input
                    id="product-name"
                    disabled={!canEdit}
                    placeholder="e.g. 5 Mukhi Nepali Rudraksha Bead"
                    aria-invalid={Boolean(errors.name)}
                    {...register("name")}
                  />
                </FormField>

                <FormField
                  label="URL slug"
                  htmlFor="product-slug"
                  hint={
                    watchedSlug
                      ? `Storefront path: /products/${watchedSlug}`
                      : `Auto-generated: /products/${slugPlaceholder}`
                  }
                  error={errors.slug?.message}
                >
                  <Input
                    id="product-slug"
                    disabled={!canEdit}
                    placeholder={slugPlaceholder}
                    className="font-mono text-xs"
                    aria-invalid={Boolean(errors.slug)}
                    {...register("slug")}
                  />
                </FormField>
              </div>

              <FormField
                label="Short description"
                htmlFor="product-short-desc"
                hint="Concise summary shown in product cards and quick highlights (max 500 chars)."
                error={errors.shortDescription?.message}
              >
                <Textarea
                  id="product-short-desc"
                  disabled={!canEdit}
                  rows={2}
                  placeholder="Brief highlight of authenticity, origin, or key benefits..."
                  aria-invalid={Boolean(errors.shortDescription)}
                  {...register("shortDescription")}
                />
              </FormField>

              <FormField
                label="Full description"
                htmlFor="product-description"
                error={errors.description?.message}
              >
                <Textarea
                  id="product-description"
                  disabled={!canEdit}
                  rows={5}
                  placeholder="Detailed product overview, craftsmanship, sourcing, and usage notes..."
                  aria-invalid={Boolean(errors.description)}
                  {...register("description")}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* 2. Pricing & Variants */}
          <ProductVariantsSection
            control={control}
            register={register}
            setValue={setValue}
            getValues={getValues}
            errors={errors}
            canEdit={canEdit}
            canUpdateStock={canUpdateStock}
            savedVariants={product?.variants}
            onOpenQuickStock={() => setShowStockModal(true)}
          />

          {/* 3. Unified Product Media */}
          <ProductMediaSection
            mode={mode}
            productId={product?.id}
            productStatus={product?.status}
            savedMedia={product?.media}
            queuedFiles={queuedMediaFiles}
            onQueuedFilesChange={setQueuedMediaFiles}
            canEdit={canEdit}
          />

          {/* 4. Specifications & Attributes */}
          <ProductSpecificationsSection
            control={control}
            register={register}
            errors={errors}
            canEdit={canEdit}
          />

          {/* 5. Spiritual, Wearing & Care Guidance (Collapsible) */}
          <Card>
            <CardHeader className="py-3.5">
              <button
                type="button"
                onClick={() => setGuidanceOpen((prev) => !prev)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
              >
                <div>
                  <CardTitle>Spiritual, wearing &amp; care guidance</CardTitle>
                  <CardDescription>
                    Optional traditional significance, wearing instructions, and
                    care notes.
                  </CardDescription>
                </div>
                {guidanceOpen ? (
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </button>
            </CardHeader>

            {guidanceOpen ? (
              <CardContent className="space-y-4">
                <FormField
                  label="Traditional significance"
                  htmlFor="product-significance"
                  error={errors.traditionalSignificance?.message}
                >
                  <Textarea
                    id="product-significance"
                    disabled={!canEdit}
                    rows={3}
                    placeholder="Traditional Vedic or spiritual background (optional)..."
                    {...register("traditionalSignificance")}
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Wearing instructions"
                    htmlFor="product-wearing"
                    error={errors.wearingInstructions?.message}
                  >
                    <Textarea
                      id="product-wearing"
                      disabled={!canEdit}
                      rows={3}
                      placeholder="Recommended day, energization, or wearing method..."
                      {...register("wearingInstructions")}
                    />
                  </FormField>

                  <FormField
                    label="Care instructions"
                    htmlFor="product-care"
                    error={errors.careInstructions?.message}
                  >
                    <Textarea
                      id="product-care"
                      disabled={!canEdit}
                      rows={3}
                      placeholder="Cleaning, storage, and handling recommendations..."
                      {...register("careInstructions")}
                    />
                  </FormField>
                </div>
              </CardContent>
            ) : null}
          </Card>

          {/* 6. Authenticity Certificate */}
          <ProductCertificateSection
            mode={mode}
            productId={product?.id}
            certificate={product?.certificate}
            certificateLabelValue={watchedCertificateLabel}
            onCertificateLabelChange={(val) =>
              setValue("certificateLabel", val, { shouldDirty: true })
            }
            queuedFile={queuedCertificateFile}
            onQueuedFileChange={setQueuedCertificateFile}
            canEdit={canEdit}
          />

          {/* 7. Shipping & Package Dimensions */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Shipping &amp; package dimensions</CardTitle>
                <CardDescription>
                  Optional dispatch weight, box dimensions, and special
                  packaging instructions.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  label="Weight (grams)"
                  htmlFor="shipping-weight"
                  error={errors.weightGrams?.message}
                >
                  <Input
                    id="shipping-weight"
                    type="number"
                    min={0}
                    step={1}
                    disabled={!canEdit}
                    placeholder="e.g. 120"
                    {...register("weightGrams")}
                  />
                </FormField>

                <FormField
                  label="Length (cm)"
                  htmlFor="shipping-length"
                  error={errors.lengthCm?.message}
                >
                  <Input
                    id="shipping-length"
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={!canEdit}
                    placeholder="0.0"
                    {...register("lengthCm")}
                  />
                </FormField>

                <FormField
                  label="Width (cm)"
                  htmlFor="shipping-width"
                  error={errors.widthCm?.message}
                >
                  <Input
                    id="shipping-width"
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={!canEdit}
                    placeholder="0.0"
                    {...register("widthCm")}
                  />
                </FormField>

                <FormField
                  label="Height (cm)"
                  htmlFor="shipping-height"
                  error={errors.heightCm?.message}
                >
                  <Input
                    id="shipping-height"
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={!canEdit}
                    placeholder="0.0"
                    {...register("heightCm")}
                  />
                </FormField>
              </div>

              <FormField
                label="Shipping notes"
                htmlFor="shipping-notes"
                error={errors.shippingNotes?.message}
              >
                <Textarea
                  id="shipping-notes"
                  disabled={!canEdit}
                  rows={2}
                  placeholder="e.g. Dispatch in tamper-proof velvet box with lab certificate enclosed..."
                  {...register("shippingNotes")}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* 8. SEO Metadata (Collapsible) */}
          <Card>
            <CardHeader className="py-3.5">
              <button
                type="button"
                onClick={() => setSeoOpen((prev) => !prev)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
              >
                <div>
                  <CardTitle>Search engine optimization (SEO)</CardTitle>
                  <CardDescription>
                    Optional custom meta title and meta description for search
                    listings.
                  </CardDescription>
                </div>
                {seoOpen ? (
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </button>
            </CardHeader>

            {seoOpen ? (
              <CardContent className="space-y-4">
                <FormField
                  label="SEO title"
                  htmlFor="seo-title"
                  hint={`${watchedSeoTitle.length} / 160 characters`}
                  error={errors.seoTitle?.message}
                >
                  <Input
                    id="seo-title"
                    disabled={!canEdit}
                    maxLength={160}
                    placeholder="Defaults to product name if left blank"
                    {...register("seoTitle")}
                  />
                </FormField>

                <FormField
                  label="SEO description"
                  htmlFor="seo-description"
                  hint={`${watchedSeoDesc.length} / 320 characters`}
                  error={errors.seoDescription?.message}
                >
                  <Textarea
                    id="seo-description"
                    disabled={!canEdit}
                    rows={3}
                    maxLength={320}
                    placeholder="Concise search snippet description..."
                    {...register("seoDescription")}
                  />
                </FormField>
              </CardContent>
            ) : null}
          </Card>
        </div>

        {/* RIGHT STICKY SIDEBAR */}
        <div className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          {/* Publishing & Status Card */}
          <Card>
            <CardHeader className="py-3.5">
              <CardTitle>Publishing</CardTitle>
              <ProductStatusBadge status={currentStatus} />
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Publish Readiness Checklist */}
              <div className="space-y-2 rounded-lg border border-border bg-muted/25 p-3">
                <p className="text-xs font-medium text-foreground">
                  Publish readiness
                </p>
                <ul className="space-y-1.5">
                  {publishChecklist.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center gap-2 text-xs"
                    >
                      {item.ready ? (
                        <CheckCircle2
                          className="size-3.5 shrink-0 text-success"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          className="size-3.5 shrink-0 text-muted-foreground/60"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={
                          item.ready
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status Actions (Edit Mode) */}
              {mode === "edit" && product && canEdit ? (
                <div className="space-y-2">
                  {product.status !== "active" ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => handleQuickStatusTransition("active")}
                      className="w-full cursor-pointer justify-center"
                    >
                      <CheckCircle2
                        className="size-4 text-success"
                        aria-hidden="true"
                      />
                      Publish product
                    </Button>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    {product.status !== "draft" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => handleQuickStatusTransition("draft")}
                        className="cursor-pointer"
                      >
                        <FileEdit className="size-3.5" aria-hidden="true" />
                        Move to draft
                      </Button>
                    ) : null}

                    {product.status !== "archived" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => handleQuickStatusTransition("archived")}
                        className="cursor-pointer"
                      >
                        <Archive
                          className="size-3.5 text-warning"
                          aria-hidden="true"
                        />
                        Archive
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* Timestamps */}
              {mode === "edit" && product ? (
                <dl className="space-y-1.5 border-t border-border pt-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Published</dt>
                    <dd className="tabular-nums text-foreground">
                      {formatDateTime(product.publishedAt, "Not published")}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Last updated</dt>
                    <dd className="tabular-nums text-foreground">
                      {formatDateTime(product.updatedAt, "—")}
                    </dd>
                  </div>
                </dl>
              ) : null}
            </CardContent>
          </Card>

          {/* Organization & Visibility Card */}
          <Card>
            <CardHeader className="py-3.5">
              <CardTitle>Organization</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <FormField
                label="Category"
                htmlFor="product-category"
                hint="Optional for drafts; active category required to publish."
                error={errors.categoryId?.message}
              >
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      id="product-category"
                      disabled={!canEdit}
                      aria-invalid={Boolean(errors.categoryId)}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                    >
                      <option value="">Unassigned (Draft only)</option>
                      {(categoriesTreeQuery.data?.items ?? []).map((root) => (
                        <optgroup key={root.id} label={root.name}>
                          <option value={root.id}>
                            {root.name}
                            {!root.isActive ? " (Inactive)" : ""}
                          </option>
                          {(root.subcategories ?? []).map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              ↳ {sub.name}
                              {!sub.isActive ? " (Inactive)" : ""}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </Select>
                  )}
                />
              </FormField>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/25 px-3.5 py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Featured product
                  </p>
                  <p className="text-[0.72rem] text-muted-foreground">
                    Highlight in storefront featured collections.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="isFeatured"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      disabled={!canEdit}
                      onCheckedChange={field.onChange}
                      aria-label="Featured product"
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* GST & HSN Card */}
          <Card>
            <CardHeader className="py-3.5">
              <CardTitle>Tax &amp; compliance</CardTitle>
              <Badge variant="outline" className="text-[0.65rem]">
                GST-inclusive
              </Badge>
            </CardHeader>

            <CardContent className="space-y-4">
              <FormField
                label="GST slab (%)"
                htmlFor="product-gst"
                hint="Storefront prices already include this GST percentage."
                error={errors.gstRate?.message}
              >
                <Controller
                  control={control}
                  name="gstRate"
                  render={({ field }) => (
                    <Select
                      id="product-gst"
                      disabled={!canEdit}
                      aria-invalid={Boolean(errors.gstRate)}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                    >
                      {ALLOWED_GST_RATES.map((rate) => (
                        <option key={rate} value={String(rate)}>
                          {rate}% GST
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </FormField>

              <FormField
                label="HSN code"
                htmlFor="product-hsn"
                hint="Optional 4 to 8 digit HSN classification code."
                error={errors.hsnCode?.message}
              >
                <Input
                  id="product-hsn"
                  disabled={!canEdit}
                  placeholder="e.g. 710399"
                  maxLength={8}
                  className="font-mono"
                  aria-invalid={Boolean(errors.hsnCode)}
                  {...register("hsnCode")}
                />
              </FormField>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Modals for Edit Page */}
      {mode === "edit" && product ? (
        <>
          <DeleteProductDialog
            product={showDeleteDialog ? product : null}
            onClose={() => setShowDeleteDialog(false)}
            onDeleted={() => router.push("/products")}
          />

          <QuickStockModal
            product={showStockModal ? product : null}
            onClose={() => setShowStockModal(false)}
          />
        </>
      ) : null}
    </div>
  );
}
