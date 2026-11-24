"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Award,
  ExternalLink,
  FileText,
  Loader2,
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
import { Label } from "@/components/ui/label";
import {
  useDeleteProductCertificateMutation,
  useUpsertProductCertificateMutation,
} from "@/hooks/use-products";
import { formatFileSize } from "@/lib/format";
import { UPLOAD_SPECS } from "@/lib/media/upload-specs";
import { validateProductCertificateFile } from "@/lib/products/schemas";
import type { ProductCertificate } from "@/types/product";

interface ProductCertificateSectionProps {
  mode: "create" | "edit";
  productId?: string;
  certificate?: ProductCertificate | null;
  certificateLabelValue: string;
  onCertificateLabelChange: (nextLabel: string) => void;
  queuedFile: File | null;
  onQueuedFileChange: (file: File | null) => void;
  canEdit: boolean;
}

export function ProductCertificateSection({
  mode,
  productId,
  certificate,
  certificateLabelValue,
  onCertificateLabelChange,
  queuedFile,
  onQueuedFileChange,
  canEdit,
}: ProductCertificateSectionProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const upsertMutation = useUpsertProductCertificateMutation();
  const deleteMutation = useDeleteProductCertificateMutation();

  const isBusy = upsertMutation.isPending || deleteMutation.isPending;

  const queuedPreviewUrl = useMemo(() => {
    if (!queuedFile || queuedFile.type === "application/pdf") {
      return null;
    }
    return URL.createObjectURL(queuedFile);
  }, [queuedFile]);

  useEffect(() => {
    return () => {
      if (queuedPreviewUrl) {
        URL.revokeObjectURL(queuedPreviewUrl);
      }
    };
  }, [queuedPreviewUrl]);

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateProductCertificateFile(file);
    if (validationError) {
      setFileError(validationError);
      return;
    }

    setFileError(null);

    if (mode === "create") {
      onQueuedFileChange(file);
      return;
    }

    if (productId) {
      await upsertMutation.mutateAsync({
        productId,
        input: {
          file,
          certificateLabel: certificateLabelValue.trim() || null,
        },
      });
    }
  };

  const handleSaveLabelOnly = async () => {
    if (mode !== "edit" || !productId || !certificate) return;
    await upsertMutation.mutateAsync({
      productId,
      input: {
        certificateLabel: certificateLabelValue.trim() || null,
      },
    });
  };

  const handleDeleteCertificate = async () => {
    if (mode === "create") {
      onQueuedFileChange(null);
      setFileError(null);
      return;
    }

    if (productId) {
      await deleteMutation.mutateAsync(productId);
      onCertificateLabelChange("");
    }
  };

  const isSavedPdf =
    certificate?.resourceType === "raw" ||
    Boolean(certificate?.url.toLowerCase().endsWith(".pdf"));

  const hasLabelChangeInEdit =
    mode === "edit" &&
    Boolean(certificate) &&
    certificateLabelValue.trim() !== (certificate?.label ?? "");

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Authenticity certificate</CardTitle>
          <CardDescription>
            Optional lab report or authenticity certificate (JPEG, PNG, WebP,
            AVIF, or PDF up to 5 MB).
          </CardDescription>
        </div>
        {(certificate || queuedFile) && (
          <Badge variant="brand">
            <Award className="size-3 text-brand" aria-hidden="true" />
            Certified
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Certificate Label */}
        <div className="space-y-1.5">
          <Label htmlFor={`${inputId}-label`}>Certificate label</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={`${inputId}-label`}
              value={certificateLabelValue}
              onChange={(e) => onCertificateLabelChange(e.target.value)}
              disabled={!canEdit || isBusy}
              maxLength={160}
              placeholder="e.g. IGI Certified Natural Emerald"
            />
            {hasLabelChangeInEdit && canEdit ? (
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={handleSaveLabelOnly}
                className="shrink-0 cursor-pointer"
              >
                {upsertMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : null}
                Save label
              </Button>
            ) : null}
          </div>
        </div>

        {/* File Input (Hidden) */}
        {canEdit ? (
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
            onChange={handleFileSelected}
            disabled={isBusy}
            className="sr-only"
          />
        ) : null}

        {/* Active / Queued Preview */}
        {mode === "create" && queuedFile ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3.5">
            <div className="flex min-w-0 items-center gap-3">
              {queuedPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={queuedPreviewUrl}
                  alt="Queued certificate preview"
                  className="size-14 shrink-0 rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-brand">
                  <FileText className="size-6" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {queuedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {queuedFile.type === "application/pdf"
                    ? "PDF document"
                    : "Certificate image"}{" "}
                  · {formatFileSize(queuedFile.size)} · Uploads when saved
                </p>
              </div>
            </div>

            {canEdit ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer"
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteCertificate}
                  className="cursor-pointer text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            ) : null}
          </div>
        ) : mode === "edit" && certificate ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3.5">
            <div className="flex min-w-0 items-center gap-3">
              {!isSavedPdf ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={certificate.url}
                  alt={certificate.label || "Authenticity certificate"}
                  className="size-14 shrink-0 rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-brand">
                  <FileText className="size-6" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {certificate.label || "Authenticity certificate"}
                </p>
                <a
                  href={certificate.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                >
                  Open uploaded {isSavedPdf ? "PDF" : "file"}
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              </div>
            </div>

            {canEdit ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer"
                >
                  {upsertMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="size-3.5" aria-hidden="true" />
                  )}
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={handleDeleteCertificate}
                  className="cursor-pointer text-destructive hover:text-destructive"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  )}
                  Remove
                </Button>
              </div>
            ) : null}
          </div>
        ) : canEdit ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center transition-colors hover:border-brand/50 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {upsertMutation.isPending ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
            ) : (
              <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
            )}
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                Upload certificate image or PDF
              </p>
              <p className="text-xs text-muted-foreground">
                Lab report or authenticity document (optional).
              </p>
            </div>
          </button>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-muted/25 px-4 py-5 text-center text-xs text-muted-foreground">
            No authenticity certificate attached.
          </p>
        )}

        {canEdit ? (
          <UploadGuidelines guidelines={UPLOAD_SPECS.productCertificate} />
        ) : null}

        {fileError ? (
          <p role="alert" className="text-xs text-destructive">
            {fileError}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
