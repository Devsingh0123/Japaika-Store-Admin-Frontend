"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  label?: string;
  ariaLabel?: string;
  toastMessage?: string;
  className?: string;
}

export function CopyButton({
  value,
  label,
  ariaLabel,
  toastMessage,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(toastMessage ?? `Copied "${value}"`);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Unable to copy to clipboard.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel ?? `Copy ${value}`}
      title={ariaLabel ?? "Copy"}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        label ? "gap-1.5 px-2 py-1 text-xs font-medium" : "size-6",
        className
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-success" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      {label ? <span>{copied ? "Copied" : label}</span> : null}
    </button>
  );
}
