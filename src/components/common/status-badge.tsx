import { cn } from "@/lib/utils";

export type StatusTone = "success" | "muted" | "warning" | "destructive" | "info";

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

const TONE_STYLES: Record<StatusTone, { container: string; dot: string }> = {
  success: {
    container: "border-success/25 bg-success-muted text-success",
    dot: "bg-success",
  },
  muted: {
    container: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/70",
  },
  warning: {
    container: "border-warning/30 bg-warning-muted text-warning",
    dot: "bg-warning",
  },
  destructive: {
    container: "border-destructive/25 bg-destructive-muted text-destructive",
    dot: "bg-destructive",
  },
  info: {
    container: "border-info/25 bg-info-muted text-info",
    dot: "bg-info",
  },
};

export function StatusBadge({
  label,
  tone = "muted",
  className,
}: StatusBadgeProps) {
  const styles = TONE_STYLES[tone];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        styles.container,
        className
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", styles.dot)}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
