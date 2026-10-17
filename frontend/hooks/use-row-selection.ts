"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Row selection that survives paging: it remembers the whole row (not just the id), so a CSV
 * export of selected rows still works after moving to another page of a server-driven table.
 */
export function useRowSelection<T extends { id: string }>() {
  const [rows, setRows] = useState<Map<string, T>>(new Map());

  const toggle = useCallback((row: T, checked: boolean) => {
    setRows((prev) => {
      const next = new Map(prev);
      if (checked) next.set(row.id, row);
      else next.delete(row.id);
      return next;
    });
  }, []);

  const toggleMany = useCallback((items: T[], checked: boolean) => {
    setRows((prev) => {
      const next = new Map(prev);
      for (const row of items) {
        if (checked) next.set(row.id, row);
        else next.delete(row.id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setRows(new Map()), []);

  return useMemo(
    () => ({
      count: rows.size,
      ids: [...rows.keys()],
      rows: [...rows.values()],
      has: (id: string) => rows.has(id),
      toggle,
      toggleMany,
      clear,
    }),
    [rows, toggle, toggleMany, clear],
  );
}

export type RowSelection<T extends { id: string }> = ReturnType<typeof useRowSelection<T>>;
