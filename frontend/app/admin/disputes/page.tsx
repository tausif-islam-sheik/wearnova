"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Scale, Search, ShieldCheck, CircleDollarSign, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadError } from "@/components/admin/LoadError";
import { TablePageSkeleton } from "@/components/admin/PageSkeletons";
import { api } from "@/lib/api";
import { cn, resolveMediaUrl } from "@/lib/utils";
import { PageNav } from "@/components/shared/PageNav";
import { StatCard, STAT_GRID } from "@/components/admin/StatCard";
import { useRowSelection } from "@/hooks/use-row-selection";
import { SelectionBar, SelectAllCheckbox, RowCheckbox } from "@/components/admin/SelectionBar";
import { downloadCsv } from "@/lib/csv";

type Status = "open" | "resolved" | "all";

interface DisputeDto {
  id: string;
  orderId: string;
  reason: string;
  details: string | null;
  status: "open" | "resolved";
  resolution: "refunded" | "released" | null;
  openedAt: string;
  resolvedAt: string | null;
  order: {
    id: string;
    total: number;
    status: string;
    listing: { id: string; title: string; images: string[] };
    buyer: { id: string; name: string };
    seller: { id: string; name: string };
  };
}

interface DisputesResponse {
  disputes: DisputeDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  counts: Record<Status, number>;
  stats: { openValue: number; oldestOpen: string | null };
}

const PAGE_SIZE = 20;
const STALE_AFTER_DAYS = 3;

const REASON_LABELS: Record<string, string> = {
  not_received: "Not received",
  not_as_described: "Not as described",
  damaged: "Damaged",
  other: "Other",
};

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function age(iso: string) {
  const days = daysSince(iso);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} ago`;
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return hours >= 1 ? `${hours} hr ago` : "Just now";
}

function waitingLabel(iso: string | null) {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return hours >= 1 ? `${hours} hr` : "Just now";
}

export default function DisputesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("open");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const selection = useRowSelection<DisputeDto>();

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const requestKey = `${status}|${search}|${page}|${reloadKey}`;
  const [result, setResult] = useState<{ key: string; data?: DisputesResponse; error?: unknown } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), status });
    if (search) params.set("search", search);
    api
      .get<DisputesResponse>(`/disputes?${params}`)
      .then((data) => !cancelled && setResult({ key: requestKey, data }))
      .catch((error) => !cancelled && setResult({ key: requestKey, error }));
    return () => {
      cancelled = true;
    };
    // requestKey already encodes every input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const loading = result?.key !== requestKey;
  const data = result?.data;

  if (!result) return <TablePageSkeleton statCards={4} />;
  if (result.error && !data) return <LoadError what="disputes" error={result.error} onRetry={reload} />;

  const disputes = data?.disputes ?? [];
  const pagination = data?.pagination;
  const counts = data?.counts;
  const open = (d: DisputeDto) => router.push(`/admin/orders/${d.orderId}`);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Disputes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {counts
            ? `${counts.open} open · ${counts.resolved} resolved. Funds stay in escrow until you refund the buyer or release to the seller.`
            : "Buyer disputes on orders held in escrow"}
        </p>
      </div>

      <div className={STAT_GRID}>
        <StatCard icon={Scale} label="Open disputes" value={counts ? counts.open : "…"} iconBg="bg-warning/10" iconColor="text-warning" />
        <StatCard icon={ShieldCheck} label="Resolved" value={counts ? counts.resolved : "…"} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatCard icon={CircleDollarSign} label="Held in disputes" value={data ? `$${data.stats.openValue.toLocaleString()}` : "…"} iconBg="bg-rose-500/10" iconColor="text-rose-500" />
        <StatCard icon={Clock} label="Oldest open" value={data ? waitingLabel(data.stats.oldestOpen) : "…"} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
      </div>

      <Card className="border border-border/50">
        <div className="flex flex-col gap-3 border-b border-border/50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={status}
            onValueChange={(v) => {
              selection.clear();
              setStatus(v as Status);
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="open">Open{counts ? ` (${counts.open})` : ""}</TabsTrigger>
              <TabsTrigger value="resolved">Resolved{counts ? ` (${counts.resolved})` : ""}</TabsTrigger>
              <TabsTrigger value="all">All{counts ? ` (${counts.all})` : ""}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search order, item, buyer or seller…"
              aria-label="Search disputes"
              className="w-full pl-8 sm:w-72"
            />
          </div>
        </div>

        <SelectionBar count={selection.count} onClear={selection.clear} onExport={() => downloadCsv("disputes", selection.rows)} />

        {Boolean(result.error) && data && (
          <p role="alert" className="border-b border-border/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
            Couldn&apos;t refresh the list.{" "}
            <button className="underline" onClick={reload}>
              Try again
            </button>
          </p>
        )}

        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          {disputes.length === 0 ? (
            <EmptyState
              icon={<Scale className="size-6 text-muted-foreground" />}
              title={status === "open" && !search ? "No open disputes" : "No disputes found"}
              description={status === "open" && !search ? "You're all caught up." : "Try a different filter or search."}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10">
                      <SelectAllCheckbox items={disputes} selection={selection} />
                    </TableHead>
                    {["Order", "Item", "Buyer → Seller", "Amount", "Reason", "Opened", "Status"].map((h) => (
                      <TableHead key={h} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {h}
                      </TableHead>
                    ))}
                    <TableHead className="w-24 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((d) => {
                    const image = resolveMediaUrl(d.order.listing.images?.[0]);
                    const stale = d.status === "open" && daysSince(d.openedAt) >= STALE_AFTER_DAYS;
                    return (
                      <TableRow key={d.id} className="cursor-pointer hover:bg-muted/20" onClick={() => open(d)}>
                      <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                        <RowCheckbox item={d} label={`dispute for ${d.order.listing.title}`} selection={selection} />
                      </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{d.orderId.slice(-8).toUpperCase()}
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
                            <p className="max-w-[200px] truncate text-sm font-medium" title={d.order.listing.title}>
                              {d.order.listing.title}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {d.order.buyer.name}
                          <span className="text-muted-foreground"> → </span>
                          {d.order.seller.name}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">${d.order.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline">{REASON_LABELS[d.reason] ?? d.reason}</Badge>
                            {d.details && (
                              <p className="max-w-[200px] truncate text-xs text-muted-foreground" title={d.details}>
                                {d.details}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={cn("text-sm", stale ? "font-medium text-warning" : "text-muted-foreground")}>
                          {age(d.openedAt)}
                        </TableCell>
                        <TableCell>
                          {d.status === "open" ? (
                            <Badge variant="outline" className="border-warning/20 bg-warning/10 text-warning">
                              Open
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                              {d.resolution === "refunded" ? "Refunded" : "Released"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={d.status === "open" ? "default" : "outline"}
                            onClick={(e) => {
                              e.stopPropagation();
                              open(d);
                            }}
                          >
                            {d.status === "open" ? "Resolve" : "View"}
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
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
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
    </div>
  );
}
