import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div
      className="flex flex-1 items-center justify-center bg-background p-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>Loading admin portal...</span>
      </div>
    </div>
  );
}
