import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryThumbnailProps {
  imageUrl: string | null;
  name: string;
  size?: "sm" | "md";
}

export function CategoryThumbnail({
  imageUrl,
  name,
  size = "md",
}: CategoryThumbnailProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background",
        size === "sm" ? "size-10" : "size-11"
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          unoptimized
          className="object-cover"
        />
      ) : (
        <ImageIcon
          className="size-4 text-muted-foreground/55"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
