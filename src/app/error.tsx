"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Unhandled admin portal error:", error);
    }
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="mt-0.5 size-5 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <h1 className="text-base font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              An unexpected error interrupted this view. Retry the request or
              refresh the page.
            </p>
            <div className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
