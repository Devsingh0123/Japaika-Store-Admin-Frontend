"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  id: string;
  previewUrl: string | null;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  accept?: string;
  helperText?: string;
  error?: string | null;
  disabled?: boolean;
  onSelectFile: (file: File) => void;
  onRemoveImage: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageUploadField({
  id,
  previewUrl,
  fileName,
  fileSizeBytes,
  accept = "image/jpeg,image/png,image/webp,image/avif",
  helperText = "JPEG, PNG, WebP, or AVIF up to 5 MB.",
  error,
  disabled = false,
  onSelectFile,
  onRemoveImage,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSelectFile(file);
    }
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onSelectFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleInputChange}
        className="sr-only"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "rounded-xl border border-dashed bg-background/60 p-4 transition-colors",
          isDragging
            ? "border-brand bg-brand-muted/40"
            : error
              ? "border-destructive/50 bg-destructive-muted/30"
              : "border-border-strong hover:border-foreground/30",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        {previewUrl ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex size-22 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-xs)]">
              <Image
                src={previewUrl}
                alt="Category preview"
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="space-y-0.5">
                <p className="truncate text-sm font-medium text-foreground">
                  {fileName ?? "Current category image"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {typeof fileSizeBytes === "number"
                    ? `${formatFileSize(fileSizeBytes)} — ready to upload`
                    : helperText}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => inputRef.current?.click()}
                  className="cursor-pointer"
                >
                  <ImagePlus className="size-3.5" aria-hidden="true" />
                  Replace image
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={onRemoveImage}
                  className="cursor-pointer text-destructive hover:bg-destructive-muted hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Remove image
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2.5 py-3 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-[var(--shadow-xs)]">
              <UploadCloud className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                Drop an image here, or browse
              </p>
              <p className="text-xs text-muted-foreground">{helperText}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="mt-1 cursor-pointer"
            >
              <ImagePlus className="size-3.5" aria-hidden="true" />
              Upload image
            </Button>
          </div>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
