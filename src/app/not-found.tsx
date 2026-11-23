import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-4">
        <p className="font-mono text-xs font-medium text-muted-foreground">
          404
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          The administrative route you requested does not exist or has been
          moved.
        </p>
        <div className="pt-1">
          <Link
            href="/"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Return to portal
          </Link>
        </div>
      </div>
    </main>
  );
}
