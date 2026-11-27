"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as ReduxProvider } from "react-redux";
import { Toaster } from "@/components/ui/sonner";
import { createQueryClient } from "@/lib/query/query-client";
import { AuthSessionProvider } from "@/providers/auth-session-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { makeStore } from "@/store";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [store] = useState(() => makeStore());
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ThemeProvider>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthSessionProvider>{children}</AuthSessionProvider>
          <Toaster />
          {process.env.NODE_ENV === "development" ? (
            <ReactQueryDevtools initialIsOpen={false} />
          ) : null}
        </QueryClientProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
