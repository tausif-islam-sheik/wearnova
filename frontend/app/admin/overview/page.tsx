"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ShoppingBag,
  ClipboardCheck,
  DollarSign,
  AlertTriangle,
  LayoutGrid,
  Package,
  MoreVertical,
} from "lucide-react";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatCard, STAT_GRID } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/DatePicker";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChartComponent } from "@/components/admin/BarChartComponent";
import { PieChartComponent } from "@/components/admin/PieChartComponent";
import { useAdminLoading } from "@/components/admin/PageSkeletons";
import { LoadError } from "@/components/admin/LoadError";
import {
  ActivityCard,
  AttentionCard,
  MoneyFlowCard,
  PipelineCard,
  TopListCard,
  type DashboardData,
} from "./dashboard-sections";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { chartPalette } from "@/lib/chart-palette";
import type { ChartConfig } from "@/components/ui/chart";

interface AdminStats {
  users: number;
  listings: number;
  orders: number;
  orderStats: {
    total: number;
    pendingPayment: number;
    paidEscrow: number;
    pending: number;
    released: number;
    shipped: number;
    disputed: number;
    cancelled: number;
    revenue: number;
  };
  listingStats: {
    active: number;
    sold: number;
    reserved: number;
    deactivated: number;
  };
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
    listing: { id: string; title: string; price: number };
    buyer: { id: string; name: string };
    seller: { id: string; name: string };
  }>;
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
  revenueSeries: Array<{ label: string; revenue: number; orders: number }>;
}

type RevenuePeriod = "week" | "month" | "year" | "custom";

const PERIOD_OPTIONS: { value: RevenuePeriod; label: string }[] = [
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
  { value: "custom", label: "Custom" },
];

const PERIOD_SUBTITLES: Record<Exclude<RevenuePeriod, "custom">, string> = {
  week: "Weekly revenue (last 7 days)",
  month: "Monthly revenue (YTD)",
  year: "Yearly revenue",
};

interface RevenueRange {
  from: string;
  to: string;
  days: number;
  bucket: "day" | "week" | "month";
  totalRevenue: number;
  totalOrders: number;
}

interface RevenueResponse {
  series: Array<{ label: string; revenue: number; orders: number }>;
  range: RevenueRange | null;
}

/** Orders are bucketed by UTC day on the server, so the date pickers work in UTC too. */
const todayUtc = () => new Date().toISOString().slice(0, 10);
const daysAgoUtc = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

/** Mirrors the server's rules so a bad range is explained instantly instead of after a round trip. */
function validateRange(from: string, to: string): string | null {
  if (!from || !to) return "Choose both a start and an end date.";
  if (from > to) return "The start date must be on or before the end date.";
  if (to > todayUtc()) return "The end date can't be in the future.";
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
  if (days > 731) return "Choose a range of two years or less.";
  return null;
}

const formatDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const BUCKET_LABEL = { day: "daily", week: "weekly", month: "monthly" } as const;

const statusChartConfig = {
  active: { label: "Active", color: chartPalette.primary },
  sold: { label: "Sold", color: chartPalette.neutralLight },
  reserved: { label: "Reserved", color: chartPalette.amber },
  deactivated: { label: "Deactivated", color: chartPalette.red },
} satisfies ChartConfig;

function CardOverflowMenu({ items }: { items: OverflowMenuItem[] }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8 text-muted-foreground" />}>
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            className="cursor-pointer"
            onClick={() => (item.href ? router.push(item.href) : item.onClick?.())}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface OverflowMenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

function downloadCsv(filename: string, rows: { name: string; value: number }[]) {
  const header = "Label,Value";
  const body = rows.map((r) => `${r.name},${r.value}`).join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className={STAT_GRID}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <Skeleton className="h-4 w-28 mb-1" />
          <Skeleton className="h-3 w-44 mb-6" />
          <div className="flex items-center justify-center">
            <Skeleton className="size-48 rounded-full" />
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-36 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const loading = useAdminLoading();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [period, setPeriod] = useState<RevenuePeriod>("month");
  const [revenueData, setRevenueData] = useState<{ name: string; value: number }[]>([]);
  const [range, setRange] = useState(() => ({ from: daysAgoUtc(29), to: todayUtc() }));
  const [revenueRange, setRevenueRange] = useState<RevenueRange | null>(null);
  const rangeError = period === "custom" ? validateRange(range.from, range.to) : null;

  const [statsError, setStatsError] = useState<unknown>(null);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [dashFailed, setDashFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api.get<AdminStats>("/admin/stats")
      .then(setStats)
      .catch((e) => {
        setStats(null);
        setStatsError(e);
      })
      .finally(() => setStatsLoading(false));
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    api.get<DashboardData>("/admin/dashboard")
      .then((d) => {
        if (cancelled) return;
        setDash(d);
        setDashFailed(false);
      })
      .catch(() => !cancelled && setDashFailed(true));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    // An invalid custom range is explained under the date pickers; don't ask the server for it.
    if (period === "custom" && validateRange(range.from, range.to)) return;
    const query = period === "custom" ? `period=custom&from=${range.from}&to=${range.to}` : `period=${period}`;
    api.get<RevenueResponse>(`/admin/revenue?${query}`)
      .then((res) => {
        if (cancelled) return;
        setRevenueData((res.series ?? []).map((r) => ({ name: r.label, value: r.revenue })));
        setRevenueRange(res.range);
      })
      .catch(() => {
        if (cancelled) return;
        setRevenueData([]);
        toast.error("Couldn't load the revenue chart");
      });
    return () => {
      cancelled = true;
    };
  }, [period, range.from, range.to]);

  const computed = useMemo(() => {
    if (!stats) return null;
    const ls = stats.listingStats;
    return {
      totalUsers: stats.users,
      totalProducts: stats.listings,
      activeProducts: ls.active,
      totalOrders: stats.orderStats.total,
      pendingOrders:
        stats.orderStats.pendingPayment +
        stats.orderStats.paidEscrow +
        stats.orderStats.shipped,
      completedRevenue: stats.orderStats.revenue,
    };
  }, [stats]);

  const statusData = useMemo(() => {
    if (!stats) return [];
    const ls = stats.listingStats;
    return [
      { name: "Active", value: ls.active, fill: chartPalette.primary },
      { name: "Sold", value: ls.sold, fill: chartPalette.neutralLight },
      { name: "Reserved", value: ls.reserved, fill: chartPalette.amber },
      { name: "Deactivated", value: ls.deactivated, fill: chartPalette.red },
    ].filter((s) => s.value > 0);
  }, [stats]);

  const revenueChartConfig = {
    revenue: { label: "Revenue", color: chartPalette.primary },
  } satisfies ChartConfig;

  if (loading || statsLoading) return <DashboardSkeleton />;
  if (!computed) {
    return (
      <LoadError what="dashboard data" error={statsError} onRetry={() => {
          setStatsLoading(true);
          setStatsError(null);
          setReloadKey((k) => k + 1);
        }}
      />
    );
  }

  const recentOrders = stats?.recentOrders ?? [];
  const ls = stats!.listingStats;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, Admin</p>
      </div>

      <div className={STAT_GRID}>
        <StatCard icon={Users} label="Total Users" value={computed.totalUsers} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
        <StatCard icon={ShoppingBag} label="Total Products" value={computed.totalProducts} iconBg="bg-primary/10" iconColor="text-primary" />
        <StatCard icon={ClipboardCheck} label="Total Orders" value={computed.totalOrders} iconBg="bg-amber-500/10" iconColor="text-amber-500" />
        <StatCard icon={DollarSign} label="Revenue" value={`$${Math.round(computed.completedRevenue).toLocaleString()}`} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatCard icon={LayoutGrid} label="Active Products" value={computed.activeProducts} iconBg="bg-primary/10" iconColor="text-primary" />
        <StatCard icon={AlertTriangle} label="Pending Orders" value={computed.pendingOrders} iconBg="bg-rose-500/10" iconColor="text-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="Revenue"
          subtitle={
            period === "custom"
              ? revenueRange && !rangeError
                ? `${formatDay(revenueRange.from)} – ${formatDay(revenueRange.to)} · ${BUCKET_LABEL[revenueRange.bucket]}`
                : "Custom date range"
              : PERIOD_SUBTITLES[period]
          }
          action={
            <div className="flex items-center gap-1.5">
              <div className="flex items-center rounded-full border border-border/50 bg-muted/30 p-0.5">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPeriod(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      period === opt.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <CardOverflowMenu
                items={[
                  { label: "View transactions", href: "/admin/transactions" },
                  {
                    label: "Export data",
                    onClick: () => downloadCsv("revenue.csv", revenueData),
                  },
                ]}
              />
            </div>
          }
        >
          {period === "custom" && (
            <div className="mb-3 space-y-3 rounded border border-border/50 bg-muted/20 p-3">
              <div className="flex flex-wrap items-start gap-3">
                <div className="space-y-1">
                  <Label htmlFor="rev-from" className="text-xs text-muted-foreground">
                    From
                  </Label>
                  <DatePicker
                    id="rev-from"
                    value={range.from}
                    max={range.to || todayUtc()}
                    invalid={Boolean(rangeError)}
                    onChange={(from) => setRange((r) => ({ ...r, from }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rev-to" className="text-xs text-muted-foreground">
                    To
                  </Label>
                  <DatePicker
                    id="rev-to"
                    value={range.to}
                    min={range.from || undefined}
                    max={todayUtc()}
                    invalid={Boolean(rangeError)}
                    onChange={(to) => setRange((r) => ({ ...r, to }))}
                  />
                </div>
              </div>
              {rangeError ? (
                <p role="alert" className="text-xs text-destructive">
                  {rangeError}
                </p>
              ) : (
                revenueRange && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">${revenueRange.totalRevenue.toLocaleString()}</span>{" "}
                    from {revenueRange.totalOrders} order{revenueRange.totalOrders === 1 ? "" : "s"} in {revenueRange.days} day
                    {revenueRange.days === 1 ? "" : "s"} (dates in UTC)
                  </p>
                )
              )}
            </div>
          )}
          {period === "custom" && !rangeError && revenueRange && revenueRange.totalRevenue === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No revenue in this date range.</p>
          ) : (
            <div className={rangeError ? "opacity-40" : undefined}>
              <BarChartComponent data={revenueData} config={revenueChartConfig} barColor="var(--color-brand-primary)" />
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Products by Status"
          subtitle="Inventory breakdown"
          action={
            <CardOverflowMenu
              items={[
                { label: "View all products", href: "/admin/products" },
                {
                  label: "Export data",
                  onClick: () => downloadCsv("products-by-status.csv", statusData),
                },
              ]}
            />
          }
        >
          <PieChartComponent data={statusData} config={statusChartConfig} height={260} />
        </SectionCard>
      </div>

      {dashFailed && !dash && (
        <p role="alert" className="rounded border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load the attention queue and earnings sections.{" "}
          <button
            className="underline"
            onClick={() => {
              setDashFailed(false);
              setReloadKey((k) => k + 1);
            }}
          >
            Try again
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AttentionCard data={dash} />
        <MoneyFlowCard data={dash} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PipelineCard data={dash} />
        <TopListCard
          title="Sales by category"
          subtitle="Top categories by completed sales"
          rows={dash?.topCategories ?? []}
          loading={!dash}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopListCard
          title="Top sellers"
          subtitle="By completed sales"
          rows={dash?.topSellers ?? []}
          loading={!dash}
        />
        <ActivityCard data={dash} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Recent Orders" subtitle={`Last ${recentOrders.length} orders`}>
          <div className="space-y-0 divide-y divide-border/50">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="size-10 rounded-md bg-muted shrink-0 flex items-center justify-center">
                  <Package className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{order.listing.title}</p>
                  <p className="text-xs text-muted-foreground">{order.seller.name} → {order.buyer.name}</p>
                </div>
                <p className="text-sm font-semibold text-foreground shrink-0">${order.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Platform Overview" subtitle="Key metrics at a glance">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Products by Status
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Active", count: ls.active, color: "bg-primary/10 text-primary border-primary/20" },
                  { label: "Sold", count: ls.sold, color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30" },
                  { label: "Reserved", count: ls.reserved, color: "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-300 dark:border-amber-500/30" },
                ].map((s) => (
                  <Badge key={s.label} variant="outline" className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${s.color}`}>
                    {s.label}: {s.count}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border/50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-lg font-bold text-foreground">${computed.completedRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Order Value</p>
                  <p className="text-lg font-bold text-foreground">
                    ${stats!.orderStats.released > 0 ? Math.round(computed.completedRevenue / stats!.orderStats.released).toLocaleString() : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
