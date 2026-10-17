"use client";

import { useSyncExternalStore } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * True once the persisted auth store has been restored from localStorage.
 * The server snapshot is always `false`, so the first client render matches the
 * server HTML (no hydration mismatch) and then updates to the real value.
 */
export function useAuthHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useAuthStore.persist?.onFinishHydration?.(onChange) ?? (() => undefined),
    () => useAuthStore.persist?.hasHydrated() ?? false,
    () => false
  );
}
