"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  Film,
  Image as ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { UploadGuidelines } from "@/components/common/upload-guidelines";
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
import {
  useAddProductMediaMutation,
  useDeleteProductMediaMutation,
  useUpdateProductMediaMutation,
} from "@/hooks/use-products";
import { ApiError } from "@/lib/api/error";
import { formatFileSize } from "@/lib/format";
import { UPLOAD_SPECS } from "@/lib/media/upload-specs";
import {
  isImageMimeType,
  isVideoMimeType,
  MAX_PRODUCT_MEDIA,
  validateProductMediaFile,
} from "@/lib/products/schemas";
import type { ProductMediaItem, ProductStatus } from "@/types/product";

interface ProductMediaSectionProps {
  mode: "create" | "edit";
  productId?: string;
  productStatus?: ProductStatus;
  savedMedia?: ProductMediaItem[];
  queuedFiles: File[];
  onQueuedFilesChange: (files: File[]) => void;
  canEdit: boolean;
}

interface SavedMediaCardProps {
  productId: string;
  item: ProductMediaItem;
  index: number;
  totalCount: number;
  canEdit: boolean;
  isOnlyImageOfActiveProduct: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onSetPrimary: (mediaId: string) => void;
  onDelete: (mediaId: string) => void;
  onSaveAltText: (mediaId: string, altText: string) => Promise<void>;
  isMutating: boolean;
}

function SavedMediaCard({
  item,
  index,
  totalCount,
  canEdit,
  isOnlyImageOfActiveProduct,
  onMove,
  onSetPrimary,
  onDelete,
  onSaveAltText,
  isMutating,
}: SavedMediaCardProps) {
  const [altDraft, setAltDraft] = useState(item.altText ?? "");
  const [savingAlt, setSavingAlt] = useState(false);

  const isAltDirty = altDraft.trim() !== (item.altText ?? "");

  const handleAltSave = async () => {
    setSavingAlt(true);
    try {
      await onSaveAltText(item.id, altDraft.trim());
    } finally {
      setSavingAlt(false);
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/50">
        {item.mediaType === "video" ? (
          <video
            src={item.mediaUrl}
            poster={item.thumbnailUrl ?? undefined}
            controls
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.mediaUrl}
            alt={item.altText || "Product media"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}

        <div className="pointer-events-none absolute top-2 left-2 flex flex-wrap gap-1.5">
          {item.isPrimary ? (
            <Badge variant="brand" className="shadow-xs">
              <Star className="size-3 fill-brand text-brand" aria-hidden="true" />
              Primary
            </Badge>
          ) : null}
          <Badge variant="secondary" className="bg-card/90 backdrop-blur-xs">
            {item.mediaType === "video" ? (
              <>
                <Film className="size-3" aria-hidden="true" />
                Video
                {item.durationSeconds
                  ? ` · ${Math.round(item.durationSeconds)}s`
                  : ""}
              </>
            ) : (
              <>
                <ImageIcon className="size-3" aria-hidden="true" />
                Image
              </>
            )}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        {canEdit ? (
          <>
            <div className="flex items-center gap-1.5">
              <Input
                value={altDraft}
                onChange={(e) => setAltDraft(e.target.value)}
                placeholder="Alt text for accessibility & SEO"
                aria-label={`Alt text for media item ${index + 1}`}
                maxLength={160}
                className="h-8 text-xs"
              />
              {isAltDirty ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={savingAlt || isMutating}
                  onClick={handleAltSave}
                  aria-label="Save alt text"
                  className="shrink-0 cursor-pointer"
                >
                  {savingAlt ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Check className="size-3.5" aria-hidden="true" />
                  )}
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
              <div className="flex items-center gap-1">
                {item.mediaType === "image" && !item.isPrimary ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={isMutating}
                    onClick={() => onSetPrimary(item.id)}
                    className="cursor-pointer"
                  >
                    <Star className="size-3" aria-hidden="true" />
                    Set primary
                  </Button>
                ) : null}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === 0 || isMutating}
                  onClick={() => onMove(index, -1)}
                  aria-label="Move media earlier"
                  className="cursor-pointer"
                >
                  <ArrowUp className="size-3.5" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === totalCount - 1 || isMutating}
                  onClick={() => onMove(index, 1)}
                  aria-label="Move media later"
                  className="cursor-pointer"
                >
                  <ArrowDown className="size-3.5" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={isMutating || isOnlyImageOfActiveProduct}
                  onClick={() => onDelete(item.id)}
                  title={
                    isOnlyImageOfActiveProduct
                      ? "Active products require at least one image"
                      : "Remove media item"
                  }
                  aria-label="Remove media item"
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <p className="truncate text-xs text-muted-foreground">
            {item.altText || "No alt text"}
          </p>
        )}
      </div>
    </div>
  );
}

export function ProductMediaSection({
  mode,
  productId,
  productStatus,
  savedMedia = [],
  queuedFiles,
  onQueuedFilesChange,
  canEdit,
}: ProductMediaSectionProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const addMediaMutation = useAddProductMediaMutation();
  const updateMediaMutation = useUpdateProductMediaMutation();
  const deleteMediaMutation = useDeleteProductMediaMutation();

  const isMutating =
    addMediaMutation.isPending ||
    updateMediaMutation.isPending ||
    deleteMediaMutation.isPending;

  const currentCount = mode === "create" ? queuedFiles.length : savedMedia.length;
  const remainingSlots = Math.max(0, MAX_PRODUCT_MEDIA - currentCount);

  const queuedPreviews = useMemo(
    () =>
      queuedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        isVideo: isVideoMimeType(file.type),
      })),
    [queuedFiles]
  );

  useEffect(() => {
    return () => {
      for (const preview of queuedPreviews) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [queuedPreviews]);

  const savedImageCount = savedMedia.filter(
    (m) => m.mediaType === "image"
  ).length;

  const firstQueuedImageIndex = queuedFiles.findIndex((f) =>
    isImageMimeType(f.type)
  );

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;

    setMediaError(null);

    if (selected.length > remainingSlots) {
      setMediaError(
        `You can add at most ${remainingSlots} more media ${
          remainingSlots === 1 ? "file" : "files"
        } (maximum ${MAX_PRODUCT_MEDIA} per product).`
      );
      return;
    }

    for (const file of selected) {
      const error = validateProductMediaFile(file);
      if (error) {
        setMediaError(error);
        return;
      }
    }

    if (mode === "create") {
      onQueuedFilesChange([...queuedFiles, ...selected]);
      return;
    }

    if (productId) {
      try {
        await addMediaMutation.mutateAsync({ productId, files: selected });
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          setMediaError(error.message);
        }
      }
    }
  };

  const handleRemoveQueued = (index: number) => {
    onQueuedFilesChange(queuedFiles.filter((_, idx) => idx !== index));
    setMediaError(null);
  };

  const handleMoveSaved = async (index: number, direction: -1 | 1) => {
    if (!productId) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= savedMedia.length) return;

    const current = savedMedia[index];
    const neighbor = savedMedia[targetIndex];
    setMediaError(null);

    const nextCurrentOrder =
      current.sortOrder === neighbor.sortOrder
        ? targetIndex
        : neighbor.sortOrder;
    const nextNeighborOrder =
      current.sortOrder === neighbor.sortOrder ? index : current.sortOrder;

    await Promise.all([
      updateMediaMutation.mutateAsync({
        productId,
        mediaId: current.id,
        input: { sortOrder: nextCurrentOrder },
      }),
      updateMediaMutation.mutateAsync({
        productId,
        mediaId: neighbor.id,
        input: { sortOrder: nextNeighborOrder },
      }),
    ]);
  };

  const handleSetPrimary = async (mediaId: string) => {
    if (!productId) return;
    setMediaError(null);
    await updateMediaMutation.mutateAsync({
      productId,
      mediaId,
      input: { isPrimary: true },
    });
  };

  const handleSaveAltText = async (mediaId: string, altText: string) => {
    if (!productId) return;
    setMediaError(null);
    await updateMediaMutation.mutateAsync({
      productId,
      mediaId,
      input: { altText: altText || null },
    });
  };

  const handleDeleteSaved = async (mediaId: string) => {
    if (!productId) return;
    setMediaError(null);
    try {
      await deleteMediaMutation.mutateAsync({ productId, mediaId });
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setMediaError(error.message);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Product media</CardTitle>
          <CardDescription>
            Upload images (JPEG, PNG, WebP, AVIF up to 5 MB) and short videos
            (MP4, WebM up to 20 MB). Maximum {MAX_PRODUCT_MEDIA} items; at least
            1 image is required to publish.
          </CardDescription>
        </div>
        <Badge variant="outline" className="tabular-nums">
          {currentCount} / {MAX_PRODUCT_MEDIA}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {canEdit ? (
          <>
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
              onChange={handleFilesSelected}
              disabled={remainingSlots === 0 || isMutating}
              className="sr-only"
            />

            <button
              type="button"
              disabled={remainingSlots === 0 || isMutating}
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center transition-colors hover:border-brand/50 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {addMediaMutation.isPending ? (
                <Loader2
                  className="size-5 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <Upload
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {remainingSlots === 0
                    ? `Maximum ${MAX_PRODUCT_MEDIA} media items reached`
                    : "Add product images or short videos"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {mode === "create"
                    ? "Selected files upload together when you save or publish."
                    : "Files upload immediately to this product gallery."}
                </p>
              </div>
            </button>

            <UploadGuidelines guidelines={UPLOAD_SPECS.productMedia} />
          </>
        ) : null}

        {mediaError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive-muted px-3 py-2.5 text-xs text-destructive"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{mediaError}</span>
          </div>
        ) : null}

        {/* Create Mode Queued Files */}
        {mode === "create" ? (
          queuedPreviews.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {queuedPreviews.map((item, idx) => (
                <div
                  key={`${item.file.name}-${item.file.size}-${idx}`}
                  className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/50">
                    {item.isVideo ? (
                      <video
                        src={item.url}
                        controls
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt={item.file.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <div className="pointer-events-none absolute top-2 left-2 flex gap-1.5">
                      {idx === firstQueuedImageIndex ? (
                        <Badge variant="brand">
                          <Star
                            className="size-3 fill-brand text-brand"
                            aria-hidden="true"
                          />
                          Primary
                        </Badge>
                      ) : null}
                      <Badge
                        variant="secondary"
                        className="bg-card/90 backdrop-blur-xs"
                      >
                        {item.isVideo ? "Video" : "Image"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {item.file.name}
                      </p>
                      <p className="text-[0.7rem] text-muted-foreground">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remove ${item.file.name}`}
                      onClick={() => handleRemoveQueued(idx)}
                      className="shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null
        ) : savedMedia.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/25 px-4 py-6 text-center text-xs text-muted-foreground">
            No media uploaded for this product yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedMedia.map((item, idx) => (
              <SavedMediaCard
                key={`${item.id}-${item.altText ?? ""}-${item.sortOrder}-${item.isPrimary}`}
                productId={productId ?? ""}
                item={item}
                index={idx}
                totalCount={savedMedia.length}
                canEdit={canEdit}
                isOnlyImageOfActiveProduct={
                  productStatus === "active" &&
                  item.mediaType === "image" &&
                  savedImageCount <= 1
                }
                onMove={handleMoveSaved}
                onSetPrimary={handleSetPrimary}
                onDelete={handleDeleteSaved}
                onSaveAltText={handleSaveAltText}
                isMutating={isMutating}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
