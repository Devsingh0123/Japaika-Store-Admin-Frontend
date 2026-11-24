import { Info } from "lucide-react";
import type { UploadGuideline } from "@/lib/media/upload-specs";
import { cn } from "@/lib/utils";

interface UploadGuidelinesProps {
  guidelines: UploadGuideline;
  className?: string;
}

export function UploadGuidelines({
  guidelines,
  className,
}: UploadGuidelinesProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-muted/35 px-3 py-2 text-[0.72rem] leading-5 text-muted-foreground",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 tabular-nums">
        <span className="inline-flex items-center gap-1.5">
          <Info
            className="size-3.5 shrink-0 text-muted-foreground/80"
            aria-hidden="true"
          />
          <span className="font-medium text-foreground/85">Recommended:</span>{" "}
          {guidelines.recommendedDimensions} ({guidelines.aspectRatio})
        </span>
        <span aria-hidden="true" className="hidden text-border sm:inline">
          ·
        </span>
        <span>
          <span className="font-medium text-foreground/85">Formats:</span>{" "}
          {guidelines.formats}
        </span>
        <span aria-hidden="true" className="hidden text-border sm:inline">
          ·
        </span>
        <span>
          <span className="font-medium text-foreground/85">Max size:</span>{" "}
          {guidelines.maxSize}
        </span>
      </div>

      {guidelines.note ? (
        <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
          {guidelines.note}
        </p>
      ) : null}
    </div>
  );
}
