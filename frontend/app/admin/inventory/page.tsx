"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Check,
  CircleDollarSign,
  EyeOff,
  Loader2,
  Megaphone,
  MegaphoneOff,
  Package,
  PackageX,
  Pencil,
  RotateCcw,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadError } from "@/components/admin/LoadError";
import { StatCard, STAT_GRID } from "@/components/admin/StatCard";
import { TablePageSkeleton } from "@/components/admin/PageSkeletons";
import { api } from "@/lib/api";
import { cn, resolveMediaUrl } from "@/lib/utils";
import { PageNav } from "@/components/shared/PageNav";

type View = "all" | "active" | "reserved" | "sold" | "deactivated" | "low" | "stale";
type BulkAction = "activate" | "deactivate" | "promote" | "unpromote";
type Status = "active" | "reserved" | "sold" | "deactivated";

interface Item {
  id: string;
  title: string;
  image: string | null;
  brand: string;
  category: string;
  price: number;
  quantity: number;
  status: Status;
  isPromoted: boolean;
  uploadedAt: string;
  seller: { id: string; name: string };
}

interface ItemsResponse {
  items: Item[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  counts: Record<View, number>;
}

interface Breakdown {
  name: string;
  count: number;
  value: number;
}

interface Summary {
  totals: {
    activeListings: number;
    activeUnits: number;
    activeValue: number;
    soldOut: number;
    lowStock: number;
    stale: number;
  };
  aging: { lt30: number; d30to59: number; d60to89: number; d90plus: number };
  top: { categories: Breakdown[]; brands: Breakdown[]; sellers: Breakdown[] };
  thresholds: { lowMin: number; lowMax: number; staleDays: number };
}

interface BulkResult {
  action: BulkAction;
  updated: number;
  skipped: { id: string; title: string; reason: string }[];
}

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<Status, string> = {
  active: "Active",
  reserved: "Reserved",
  sold: "Sold out",
  deactivated: "Deactivated",
};

const STATUS_STYLE: Record<Status, string> = {
  active: "border-success/20 bg-success/10 text-success",
  reserved: "border-warning/20 bg-warning/10 text-warning",
  sold: "border-border bg-muted text-muted-foreground",
  deactivated: "border-border bg-muted text-muted-foreground",
};

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

function listedFor(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days < 1 ? "Today" : `${days} day${days === 1 ? "" : "s"}`;
}

/** Stock number that turns into a small editor on click. */
function StockCell({ item, onSaved }: { item: Item; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(item.quantity));
  const [saving, setSaving] = useState(false);

  const start = () => {
    setValue(String(item.quantity));
    setEditing(true);
  };

  const save = async () => {
    const q = Number(value);
    if (value.trim() === "" || !Number.isInteger(q) || q < 0 || q > 9999) {
      toast.error("Stock must be a whole number from 0 to 9999");
      return;
    }
    if (q === item.quantity) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/admin/inventory/${item.id}/stock`, { quantity: q });
      toast.success(q === 0 ? `"${item.title}" is now sold out` : `Stock set to ${q}`);
      setEditing(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update the stock");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        aria-label={`Edit stock for ${item.title}, currently ${item.quantity}`}
        className="group inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-sm tabular-nums hover:bg-muted"
      >
        <span className={cn("font-medium", item.quantity === 0 && "text-muted-foreground")}>{item.quantity}</span>
        <Pencil className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </button>
    );
  }

  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        max={9999}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        aria-label={`New stock for ${item.title}`}
        className="h-7 w-16 px-2 text-sm"
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
      />
      <Button type="submit" size="icon-sm" variant="ghost" aria-label="Save stock" disabled={saving}>
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-success" />}
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label="Cancel" onClick={() => setEditing(false)} disabled={saving}>
        <X className="size-3.5" />
      </Button>
    </form>
  );
}

function TopList({ title, rows }: { title: string; rows: Breakdown[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Card className="border border-border/50 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mb-3 text-xs text-muted-foreground">By active listings</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.name} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate">{r.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {r.count} · {money(r.value)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function AgingCard({ aging, staleDays }: { aging: Summary["aging"]; staleDays: number }) {
  const buckets = [
    { label: "Under 30 days", n: aging.lt30, color: "bg-success" },
    { label: "30 to 59 days", n: aging.d30to59, color: "bg-primary" },
    { label: "60 to 89 days", n: aging.d60to89, color: "bg-warning" },
    { label: `${staleDays}+ days`, n: aging.d90plus, color: "bg-destructive" },
  ];
  const total = buckets.reduce((s, b) => s + b.n, 0);
  return (
    <Card className="border border-border/50 p-4">
      <p className="text-sm font-semibold text-foreground">How long active items have been listed</p>
      <p className="mb-3 text-xs text-muted-foreground">Older listings are worth a second look</p>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label="Listing age distribution">
        {total > 0 &&
          buckets.map((b) => (
            <div key={b.label} className={b.color} style={{ width: `${(b.n / total) * 100}%` }} title={`${b.label}: ${b.n}`} />
          ))}
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {buckets.map((b) => (
          <li key={b.label} className="flex items-center gap-2">
            <span className={cn("size-2.5 rounded-full", b.color)} />
            <span className="text-muted-foreground">{b.label}</span>
            <span className="ml-auto tabular-nums">{b.n}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function InventoryPage() {
  const [view, setView] = useState<View>("all");
  const [sort, setSort] = useState("newest");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [bulkBusy, setBulkBusy] = useState<BulkAction | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const requestKey = `${view}|${sort}|${search}|${page}|${reloadKey}`;
  const [result, setResult] = useState<{ key: string; data?: ItemsResponse; error?: unknown } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ view, sort, page: String(page), limit: String(PAGE_SIZE) });
    if (search) params.set("search", search);
    api
      .get<ItemsResponse>(`/admin/inventory/items?${params}`)
      .then((data) => !cancelled && setResult({ key: requestKey, data }))
      .catch((error) => !cancelled && setResult({ key: requestKey, error }));
    return () => {
      cancelled = true;
    };
    // requestKey already encodes every input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Summary>("/admin/inventory")
      .then((data) => !cancelled && setSummary(data))
      .catch(() => {
        // The table reports real errors; the summary cards just stay as they were.
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const loading = result?.key !== requestKey;
  const data = result?.data;

  const runBulk = async (action: BulkAction) => {
    setBulkBusy(action);
    try {
      const res = await api.post<BulkResult>("/admin/inventory/bulk", { ids: [...selected], action });
      const verb: Record<BulkAction, string> = {
        activate: "Reactivated",
        deactivate: "Deactivated",
        promote: "Promoted",
        unpromote: "Removed the promotion from",
      };
      const skippedText = res.skipped.length
        ? `${res.skipped.length} skipped: ${res.skipped
            .slice(0, 3)
            .map((s) => `${s.title} (${s.reason.toLowerCase()})`)
            .join("; ")}${res.skipped.length > 3 ? "…" : ""}`
        : undefined;
      if (res.updated > 0) {
        toast.success(`${verb[action]} ${res.updated} listing${res.updated === 1 ? "" : "s"}`, { description: skippedText });
      } else {
        toast.warning("Nothing was changed", { description: skippedText });
      }
      setSelected(new Set());
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't apply that action");
    } finally {
      setBulkBusy(null);
    }
  };

  if (!result) return <TablePageSkeleton statCards={4} />;
  if (result.error && !data) return <LoadError what="the inventory" error={result.error} onRetry={reload} />;

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const counts = data?.counts;
  const t = summary?.totals;
  const pageIds = items.map((i) => i.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPage = pageIds.some((id) => selected.has(id));

  const toggleAll = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  const toggleOne = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const TAB_LABELS: [View, string][] = [
    ["all", "All"],
    ["active", "Active"],
    ["reserved", "Reserved"],
    ["sold", "Sold out"],
    ["deactivated", "Deactivated"],
    ["low", `Low stock (${summary?.thresholds.lowMin ?? 2}–${summary?.thresholds.lowMax ?? 3} left)`],
    ["stale", `Stale (${summary?.thresholds.staleDays ?? 90}+ days)`],
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stock levels, listing health and bulk actions. Buyers take one unit per order.
        </p>
      </div>

      <div className={STAT_GRID}>
        <StatCard icon={ShoppingBag} label="Active listings" value={t ? t.activeListings.toLocaleString() : "…"} iconBg="bg-brand-primary/10" iconColor="text-brand-primary" />
        <StatCard icon={Boxes} label="Units in stock" value={t ? t.activeUnits.toLocaleString() : "…"} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
        <StatCard icon={CircleDollarSign} label="Inventory value" value={t ? money(t.activeValue) : "…"} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatCard icon={PackageX} label="Sold out" value={t ? t.soldOut.toLocaleString() : "…"} iconBg="bg-rose-500/10" iconColor="text-rose-500" />
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <AgingCard aging={summary.aging} staleDays={summary.thresholds.staleDays} />
          <TopList title="Top categories" rows={summary.top.categories} />
          <TopList title="Top brands" rows={summary.top.brands} />
          <TopList title="Top sellers" rows={summary.top.sellers} />
        </div>
      )}

      <Card className="border border-border/50">
        <div className="flex flex-col gap-3 border-b border-border/50 p-4">
          <Tabs
            value={view}
            onValueChange={(v) => {
              setView(v as View);
              setPage(1);
              setSelected(new Set());
            }}
          >
            <TabsList className="h-auto flex-wrap">
              {TAB_LABELS.map(([value, label]) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                  {counts ? ` (${counts[value].toLocaleString()})` : ""}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search item, brand or seller…"
                aria-label="Search inventory"
                className="w-full pl-8 sm:w-72"
              />
            </div>
            <NativeSelect
              aria-label="Sort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <NativeSelectOption value="newest">Newest first</NativeSelectOption>
              <NativeSelectOption value="oldest">Oldest first</NativeSelectOption>
              <NativeSelectOption value="stock">Lowest stock</NativeSelectOption>
              <NativeSelectOption value="value">Highest price</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border/50 bg-primary/5 px-4 py-2.5" role="region" aria-label="Bulk actions">
            <span className="mr-auto text-sm font-medium">
              {selected.size} selected
              <button className="ml-3 text-xs font-normal text-muted-foreground underline" onClick={() => setSelected(new Set())}>
                Clear
              </button>
            </span>
            <Button size="sm" variant="outline" disabled={bulkBusy !== null} onClick={() => void runBulk("activate")}>
              {bulkBusy === "activate" ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
              Reactivate
            </Button>
            <Button size="sm" variant="outline" disabled={bulkBusy !== null} onClick={() => setConfirmDeactivate(true)}>
              <EyeOff className="size-3.5" />
              Deactivate
            </Button>
            <Button size="sm" variant="outline" disabled={bulkBusy !== null} onClick={() => void runBulk("promote")}>
              {bulkBusy === "promote" ? <Loader2 className="size-3.5 animate-spin" /> : <Megaphone className="size-3.5" />}
              Promote
            </Button>
            <Button size="sm" variant="outline" disabled={bulkBusy !== null} onClick={() => void runBulk("unpromote")}>
              {bulkBusy === "unpromote" ? <Loader2 className="size-3.5 animate-spin" /> : <MegaphoneOff className="size-3.5" />}
              Unpromote
            </Button>
          </div>
        )}

        {Boolean(result.error) && data && (
          <p role="alert" className="border-b border-border/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
            Couldn&apos;t refresh the list.{" "}
            <button className="underline" onClick={reload}>
              Try again
            </button>
          </p>
        )}

        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          {items.length === 0 ? (
            <EmptyState
              icon={<Package className="size-6 text-muted-foreground" />}
              title="No listings found"
              description="Try a different tab or search."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allOnPage}
                        indeterminate={!allOnPage && someOnPage}
                        onCheckedChange={(c) => toggleAll(Boolean(c))}
                        aria-label="Select all on this page"
                      />
                    </TableHead>
                    {["Item", "Seller", "Price", "Stock", "Status", "Listed"].map((h) => (
                      <TableHead key={h} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {h}
                      </TableHead>
                    ))}
                    <TableHead className="w-12">
                      <span className="sr-only">Edit</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((i) => {
                    const image = resolveMediaUrl(i.image);
                    return (
                      <TableRow key={i.id} className={cn("hover:bg-muted/20", selected.has(i.id) && "bg-primary/5")}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(i.id)}
                            onCheckedChange={(c) => toggleOne(i.id, Boolean(c))}
                            aria-label={`Select ${i.title}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {image ? (
                              <img src={image} alt="" className="size-10 shrink-0 rounded-md bg-muted object-cover" />
                            ) : (
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                                <Package className="size-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="flex max-w-[260px] items-center gap-1.5 truncate text-sm font-medium" title={i.title}>
                                <span className="truncate">{i.title}</span>
                                {i.isPromoted && (
                                  <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">
                                    Promoted
                                  </Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {i.brand} · {i.category}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{i.seller.name}</TableCell>
                        <TableCell className="text-sm tabular-nums">${i.price.toLocaleString()}</TableCell>
                        <TableCell>
                          <StockCell item={i} onSaved={reload} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_STYLE[i.status]}>
                            {STATUS_LABEL[i.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{listedFor(i.uploadedAt)}</TableCell>
                        <TableCell>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Edit ${i.title}`}
                            nativeButton={false}
                            render={<Link href={`/admin/products/${i.id}/edit`} />}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-3 text-sm text-muted-foreground">
            <span>
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
            </span>
            <PageNav
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              disabled={loading}
            />
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title={`Deactivate ${selected.size} listing${selected.size === 1 ? "" : "s"}?`}
        description="They disappear from the marketplace until you reactivate them. Items a buyer is checking out right now are skipped."
        confirmLabel="Deactivate"
        onConfirm={() => runBulk("deactivate")}
      />
    </div>
  );
}
