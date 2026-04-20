import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import App from "./App";
import "./index.css";

function shouldRetry(failureCount: number, error: unknown): boolean {
  const err = error as { status?: number; code?: string };
  // Auth/permission errors — retrying won't help
  if (err.status === 401 || err.status === 403) return false;
  // Other 4xx client errors (bad request, not found, conflict, etc.)
  if (err.status && err.status >= 400 && err.status < 500) return false;
  // Network errors / 5xx — retry up to 2 times (3 attempts total)
  return failureCount < 2;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: shouldRetry,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 0,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <ErrorBoundary fullScreen>
              <App />
            </ErrorBoundary>
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
