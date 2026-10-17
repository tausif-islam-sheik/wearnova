"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, MessageSquareText, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
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
import { runBatch, reportBatch } from "@/lib/batch";

type Visibility = "all" | "visible" | "hidden";

interface ReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  hidden: boolean;
  createdAt: string;
  reviewer: { id: string; name: string; avatarUrl: string | null };
  reviewee: { id: string; name: string };
}

interface ReviewsResponse {
  reviews: ReviewDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  counts: Record<Visibility, number>;
  average: number | null;
}

const PAGE_SIZE = 20;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("size-3.5", i <= rating ? "fill-warning text-warning" : "text-muted-foreground/30")}
        />
      ))}
    </span>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ReviewsPage() {
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [rating, setRating] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [hideTarget, setHideTarget] = useState<ReviewDto | null>(null);
  const [bulkHideOpen, setBulkHideOpen] = useState(false);
  const selection = useRowSelection<ReviewDto>();

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const requestKey = `${visibility}|${rating}|${search}|${page}|${reloadKey}`;
  const [result, setResult] = useState<{ key: string; data?: ReviewsResponse; error?: unknown } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), visibility });
    if (rating !== "all") params.set("rating", rating);
    if (search) params.set("search", search);
    api
      .get<ReviewsResponse>(`/reviews/admin/list?${params}`)
      .then((data) => !cancelled && setResult({ key: requestKey, data }))
      .catch((error) => !cancelled && setResult({ key: requestKey, error }));
    return () => {
      cancelled = true;
    };
    // requestKey already encodes every input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  /** Reviews already in the requested state are skipped. */
  const bulkSetHidden = async (hidden: boolean) => {
    const targets = selection.rows.filter((r) => r.hidden !== hidden);
    const skipped = selection.count - targets.length;
    if (targets.length === 0) {
      toast.info(hidden ? "Those reviews are already hidden" : "Those reviews are already visible");
      selection.clear();
      return;
    }
    const res = await runBatch(
      targets.map((r) => r.id),
      (id) => api.patch(`/reviews/${id}/hidden`, { hidden }),
    );
    reportBatch(hidden ? "Hid" : "Restored", "review", res);
    if (skipped > 0) toast.message(`${skipped} skipped`, { description: "Already in that state." });
    selection.clear();
    reload();
  };

  const setHidden = async (review: ReviewDto, hidden: boolean) => {
    try {
      await api.patch(`/reviews/${review.id}/hidden`, { hidden });
      toast.success(hidden ? "Review hidden" : "Review restored");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update the review");
      throw e;
    }
  };

  const loading = result?.key !== requestKey;
  const data = result?.data;

  if (!result) return <TablePageSkeleton statCards={4} />;
  if (result.error && !data) return <LoadError what="reviews" error={result.error} onRetry={reload} />;

  const reviews = data?.reviews ?? [];
  const pagination = data?.pagination;
  const counts = data?.counts;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {counts ? `${counts.all} reviews · ${counts.hidden} hidden` : "Moderate seller reviews"}
        </p>
      </div>

      <div className={STAT_GRID}>
        <StatCard icon={MessageSquareText} label="Total reviews" value={counts ? counts.all : "…"} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
        <StatCard icon={Eye} label="Visible" value={counts ? counts.visible : "…"} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatCard icon={EyeOff} label="Hidden" value={counts ? counts.hidden : "…"} iconBg="bg-muted" iconColor="text-muted-foreground" />
        <StatCard icon={Star} label="Average rating" value={!data ? "…" : data.average === null ? "—" : `${data.average.toFixed(1)} / 5`} iconBg="bg-warning/10" iconColor="text-warning" />
      </div>

      <Card className="border border-border/50">
        <div className="flex flex-col gap-3 border-b border-border/50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={visibility}
            onValueChange={(v) => {
              selection.clear();
              setVisibility(v as Visibility);
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">All{counts ? ` (${counts.all})` : ""}</TabsTrigger>
              <TabsTrigger value="visible">Visible{counts ? ` (${counts.visible})` : ""}</TabsTrigger>
              <TabsTrigger value="hidden">Hidden{counts ? ` (${counts.hidden})` : ""}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search comment, reviewer or seller…"
                aria-label="Search reviews"
                className="w-full pl-8 sm:w-72"
              />
            </div>
            <NativeSelect
              aria-label="Filter by rating"
              value={rating}
              onChange={(e) => {
                setRating(e.target.value);
                setPage(1);
              }}
            >
              <NativeSelectOption value="all">All ratings</NativeSelectOption>
              {[5, 4, 3, 2, 1].map((r) => (
                <NativeSelectOption key={r} value={String(r)}>
                  {r} star{r === 1 ? "" : "s"}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>

        <SelectionBar count={selection.count} onClear={selection.clear} onExport={() => downloadCsv("reviews", selection.rows)}>
          <Button size="sm" variant="outline" onClick={() => void bulkSetHidden(false)}>
            <Eye className="size-3.5" />
            Restore
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkHideOpen(true)}>
            <EyeOff className="size-3.5" />
            Hide
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
          {reviews.length === 0 ? (
            <EmptyState
              icon={<MessageSquareText className="size-6 text-muted-foreground" />}
              title={counts?.all === 0 ? "No reviews yet" : "No reviews found"}
              description={
                counts?.all === 0
                  ? "Reviews appear here after buyers rate a completed order."
                  : "Try a different filter or search."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10">
                      <SelectAllCheckbox items={reviews} selection={selection} />
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reviewer</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Seller</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rating</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Comment</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</TableHead>
                    <TableHead className="w-28 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((r) => (
                    <TableRow key={r.id} className={cn("hover:bg-muted/20", r.hidden && "bg-muted/20")}>
                      <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                        <RowCheckbox item={r} label={`review by ${r.reviewer.name}`} selection={selection} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            {r.reviewer.avatarUrl && (
                              <AvatarImage src={resolveMediaUrl(r.reviewer.avatarUrl)} alt="" />
                            )}
                            <AvatarFallback className="text-[10px]">{r.reviewer.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{r.reviewer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.reviewee.name}</TableCell>
                      <TableCell>
                        <Stars rating={r.rating} />
                      </TableCell>
                      <TableCell className="max-w-[320px]">
                        {r.comment ? (
                          <p className="line-clamp-2 text-sm" title={r.comment}>
                            {r.comment}
                          </p>
                        ) : (
                          <span className="text-sm text-muted-foreground">No comment</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                      <TableCell>
                        {r.hidden ? (
                          <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
                            Hidden
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                            Visible
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.hidden ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void setHidden(r, false).catch(() => {})}
                          >
                            <Eye className="size-3.5" />
                            Restore
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setHideTarget(r)}>
                            <EyeOff className="size-3.5" />
                            Hide
                          </Button>
                        )}
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

      <ConfirmDialog
        open={bulkHideOpen}
        onOpenChange={setBulkHideOpen}
        title={`Hide ${selection.count} review${selection.count === 1 ? "" : "s"}?`}
        description="They disappear from the sellers' profiles and stop counting toward their ratings. You can restore them any time."
        confirmLabel="Hide reviews"
        onConfirm={() => bulkSetHidden(true)}
      />

      <ConfirmDialog
        open={hideTarget !== null}
        onOpenChange={(open) => !open && setHideTarget(null)}
        title="Hide this review?"
        description={
          <>
            It will disappear from {hideTarget?.reviewee.name}&apos;s profile and no longer count toward their
            rating. You can restore it any time.
          </>
        }
        confirmLabel="Hide review"
        onConfirm={() => (hideTarget ? setHidden(hideTarget, true) : undefined)}
      />
    </div>
  );
}
