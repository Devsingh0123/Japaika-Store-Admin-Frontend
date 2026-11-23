import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "on-dark";
  className?: string;
  priority?: boolean;
}

const SIZE_MAP = {
  sm: { emblem: 26, wordmarkWidth: 72, wordmarkHeight: 22 },
  md: { emblem: 32, wordmarkWidth: 88, wordmarkHeight: 28 },
  lg: { emblem: 40, wordmarkWidth: 112, wordmarkHeight: 35 },
} as const;

export function BrandMark({
  showWordmark = true,
  size = "md",
  tone = "default",
  className,
  priority = false,
}: BrandMarkProps) {
  const dimensions = SIZE_MAP[size];

  return (
    <div
      className={cn("inline-flex items-center gap-2 select-none", className)}
    >
      <Image
        src="/japaikaLogo.svg"
        alt="Japaika emblem"
        width={dimensions.emblem}
        height={dimensions.emblem}
        priority={priority}
        className="shrink-0"
      />
      {showWordmark ? (
        <Image
          src="/japaikaName.svg"
          alt="Japaika"
          width={dimensions.wordmarkWidth}
          height={dimensions.wordmarkHeight}
          priority={priority}
          className={cn(
            "shrink-0 object-contain",
            tone === "on-dark"
              ? "brightness-[2] contrast-110"
              : "dark:brightness-[1.95] dark:contrast-110"
          )}
        />
      ) : null}
    </div>
  );
}
