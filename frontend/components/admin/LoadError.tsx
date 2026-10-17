"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";

interface LoadErrorProps {
  /** What failed to load, e.g. "dashboard data". */
  what: string;
  error?: unknown;
  onRetry?: () => void;
}

/** Full-width error state: explains an expired session, otherwise offers a retry. */
export function LoadError({ what, error, onRetry }: LoadErrorProps) {
  const router = useRouter();
  const logout = useAdminAuthStore((s) => s.logout);
  const expired = error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403);

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center"
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-5 text-destructive" />
      </div>
      <div>
        <p className="font-medium text-foreground">
          {expired ? "Your admin session has expired" : `Couldn't load ${what}`}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {expired
            ? "Sign in again to keep working."
            : error instanceof Error && error.message
              ? error.message
              : "Something went wrong. Please try again."}
        </p>
      </div>
      {expired ? (
        <Button
          onClick={() => {
            logout();
            router.push("/admin");
          }}
        >
          <LogIn className="size-4" />
          Sign in again
        </Button>
      ) : (
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="size-4" />
            Try again
          </Button>
        )
      )}
    </div>
  );
}
