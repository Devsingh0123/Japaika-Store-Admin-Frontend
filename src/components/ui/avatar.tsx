import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends ComponentProps<"span"> {
  name: string;
  size?: "sm" | "md";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function Avatar({ name, size = "md", className, ...props }: AvatarProps) {
  return (
    <span
      data-slot="avatar"
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-brand/25 bg-brand-muted font-semibold text-foreground select-none",
        size === "sm" ? "size-7 text-[0.6875rem]" : "size-8 text-xs",
        className
      )}
      {...props}
    >
      {getInitials(name)}
    </span>
  );
}

export { Avatar };
