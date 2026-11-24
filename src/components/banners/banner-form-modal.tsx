"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Monitor, Smartphone, X } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { BannerArtworkPreview } from "@/components/banners/banner-status-badge";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateBannerMutation,
  useUpdateBannerMutation,
} from "@/hooks/use-banners";
import { ApiError } from "@/lib/api/error";
import {
  BANNER_PLACEMENT_LABELS,
  BANNER_PLACEMENTS,
  bannerFormSchema,
  validateBannerImageFile,
  type BannerFormValues,
} from "@/lib/banners/schemas";
import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/lib/format";
import { applyApiValidationErrors, zodResolver } from "@/lib/forms/zod";
import { UPLOAD_SPECS } from "@/lib/media/upload-specs";
import type { Banner } from "@/types/banner";

interface BannerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: Banner | null;
}

function getDefaultValues(banner: Banner | null): BannerFormValues {
  if (!banner) {
    return {
      title: "",
      subtitle: "",
      badgeText: "",
      altText: "",
      ctaLabel: "",
      ctaUrl: "",
      placement: "homepage_hero",
      sortOrder: "0",
      isActive: true,
      startsAt: "",
      endsAt: "",
    };
  }

  return {
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    badgeText: banner.badgeText ?? "",
    altText: banner.altText ?? "",
    ctaLabel: banner.ctaLabel ?? "",
    ctaUrl: banner.ctaUrl ?? "",
    placement: banner.placement,
    sortOrder: String(banner.sortOrder ?? 0),
    isActive: banner.isActive,
    startsAt: toDateTimeLocalValue(banner.startsAt),
    endsAt: toDateTimeLocalValue(banner.endsAt),
  };
}

interface BannerFormBodyProps {
  banner: Banner | null;
  onClose: () => void;
}

function BannerFormBody({ banner, onClose }: BannerFormBodyProps) {
  const isEditing = banner !== null;

  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [desktopPreviewUrl, setDesktopPreviewUrl] = useState<string | null>(
    null
  );
  const [desktopImageError, setDesktopImageError] = useState<string | null>(
    null
  );

  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState<string | null>(null);
  const [removeExistingMobileImage, setRemoveExistingMobileImage] =
    useState(false);
  const [mobileImageError, setMobileImageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateBannerMutation();
  const updateMutation = useUpdateBannerMutation();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: getDefaultValues(banner),
  });

  const watchedTitle = useWatch({ control, name: "title" }) ?? "";
  const watchedSubtitle = useWatch({ control, name: "subtitle" }) ?? "";
  const watchedBadgeText = useWatch({ control, name: "badgeText" }) ?? "";
  const watchedCtaLabel = useWatch({ control, name: "ctaLabel" }) ?? "";
  const watchedAltText = useWatch({ control, name: "altText" }) ?? "";
  const watchedPlacement =
    useWatch({ control, name: "placement" }) ?? "homepage_hero";
  const watchedStartsAt = useWatch({ control, name: "startsAt" }) ?? "";
  const watchedEndsAt = useWatch({ control, name: "endsAt" }) ?? "";

  useEffect(() => {
    return () => {
      if (desktopPreviewUrl) {
        URL.revokeObjectURL(desktopPreviewUrl);
      }
    };
  }, [desktopPreviewUrl]);

  useEffect(() => {
    return () => {
      if (mobilePreviewUrl) {
        URL.revokeObjectURL(mobilePreviewUrl);
      }
    };
  }, [mobilePreviewUrl]);

  const handleSelectDesktopFile = (file: File) => {
    setDesktopImageError(null);
    const validationMessage = validateBannerImageFile(file);
    if (validationMessage) {
      setDesktopImageError(validationMessage);
      return;
    }

    setDesktopPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setDesktopFile(file);
  };

  const handleRemoveDesktopFile = () => {
    setDesktopImageError(null);
    setDesktopFile(null);
    setDesktopPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handleSelectMobileFile = (file: File) => {
    setMobileImageError(null);
    const validationMessage = validateBannerImageFile(file);
    if (validationMessage) {
      setMobileImageError(validationMessage);
      return;
    }

    setMobilePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setMobileFile(file);
    setRemoveExistingMobileImage(false);
  };

  const handleRemoveMobileFile = () => {
    setMobileImageError(null);
    setMobileFile(null);
    setMobilePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (banner?.mobileImageUrl) {
      setRemoveExistingMobileImage(true);
    }
  };

  const onSubmit = async (values: BannerFormValues) => {
    setFormError(null);
    setDesktopImageError(null);
    setMobileImageError(null);

    if (!isEditing && !desktopFile) {
      setDesktopImageError("A desktop banner image is required.");
      return;
    }

    const parsedSortOrder =
      values.sortOrder.trim() === "" ? 0 : Number(values.sortOrder.trim());

    const basePayload = {
      title: values.title.trim(),
      subtitle: values.subtitle.trim() || null,
      badgeText: values.badgeText.trim() || null,
      altText: values.altText.trim() || null,
      ctaLabel: values.ctaLabel.trim() || null,
      ctaUrl: values.ctaUrl.trim() || null,
      placement: values.placement,
      sortOrder: parsedSortOrder,
      isActive: values.isActive,
      startsAt: fromDateTimeLocalValue(values.startsAt),
      endsAt: fromDateTimeLocalValue(values.endsAt),
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: banner.id,
          input: {
            ...basePayload,
            image: desktopFile,
            mobileImage: mobileFile,
            removeMobileImage:
              !mobileFile && removeExistingMobileImage ? true : undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          ...basePayload,
          image: desktopFile as File,
          mobileImage: mobileFile,
        });
      }

      onClose();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.code === "INVALID_IMAGE_FILE") {
          setDesktopImageError(error.message);
          return;
        }
        if (applyApiValidationErrors(error, setError)) {
          return;
        }
        setFormError(error.message);
        return;
      }

      setFormError("Unable to save banner. Try again.");
    }
  };

  const pending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const activeDesktopPreviewUrl =
    desktopPreviewUrl ?? (banner?.imageUrl || null);
  const activeMobilePreviewUrl =
    mobilePreviewUrl ??
    (!removeExistingMobileImage ? banner?.mobileImageUrl ?? null : null);

  return (
    <>
      <DialogHeader>
        <div className="space-y-1">
          <DialogTitle>
            {isEditing ? "Edit banner" : "New banner"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update storefront banner artwork, headline copy, CTA link, display order, and schedule window."
              : "Create a homepage hero or promotional banner with desktop artwork and optional mobile crop."}
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

          {/* Live Storefront Preview */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-foreground">
                Live storefront preview
              </h3>

              <Tabs
                value={previewViewport}
                onValueChange={(value) =>
                  setPreviewViewport(value as "desktop" | "mobile")
                }
              >
                <TabsList aria-label="Preview viewport">
                  <TabsTrigger value="desktop">
                    <Monitor className="size-3.5" aria-hidden="true" />
                    Desktop
                  </TabsTrigger>
                  <TabsTrigger value="mobile">
                    <Smartphone className="size-3.5" aria-hidden="true" />
                    Mobile
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <BannerArtworkPreview
              title={watchedTitle}
              subtitle={watchedSubtitle}
              badgeText={watchedBadgeText}
              ctaLabel={watchedCtaLabel}
              placement={watchedPlacement}
              imageUrl={activeDesktopPreviewUrl}
              mobileImageUrl={activeMobilePreviewUrl}
              altText={watchedAltText}
              viewport={previewViewport}
            />
          </section>

          {/* Artwork Uploads */}
          <section className="space-y-4 border-t border-border pt-5">
            <h3 className="text-xs font-semibold text-foreground">
              Banner artwork
            </h3>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="banner-desktop-image">
                  Desktop image{" "}
                  {!isEditing ? (
                    <span className="text-destructive">*</span>
                  ) : null}
                </Label>
                <ImageUploadField
                  id="banner-desktop-image"
                  previewUrl={activeDesktopPreviewUrl}
                  fileName={desktopFile?.name ?? null}
                  fileSizeBytes={desktopFile?.size ?? null}
                  previewAlt="Desktop banner preview"
                  currentImageLabel="Current desktop image"
                  previewClassName="h-20 w-36"
                  allowRemove={!isEditing}
                  helperText="Wide landscape artwork for desktop screens."
                  guidelines={
                    watchedPlacement === "homepage_hero"
                      ? UPLOAD_SPECS.bannerHeroDesktop
                      : UPLOAD_SPECS.bannerPromoDesktop
                  }
                  error={desktopImageError}
                  disabled={pending}
                  onSelectFile={handleSelectDesktopFile}
                  onRemoveImage={handleRemoveDesktopFile}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="banner-mobile-image">
                  Mobile image (optional)
                </Label>
                <ImageUploadField
                  id="banner-mobile-image"
                  previewUrl={activeMobilePreviewUrl}
                  fileName={mobileFile?.name ?? null}
                  fileSizeBytes={mobileFile?.size ?? null}
                  previewAlt="Mobile banner preview"
                  currentImageLabel="Current mobile image"
                  previewClassName="h-20 w-16"
                  allowRemove
                  helperText="Optional portrait artwork for small screens."
                  guidelines={UPLOAD_SPECS.bannerMobile}
                  error={mobileImageError}
                  disabled={pending}
                  onSelectFile={handleSelectMobileFile}
                  onRemoveImage={handleRemoveMobileFile}
                />
              </div>
            </div>
          </section>

          {/* Copy & CTA */}
          <section className="space-y-4 border-t border-border pt-5">
            <h3 className="text-xs font-semibold text-foreground">
              Headline &amp; call to action
            </h3>

            <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
              <FormField
                htmlFor="banner-title"
                label="Headline title"
                required
                error={errors.title?.message}
                errorId="banner-title-error"
              >
                <Input
                  id="banner-title"
                  placeholder="e.g. Certified Ceylon Gemstones"
                  disabled={pending}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={
                    errors.title ? "banner-title-error" : undefined
                  }
                  {...register("title")}
                />
              </FormField>

              <FormField
                htmlFor="banner-badge"
                label="Badge text"
                hint="Optional eyebrow pill (max 60 chars)."
                error={errors.badgeText?.message}
              >
                <Input
                  id="banner-badge"
                  placeholder="e.g. Lab Certified"
                  disabled={pending}
                  aria-invalid={Boolean(errors.badgeText)}
                  {...register("badgeText")}
                />
              </FormField>
            </div>

            <FormField
              htmlFor="banner-subtitle"
              label="Subtitle"
              error={errors.subtitle?.message}
            >
              <Textarea
                id="banner-subtitle"
                rows={2}
                placeholder="Supporting promotional message shown beneath the headline..."
                disabled={pending}
                aria-invalid={Boolean(errors.subtitle)}
                {...register("subtitle")}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                htmlFor="banner-cta-label"
                label="CTA button label"
                error={errors.ctaLabel?.message}
              >
                <Input
                  id="banner-cta-label"
                  placeholder="e.g. Explore Collection"
                  disabled={pending}
                  aria-invalid={Boolean(errors.ctaLabel)}
                  {...register("ctaLabel")}
                />
              </FormField>

              <FormField
                htmlFor="banner-cta-url"
                label="CTA link URL"
                hint='Relative path (e.g. "/categories/gemstones") or full https:// URL.'
                error={errors.ctaUrl?.message}
              >
                <Input
                  id="banner-cta-url"
                  placeholder="/categories/gemstones"
                  disabled={pending}
                  className="font-mono text-xs"
                  aria-invalid={Boolean(errors.ctaUrl)}
                  {...register("ctaUrl")}
                />
              </FormField>
            </div>

            <FormField
              htmlFor="banner-alt"
              label="Image alt text"
              hint="Accessibility & SEO description for screen readers."
              error={errors.altText?.message}
            >
              <Input
                id="banner-alt"
                placeholder="e.g. Certified natural yellow sapphire showcase"
                disabled={pending}
                aria-invalid={Boolean(errors.altText)}
                {...register("altText")}
              />
            </FormField>
          </section>

          {/* Placement, Ordering & Schedule */}
          <section className="space-y-4 border-t border-border pt-5">
            <h3 className="text-xs font-semibold text-foreground">
              Placement, visibility &amp; schedule
            </h3>

            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <FormField
                htmlFor="banner-placement"
                label="Placement slot"
                error={errors.placement?.message}
              >
                <Controller
                  control={control}
                  name="placement"
                  render={({ field }) => (
                    <Select
                      id="banner-placement"
                      disabled={pending}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                    >
                      {BANNER_PLACEMENTS.map((placement) => (
                        <option key={placement} value={placement}>
                          {BANNER_PLACEMENT_LABELS[placement]}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </FormField>

              <FormField
                htmlFor="banner-sort-order"
                label="Sort order"
                error={errors.sortOrder?.message}
              >
                <Input
                  id="banner-sort-order"
                  type="number"
                  inputMode="numeric"
                  step={1}
                  disabled={pending}
                  className="tabular-nums"
                  aria-invalid={Boolean(errors.sortOrder)}
                  {...register("sortOrder")}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                htmlFor="banner-starts-at"
                label="Start time (optional)"
                hint="Leave blank to publish immediately when active."
                error={errors.startsAt?.message}
              >
                <div className="flex gap-1.5">
                  <Input
                    id="banner-starts-at"
                    type="datetime-local"
                    disabled={pending}
                    aria-invalid={Boolean(errors.startsAt)}
                    {...register("startsAt")}
                  />
                  {watchedStartsAt ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending}
                      onClick={() =>
                        setValue("startsAt", "", { shouldDirty: true })
                      }
                      aria-label="Clear start time"
                      className="mt-0.5 shrink-0 cursor-pointer"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </FormField>

              <FormField
                htmlFor="banner-ends-at"
                label="End time (optional)"
                hint="Leave blank for no automatic expiry."
                error={errors.endsAt?.message}
              >
                <div className="flex gap-1.5">
                  <Input
                    id="banner-ends-at"
                    type="datetime-local"
                    disabled={pending}
                    aria-invalid={Boolean(errors.endsAt)}
                    {...register("endsAt")}
                  />
                  {watchedEndsAt ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending}
                      onClick={() =>
                        setValue("endsAt", "", { shouldDirty: true })
                      }
                      aria-label="Clear end time"
                      className="mt-0.5 shrink-0 cursor-pointer"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </FormField>
            </div>

            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/60 px-4 py-3">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="banner-active"
                      className="cursor-pointer text-[0.8125rem]"
                    >
                      Active status
                    </Label>
                    <p className="text-xs leading-5 text-muted-foreground">
                      When enabled, the banner is eligible for storefront
                      display within its schedule window.
                    </p>
                  </div>
                  <Switch
                    id="banner-active"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    disabled={pending}
                    aria-label="Active status"
                  />
                </div>
              )}
            />
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
                <Loader2
                  className="size-3.5 animate-spin"
                  aria-hidden="true"
                />
                {isEditing ? "Saving..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Save changes"
            ) : (
              "Create banner"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function BannerFormModal({
  open,
  onOpenChange,
  banner,
}: BannerFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="modal" className="max-w-3xl">
        {open ? (
          <BannerFormBody
            key={banner?.id ?? "create"}
            banner={banner}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
