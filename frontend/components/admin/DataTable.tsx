"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  MoreHorizontal,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";
import { PageNav } from "@/components/shared/PageNav";
import { downloadCsv } from "@/lib/csv";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  sortValue?: (row: T) => unknown;
  className?: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
}

export interface RowAction<T> {
  label: string;
  onClick: (row: T) => void;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
  /** Return true to leave this action out of a row's menu. */
  hidden?: (row: T) => boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T & string)[];
  filter?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  footer?: React.ReactNode;
  onRowClick?: (row: T) => void;
  getRowKey?: (row: T) => string;
  selectable?: boolean;
  equalColumns?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  rowActions?: RowAction<T>[];
  bulkActions?: BulkAction[];
  /** Adds an "Export CSV" action for the ticked rows (uses `getRowKey`, or each row's `id`). */
  exportFileName?: string;
}

export interface BulkAction {
  label: string;
  onClick: (keys: string[]) => void;
  variant?: "default" | "destructive" | "outline";
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function DataTableToolbar({
  search,
  setSearch,
  searchPlaceholder,
  filter,
  bulkActions,
  selectedKeys,
  onClearSelection,
}: {
  search: string;
  setSearch: (value: string) => void;
  searchPlaceholder: string;
  filter?: React.ReactNode;
  bulkActions?: BulkAction[];
  selectedKeys: string[];
  onClearSelection: () => void;
}) {
  const hasSelection = selectedKeys.length > 0;
  const hasBulkActions = bulkActions && bulkActions.length > 0;

  return (
    <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3 sm:flex-row sm:items-center">
      <div className="relative w-full sm:max-w-sm sm:flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-9 pr-8 rounded!"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center sm:gap-3">
        {filter}
        {hasSelection && hasBulkActions && (
          <div className="flex items-center gap-2">
            {bulkActions!.map((action, i) => (
              <Button
                key={i}
                size="sm"
                variant={action.variant ?? "default"}
                onClick={() => action.onClick(selectedKeys)}
              >
                {action.label} ({selectedKeys.length})
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={onClearSelection}>
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-border px-6 py-4 sm:flex-row">
      <div className="flex items-center gap-3">
        <span className="text-sm whitespace-nowrap text-muted-foreground">Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-[70px] text-sm rounded!">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="30">30</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
          {total === 0 ? "0 of 0" : `${start}–${end} of ${total}`}
        </span>
        <PageNav page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchKeys = [],
  filter,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  footer,
  onRowClick,
  getRowKey,
  selectable = false,
  equalColumns = false,
  selectedKeys: controlledSelectedKeys,
  onSelectionChange,
  rowActions,
  bulkActions,
  exportFileName,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<string[]>([]);

  const selectedKeys = controlledSelectedKeys ?? internalSelectedKeys;
  const setSelectedKeys = onSelectionChange ?? setInternalSelectedKeys;

  const debouncedSearch = useDebounce(search, 300);

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        if (sortDir === "asc") {
          setSortDir("desc");
        } else {
          setSortKey(null);
        }
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
      setCurrentPage(1);
    },
    [sortKey, sortDir]
  );

  const getSortValue = useCallback(
    (row: T, key: string): unknown => {
      const col = columns.find((c) => c.key === key);
      if (col?.sortValue) return col.sortValue(row);
      return row[key];
    },
    [columns]
  );

  const filtered = useMemo(() => {
    let result = data;
    if (debouncedSearch && searchKeys.length > 0) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((row) =>
        searchKeys.some((k) => {
          const val = row[k];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = getSortValue(a, sortKey);
        const bVal = getSortValue(b, sortKey);
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        }
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [data, debouncedSearch, searchKeys, sortKey, sortDir, getSortValue]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // A row's key is what selection and bulk actions refer to, so it must be stable across pages,
  // sorting and search: the caller's key, else the row's own `id`, else its position.
  const keyFor = (row: T, idx: number) =>
    getRowKey ? getRowKey(row) : typeof row.id === "string" ? row.id : String(idx);
  const paginatedKeys = paginated.map((row, idx) => keyFor(row, (currentPage - 1) * pageSize + idx));

  const allBulkActions: BulkAction[] = [
    ...(bulkActions ?? []),
    ...(exportFileName
      ? [
          {
            label: "Export CSV",
            variant: "outline" as const,
            onClick: (keys: string[]) =>
              downloadCsv(
                exportFileName,
                data.filter((row, idx) => keys.includes(keyFor(row, idx))),
              ),
          },
        ]
      : []),
  ];

  const allPageSelected =
    paginated.length > 0 && paginatedKeys.every((k) => selectedKeys.includes(k));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedKeys(selectedKeys.filter((k) => !paginatedKeys.includes(k)));
    } else {
      setSelectedKeys([...new Set([...selectedKeys, ...paginatedKeys])]);
    }
  };

  const toggleRow = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey)
      return <ChevronsUpDown className="ml-1 size-3 text-muted-foreground/40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 size-3 text-foreground" />
    ) : (
      <ChevronDown className="ml-1 size-3 text-foreground" />
    );
  };

  const hasActionsColumn = rowActions && rowActions.length > 0;

  return (
    <div>
      <div className="overflow-hidden rounded border border-border/50">
        {(searchKeys.length > 0 || filter || (selectedKeys.length > 0 && allBulkActions.length > 0)) && (
          <DataTableToolbar
            search={search}
            setSearch={(value) => {
              setSearch(value);
              setCurrentPage(1);
            }}
            searchPlaceholder={searchPlaceholder}
            filter={filter}
            bulkActions={allBulkActions}
            selectedKeys={selectedKeys}
            onClearSelection={() => setSelectedKeys([])}
          />
        )}
        <div className="overflow-x-auto">
          <Table className={cn("w-full", equalColumns && "table-fixed")}>
            <TableHeader>
              <TableRow className="bg-muted/30">
                {selectable && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allPageSelected}
                      indeterminate={!allPageSelected && paginatedKeys.some((k) => selectedKeys.includes(k))}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all rows"
                    />
                  </TableHead>
                )}
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "text-xs font-medium uppercase tracking-wide text-muted-foreground",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
                      col.className
                    )}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center">
                      {col.label}
                      {col.sortable && <SortIcon colKey={col.key} />}
                    </span>
                  </TableHead>
                ))}
                {hasActionsColumn && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      columns.length + (selectable ? 1 : 0) + (hasActionsColumn ? 1 : 0)
                    }
                  >
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      icon={emptyIcon}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row, idx) => {
                  const rowKey = keyFor(row, (currentPage - 1) * pageSize + idx);
                  const isSelected = selectedKeys.includes(rowKey);

                  return (
                    <TableRow
                      key={rowKey}
                      className={cn(
                        "transition-colors hover:bg-muted/50",
                        onRowClick && "cursor-pointer",
                        isSelected && "bg-muted/10"
                      )}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {selectable && (
                        <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRow(rowKey)}
                            aria-label={`Select row ${idx + 1}`}
                          />
                        </TableCell>
                      )}
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            col.align === "right" && "text-right",
                            col.align === "center" && "text-center",
                            col.className
                          )}
                        >
                          {col.render
                            ? col.render(row)
                            : String(row[col.key] ?? "")}
                        </TableCell>
                      ))}
                      {hasActionsColumn && (
                        <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                          {rowActions!.some((a) => !a.hidden?.(row)) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-foreground"
                                  aria-label="Row actions"
                                />
                              }
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {rowActions!.filter((a) => !a.hidden?.(row)).map((action, i) => (
                                <DropdownMenuItem
                                  key={i}
                                  className={cn(
                                    "cursor-pointer",
                                    action.variant === "destructive" && "text-destructive"
                                  )}
                                  onClick={() => action.onClick(row)}
                                >
                                  {action.icon && <span className="mr-2">{action.icon}</span>}
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {footer !== undefined ? (
          footer
        ) : (
          <DataTablePagination
            page={currentPage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={(p) => setCurrentPage(Math.min(Math.max(1, p), totalPages))}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}
