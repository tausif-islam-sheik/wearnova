"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Flag, Loader2, Search, ShieldCheck, User, XCircle, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadError } from "@/components/admin/LoadError";
import { TablePageSkeleton } from "@/components/admin/PageSkeletons";
import { api } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/utils";
import { PageNav } from "@/components/shared/PageNav";
import { StatCard, STAT_GRID } from "@/components/admin/StatCard";
import { useRowSelection } from "@/hooks/use-row-selection";
import { SelectionBar, SelectAllCheckbox, RowCheckbox } from "@/components/admin/SelectionBar";
import { downloadCsv } from "@/lib/csv";
import { runBatch, reportBatch } from "@/lib/batch";

type Status = "open" | "resolved" | "dismissed";

interface ReportTarget {
  type: "listing" | "user";
  id: string;
  title: string;
  image: string | null;
  status?: string;
  price?: number;
  sellerId?: string;
  sellerName?: string;
  email?: string;
  suspended?: boolean;
}

interface ReportDto {
  id: string;
  reporterId: string;
  targetType: "listing" | "user";
  targetId: string;
  reason: string;
  description: string | null;
  status: Status;
  createdAt: string;
  resolutionNote: string | null;
  resolvedAt: string | null;
  reporter: { id: string; name: string; email: string };
  target: ReportTarget | null;
}

interface ReportsResponse {
  reports: ReportDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  counts: Record<Status, number>;
}

const PAGE_SIZE = 20;

const REASON_LABELS: Record<string, string> = {
  counterfeit: "Counterfeit",
  not_as_described: "Not as described",
  damaged: "Damaged",
  inappropriate: "Inappropriate",
  other: "Other",
};

const STATUS_STYLES: Record<Status, string> = {
  open: "border-warning/20 bg-warning/10 text-warning",
  resolved: "border-success/20 bg-success/10 text-success",
  dismissed: "border-border bg-muted text-muted-foreground",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function TargetCell({ target, type }: { target: ReportTarget | null; type: "listing" | "user" }) {
  if (!target) {
    return <span className="text-sm text-muted-foreground">Removed {type}</span>;
  }
  const image = resolveMediaUrl(target.image);
  return (
    <div className="flex items-center gap-3">
      {image ? (
        <img src={image} alt="" className="size-10 shrink-0 rounded-md bg-muted object-cover" />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {type === "user" ? <User className="size-4" /> : <Flag className="size-4" />}
        </div>
      )}
      <div className="min-w-0">
        <p className="max-w-[240px] truncate text-sm font-medium text-foreground" title={target.title}>
          {target.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {type === "listing" ? `Listing · by ${target.sellerName}` : "User"}
          {target.status && target.status !== "active" ? ` · ${target.status}` : ""}
          {target.suspended ? " · suspended" : ""}
        </p>
      </div>
    </div>
  );
}

/** Review dialog body. Mounts fresh per report so its state starts from the report. */
function ReviewForm({
  report,
  onClose,
  onUpdated,
}: {
  report: ReportDto;
  onClose: () => void;
  onUpdated: (report: ReportDto) => void;
}) {
  const [note, setNote] = useState(report.resolutionNote ?? "");
  const [deactivate, setDeactivate] = useState(false);
  const [busy, setBusy] = useState<Status | null>(null);

  const canDeactivate =
    report.targetType === "listing" && report.target !== null && report.target.status !== "deactivated" && report.target.status !== "sold";

  const submit = async (status: Status) => {
    setBusy(status);
    try {
      const updated = await api.patch<ReportDto>(`/reports/${report.id}`, {
        status,
        note: status === "open" ? undefined : note.trim() || undefined,
        deactivateListing: status !== "open" && deactivate ? true : undefined,
      });
      onUpdated(updated);
      toast.success(
        status === "open" ? "Report reopened" : status === "resolved" ? "Report resolved" : "Report dismissed",
      );
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update the report");
      setBusy(null);
    }
  };

  const isOpen = report.status === "open";

  return (
    <>
      <DialogHeader>
        <DialogTitle>Review report</DialogTitle>
        <DialogDescription>
          Reported {formatDate(report.createdAt)} by {report.reporter.name}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="rounded border border-border/60 p-3">
          <TargetCell target={report.target} type={report.targetType} />
          {report.target && (
            <div className="mt-3 flex flex-wrap gap-2">
              {report.targetType === "listing" ? (
                <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/products/${report.targetId}`} target="_blank" />}>
                  <ExternalLink className="size-3.5" />
                  View listing
                </Button>
              ) : (
                <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/admin/users" />}>
                  <User className="size-3.5" />
                  Open users
                </Button>
              )}
              {report.targetType === "listing" && (
                <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/admin/products/${report.targetId}/edit`} />}>
                  Edit listing
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Reason</span>
            <Badge variant="outline">{REASON_LABELS[report.reason] ?? report.reason}</Badge>
            <Badge variant="outline" className={STATUS_STYLES[report.status]}>
              {report.status}
            </Badge>
          </div>
          <p className="whitespace-pre-line rounded bg-muted/40 px-3 py-2 text-foreground">
            {report.description || <span className="text-muted-foreground">No details provided.</span>}
          </p>
          <p className="text-xs text-muted-foreground">Reporter: {report.reporter.email}</p>
        </div>

        {isOpen ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="report-note">Resolution note (optional)</Label>
              <Textarea
                id="report-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="What did you decide, and why?"
              />
            </div>
            {canDeactivate && (
              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={deactivate}
                  onChange={(e) => setDeactivate(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--primary)]"
                />
                <span>
                  Also deactivate this listing
                  <span className="block text-xs text-muted-foreground">
                    It disappears from the marketplace. You can reactivate it from the product page.
                  </span>
                </span>
              </label>
            )}
          </>
        ) : (
          <div className="space-y-1 rounded border border-border/60 p-3 text-sm">
            <p className="font-medium">
              {report.status === "resolved" ? "Resolved" : "Dismissed"}
              {report.resolvedAt ? ` on ${formatDate(report.resolvedAt)}` : ""}
            </p>
            <p className="text-muted-foreground">{report.resolutionNote || "No note was left."}</p>
          </div>
        )}
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={busy !== null} />}>Close</DialogClose>
        {isOpen ? (
          <>
            <Button variant="outline" onClick={() => submit("dismissed")} disabled={busy !== null}>
              {busy === "dismissed" && <Loader2 className="size-4 animate-spin" />}
              Dismiss
            </Button>
            <Button onClick={() => submit("resolved")} disabled={busy !== null}>
              {busy === "resolved" ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Resolve
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => submit("open")} disabled={busy !== null}>
            {busy === "open" && <Loader2 className="size-4 animate-spin" />}
            Reopen
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

export default function ReportsPage() {
  const [status, setStatus] = useState<Status | "all">("open");
  const [reason, setReason] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const selection = useRowSelection<ReportDto>();
  const [reviewing, setReviewing] = useState<ReportDto | null>(null);

  // Debounce the search box; a new query always starts from page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const requestKey = `${status}|${reason}|${search}|${page}|${reloadKey}`;
  const [result, setResult] = useState<{
    key: string;
    data?: ReportsResponse;
    error?: unknown;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), status, reason });
    if (search) params.set("search", search);
    api
      .get<ReportsResponse>(`/reports?${params}`)
      .then((data) => !cancelled && setResult({ key: requestKey, data }))
      .catch((error) => !cancelled && setResult({ key: requestKey, error }));
    return () => {
      cancelled = true;
    };
    // requestKey already encodes every input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const loading = result?.key !== requestKey;
  const data = result?.data;
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  /** Only open reports can be closed; already-closed ones in the selection are skipped. */
  const bulkClose = async (status: "resolved" | "dismissed") => {
    const open = selection.rows.filter((r) => r.status === "open");
    const skipped = selection.count - open.length;
    if (open.length === 0) {
      toast.info("Nothing to close", { description: "Only open reports can be resolved or dismissed." });
      return;
    }
    const res = await runBatch(
      open.map((r) => r.id),
      (id) => api.patch(`/reports/${id}`, { status }),
    );
    reportBatch(status === "resolved" ? "Resolved" : "Dismissed", "report", res);
    if (skipped > 0) toast.message(`${skipped} skipped`, { description: "Already closed." });
    selection.clear();
    reload();
  };

  const counts = data?.counts;
  const totalAll = useMemo(() => (counts ? counts.open + counts.resolved + counts.dismissed : 0), [counts]);

  if (!result) return <TablePageSkeleton statCards={4} />;
  if (result.error && !data) {
    return <LoadError what="reports" error={result.error} onRetry={reload} />;
  }

  const reports = data?.reports ?? [];
  const pagination = data?.pagination;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {counts ? `${counts.open} open · ${totalAll} total` : "Review items flagged by the community"}
        </p>
      </div>

      <div className={STAT_GRID}>
        <StatCard icon={Flag} label="Open" value={counts ? counts.open : "…"} iconBg="bg-warning/10" iconColor="text-warning" />
        <StatCard icon={ShieldCheck} label="Resolved" value={counts ? counts.resolved : "…"} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatCard icon={XCircle} label="Dismissed" value={counts ? counts.dismissed : "…"} iconBg="bg-muted" iconColor="text-muted-foreground" />
        <StatCard icon={ListChecks} label="Total reports" value={counts ? totalAll : "…"} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
      </div>

      <Card className="border border-border/50">
        <div className="flex flex-col gap-3 border-b border-border/50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={status}
            onValueChange={(v) => {
              selection.clear();
              setStatus(v as Status | "all");
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="open">Open{counts ? ` (${counts.open})` : ""}</TabsTrigger>
              <TabsTrigger value="resolved">Resolved{counts ? ` (${counts.resolved})` : ""}</TabsTrigger>
              <TabsTrigger value="dismissed">Dismissed{counts ? ` (${counts.dismissed})` : ""}</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search details or reporter…"
                aria-label="Search reports"
                className="w-full pl-8 sm:w-64"
              />
            </div>
            <NativeSelect
              aria-label="Filter by reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setPage(1);
              }}
            >
              <NativeSelectOption value="all">All reasons</NativeSelectOption>
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>

        <SelectionBar count={selection.count} onClear={selection.clear} onExport={() => downloadCsv("reports", selection.rows)}>
          <Button size="sm" variant="outline" onClick={() => void bulkClose("dismissed")}>
            Dismiss
          </Button>
          <Button size="sm" onClick={() => void bulkClose("resolved")}>
            <ShieldCheck className="size-3.5" />
            Resolve
          </Button>
        </SelectionBar>

        {Boolean(result.error) && data && (
          <p role="alert" className="border-b border-border/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
            Couldn&apos;t refresh the list.{" "}
            <button className="underline" onClick={reload}>
              Try again
            </button>
          </p>
        )}

        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          {reports.length === 0 ? (
            <EmptyState
              icon={<Flag className="size-6 text-muted-foreground" />}
              title={status === "open" && !search && reason === "all" ? "No open reports" : "No reports found"}
              description={
                status === "open" && !search && reason === "all"
                  ? "You're all caught up."
                  : "Try a different filter or search."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10">
                      <SelectAllCheckbox items={reports} selection={selection} />
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reported item</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reason</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reporter</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</TableHead>
                    <TableHead className="w-24 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-muted/20" onClick={() => setReviewing(r)}>
                      <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                        <RowCheckbox item={r} label={`report on ${r.target?.title ?? r.targetType}`} selection={selection} />
                      </TableCell>
                      <TableCell>
                        <TargetCell target={r.target} type={r.targetType} />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline">{REASON_LABELS[r.reason] ?? r.reason}</Badge>
                          {r.description && (
                            <p className="max-w-[220px] truncate text-xs text-muted-foreground" title={r.description}>
                              {r.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.reporter.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_STYLES[r.status]}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={r.status === "open" ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewing(r);
                          }}
                        >
                          {r.status === "open" ? "Review" : "View"}
                        </Button>
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

      <Dialog open={reviewing !== null} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent>
          {reviewing && (
            <ReviewForm report={reviewing} onClose={() => setReviewing(null)} onUpdated={reload} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
