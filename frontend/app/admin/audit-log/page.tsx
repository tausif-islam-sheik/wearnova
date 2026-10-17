"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollText, Search, CalendarDays, Activity, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadError } from "@/components/admin/LoadError";
import { TablePageSkeleton } from "@/components/admin/PageSkeletons";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PageNav } from "@/components/shared/PageNav";
import { StatCard, STAT_GRID } from "@/components/admin/StatCard";
import { useRowSelection } from "@/hooks/use-row-selection";
import { SelectionBar, SelectAllCheckbox, RowCheckbox } from "@/components/admin/SelectionBar";
import { downloadCsv } from "@/lib/csv";

interface AuditLogDto {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  createdAt: string;
}

interface AuditResponse {
  logs: AuditLogDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  stats: { total: number; today: number; last7Days: number; activeAdmins: number };
}

const PAGE_SIZE = 25;

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "orders", label: "Orders" },
  { value: "users", label: "Users" },
  { value: "catalog", label: "Catalog" },
  { value: "moderation", label: "Moderation" },
  { value: "promos", label: "Promos" },
  { value: "settings", label: "Settings" },
  { value: "account", label: "Account" },
] as const;

/** Actions worth a second look: money moving, access removed, things deleted, keys or passwords. */
const SENSITIVE = new Set([
  "order.refund",
  "order.release",
  "user.suspend",
  "listing.delete",
  "brand.delete",
  "category.delete",
  "promo.delete",
  "banner.delete",
  "settings.stripe",
  "settings.fee",
  "account.password",
]);

function actionLabel(action: string) {
  const [group, verb = ""] = action.split(".");
  return `${group.charAt(0).toUpperCase()}${group.slice(1)} · ${verb.replace(/_/g, " ")}`;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLogPage() {
  const [category, setCategory] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const selection = useRowSelection<AuditLogDto>();

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const requestKey = `${category}|${search}|${page}|${reloadKey}`;
  const [result, setResult] = useState<{ key: string; data?: AuditResponse; error?: unknown } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);
    api
      .get<AuditResponse>(`/audit-logs?${params}`)
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
  if (result.error && !data) return <LoadError what="the audit log" error={result.error} onRetry={reload} />;

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;
  const filtered = category !== "all" || Boolean(search);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A record of changes made in the admin panel: who did what, and when.
        </p>
      </div>

      <div className={STAT_GRID}>
        <StatCard icon={ScrollText} label="Total entries" value={data ? data.stats.total.toLocaleString() : "…"} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
        <StatCard icon={CalendarDays} label="Today" value={data ? data.stats.today.toLocaleString() : "…"} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatCard icon={Activity} label="Last 7 days" value={data ? data.stats.last7Days.toLocaleString() : "…"} iconBg="bg-warning/10" iconColor="text-warning" />
        <StatCard icon={Users} label="Active admins (7 days)" value={data ? data.stats.activeAdmins : "…"} iconBg="bg-brand-primary/10" iconColor="text-brand-primary" />
      </div>

      <Card className="border border-border/50">
        <div className="flex flex-col gap-3 border-b border-border/50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={category}
            onValueChange={(v) => {
              selection.clear();
              setCategory(String(v));
              setPage(1);
            }}
          >
            <TabsList className="flex-wrap">
              {CATEGORIES.map((c) => (
                <TabsTrigger key={c.value} value={c.value}>
                  {c.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search summary, admin or ID…"
              aria-label="Search the audit log"
              className="w-full pl-8 sm:w-72"
            />
          </div>
        </div>

        <SelectionBar count={selection.count} onClear={selection.clear} onExport={() => downloadCsv("audit-log", selection.rows)} />

        {Boolean(result.error) && data && (
          <p role="alert" className="border-b border-border/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
            Couldn&apos;t refresh the list.{" "}
            <button className="underline" onClick={reload}>
              Try again
            </button>
          </p>
        )}

        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          {logs.length === 0 ? (
            <EmptyState
              icon={<ScrollText className="size-6 text-muted-foreground" />}
              title={filtered ? "No matching entries" : "Nothing recorded yet"}
              description={
                filtered
                  ? "Try a different category or search."
                  : "Changes made in the admin panel will show up here."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10">
                      <SelectAllCheckbox items={logs} selection={selection} />
                    </TableHead>
                    {["When", "Admin", "Action", "What happened"].map((h) => (
                      <TableHead key={h} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {h}
                      </TableHead>
                    ))}
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Target
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id} className="hover:bg-muted/20">
                      <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                        <RowCheckbox item={l} label={`entry: ${l.summary}`} selection={selection} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        <time dateTime={l.createdAt} title={new Date(l.createdAt).toISOString()}>
                          {formatWhen(l.createdAt)}
                        </time>
                      </TableCell>
                      <TableCell className="text-sm">{l.actorEmail}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "whitespace-nowrap capitalize",
                            SENSITIVE.has(l.action) && "border-warning/30 bg-warning/10 text-warning",
                          )}
                        >
                          {actionLabel(l.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[420px] text-sm">{l.summary}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {l.targetId ? `${l.targetType}:${l.targetId.slice(-8)}` : l.targetType}
                      </TableCell>
                    </TableRow>
                  ))}
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
