"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

export interface AdminPending {
  reports: { open: number; oldest: string | null };
  disputes: { open: number; oldest: string | null };
}

interface AdminPendingValue {
  /** Null until the first successful load; the last known value is kept if a refresh fails. */
  pending: AdminPending | null;
  refresh: () => void;
}

const AdminPendingContext = createContext<AdminPendingValue>({ pending: null, refresh: () => {} });

const POLL_MS = 60_000;

/**
 * One shared source for "work waiting for an admin", used by the sidebar badges and the bell.
 * Refreshes on every navigation, when the tab regains focus, and once a minute while visible.
 */
export function AdminPendingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pending, setPending] = useState<AdminPending | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AdminPending>("/admin/pending")
      .then((data) => !cancelled && setPending(data))
      .catch(() => {
        // Badges are a convenience: keep the last known counts and let the pages report real errors.
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, tick]);

  useEffect(() => {
    const bump = () => setTick((k) => k + 1);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") bump();
    }, POLL_MS);
    window.addEventListener("focus", bump);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", bump);
    };
  }, []);

  const refresh = useCallback(() => setTick((k) => k + 1), []);
  const value = useMemo(() => ({ pending, refresh }), [pending, refresh]);

  return <AdminPendingContext.Provider value={value}>{children}</AdminPendingContext.Provider>;
}

export function useAdminPending() {
  return useContext(AdminPendingContext);
}
