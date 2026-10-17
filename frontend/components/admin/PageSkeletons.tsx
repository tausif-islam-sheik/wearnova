import { Skeleton } from "@/components/ui/skeleton";

/**
 * Kept so existing pages keep compiling: pages now show skeletons only while their own
 * data loads, instead of waiting out an artificial delay.
 */
export function useAdminLoading(): boolean {
  return false;
}

export function PageHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-36" />
      </div>
      {action && <Skeleton className="h-9 w-32" />}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded border border-border/50 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="size-9 rounded" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-7 w-16" />
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  const cols = "grid-cols-[42px_260px_150px_130px_100px_110px_70px_42px]";
  return (
    <div className="rounded border border-border/50 bg-card">
      <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3 sm:flex-row sm:items-center">
        <Skeleton className="h-9 w-full sm:max-w-sm sm:flex-1" />
        <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      <div className={cols}>
        <Skeleton className="size-4 ml-2 my-4" />
        <Skeleton className="h-3 w-16 my-5" />
        <Skeleton className="h-3 w-14 my-5" />
        <Skeleton className="h-3 w-12 my-5" />
        <Skeleton className="h-3 w-12 mx-auto my-5" />
        <Skeleton className="h-3 w-14 mx-auto my-5" />
        <Skeleton className="h-3 w-10 mx-auto my-5" />
        <Skeleton className="size-4 mx-auto my-4" />
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`${cols} items-center px-2 py-3`}>
            <Skeleton className="size-4 mx-auto" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-12 mx-auto" />
            <Skeleton className="h-5 w-14 mx-auto rounded-full" />
            <Skeleton className="h-3.5 w-8 mx-auto" />
            <div className="flex items-center justify-center">
              <Skeleton className="size-6 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-[70px]" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
        </div>
      </div>
    </div>
  );
}

export function TablePageSkeleton({
  statCards = 3,
  tableRows = 8,
  headerAction = false,
  statGridClass = "grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]",
}: {
  statCards?: number;
  tableRows?: number;
  headerAction?: boolean;
  statGridClass?: string;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-300">
      <PageHeaderSkeleton action={headerAction} />
      <div className={`grid ${statGridClass}`}>
        {Array.from({ length: statCards }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton rows={tableRows} />
    </div>
  );
}

export function ChartPageSkeleton({ statCards = 4 }: { statCards?: number }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-300">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: statCards }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded border border-border/50 bg-card p-6">
            <Skeleton className="h-4 w-28 mb-1" />
            <Skeleton className="h-3 w-44 mb-6" />
            <div className="flex items-center justify-center">
              <Skeleton className="size-48 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded border border-border/50 bg-card p-6">
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-36 mb-6" />
        <div className="flex items-end gap-6 h-48">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${40 + Math.random() * 60}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormPageSkeleton({ tabs = 0 }: { tabs?: number }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded" />
        <div>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      {tabs > 0 && (
        <div className="flex gap-2">
          {Array.from({ length: tabs }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded" />
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        <div className="rounded border border-border/50 bg-card p-5 space-y-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-px flex-1" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-px flex-1" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <div className="space-y-5">
          <div className="rounded border border-border/50 bg-card p-5 space-y-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-px flex-1" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-px flex-1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded border border-border/50" />
              ))}
            </div>
            <Skeleton className="h-20 w-full rounded border border-border/50" />
          </div>
          <div className="rounded border border-border/50 bg-card p-5 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  );
}

export function EmptyPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-300">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCardSkeleton />
      </div>
      <div className="rounded border border-border/50 bg-card p-12">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
    </div>
  );
}
