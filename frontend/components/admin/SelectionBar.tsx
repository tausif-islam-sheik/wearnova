"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { RowSelection } from "@/hooks/use-row-selection";

/** The bar that appears above a table once rows are ticked: count, actions, CSV export, Clear. */
export function SelectionBar({
  count,
  onClear,
  onExport,
  children,
}: {
  count: number;
  onClear: () => void;
  onExport?: () => void;
  children?: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="flex flex-wrap items-center gap-2 border-b border-border/50 bg-primary/5 px-4 py-2.5"
    >
      <span className="mr-auto text-sm font-medium">
        {count} selected
        <button type="button" className="ml-3 text-xs font-normal text-muted-foreground underline" onClick={onClear}>
          Clear
        </button>
      </span>
      {children}
      {onExport && (
        <Button size="sm" variant="outline" onClick={onExport}>
          <Download className="size-3.5" />
          Export CSV
        </Button>
      )}
    </div>
  );
}

/** Header checkbox: ticks or clears every row on the current page. */
export function SelectAllCheckbox<T extends { id: string }>({
  items,
  selection,
}: {
  items: T[];
  selection: RowSelection<T>;
}) {
  const all = items.length > 0 && items.every((i) => selection.has(i.id));
  const some = items.some((i) => selection.has(i.id));
  return (
    <Checkbox
      checked={all}
      indeterminate={!all && some}
      disabled={items.length === 0}
      onCheckedChange={(c) => selection.toggleMany(items, Boolean(c))}
      aria-label="Select all on this page"
    />
  );
}

export function RowCheckbox<T extends { id: string }>({
  item,
  label,
  selection,
}: {
  item: T;
  label: string;
  selection: RowSelection<T>;
}) {
  return (
    <Checkbox
      checked={selection.has(item.id)}
      onCheckedChange={(c) => selection.toggle(item, Boolean(c))}
      aria-label={`Select ${label}`}
    />
  );
}
