"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Users,
  ShoppingBag,
  ClipboardCheck,
  DollarSign,
  Package,
  BarChart3,
  Hash,
  ArrowUp,
  ArrowDown,
  Layers,
} from "lucide-react";
import { StatCard, STAT_GRID } from "@/components/admin/StatCard";
import { SectionCard } from "@/components/admin/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminLoading } from "@/components/admin/PageSkeletons";
import { LoadError } from "@/components/admin/LoadError";
import { BarChartComponent } from "@/components/admin/BarChartComponent";
import { DonutChart } from "@/components/admin/DonutChart";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { chartPalette } from "@/lib/chart-palette";
import type { ChartConfig } from "@/components/ui/chart";

interface AnalyticsData {
  summary: {
    totalUsers: number;
    newUsersThisMonth: number;
    userGrowth: number;
    totalListings: number;
    newListingsThisMonth: number;
    listingGrowth: number;
    totalOrders: number;
    orderGrowth: number;
    totalRevenue: number;
    revenueGrowth: number;
    avgOrderValue: number;
  };
  trends: {
    monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
  };
  ordersByStatus: Array<{ name: string; value: number }>;
  revenueByStatus: Array<{ name: string; value: number }>;
  listingStatus: Array<{ name: string; value: number }>;
  topBrands: Array<{ name: string; count: number }>;
  topCategories: Array<{ name: string; count: number }>;
  recentTransactions: Array<{
    id: string;
    productName: string;
    buyer: string;
    gross: number;
    fee: number;
    net: number;
    date: string;
  }>;
}

const orderChartConfig = {
  pending: { label: "Pending", color: "#a855f7" },
  paid: { label: "Paid", color: "#3b82f6" },
  shipped: { label: "Shipped", color: "#eab308" },
  delivered: { label: "Delivered", color: "#22c55e" },
  completed: { label: "Completed", color: "#9ca3af" },
  disputed: { label: "Disputed", color: "#ef4444" },
  cancelled: { label: "Cancelled", color: "#8b94a3" },
} satisfies ChartConfig;

const revenueChartConfig = {
  revenue: { label: "Revenue", color: chartPalette.primary },
} satisfies ChartConfig;

const listingChartConfig = {
  active: { label: "Active", color: chartPalette.primary },
  sold: { label: "Sold", color: chartPalette.neutralLight },
  reserved: { label: "Reserved", color: "#eab308" },
  deactivated: { label: "Deactivated", color: "#8b94a3" },
} satisfies ChartConfig;

const colors = ["var(--color-primary)", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ef4444", "#8b94a3", "#ec4899"];

function AnalyticsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className={STAT_GRID}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-6">
            <Skeleton className="h-4 w-28 mb-1" />
            <Skeleton className="h-3 w-44 mb-6" />
            <div className="flex items-center justify-center">
              <Skeleton className="size-48 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GrowthBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium gap-0.5 px-1.5 py-0.5 ${
        isPositive
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-500/30"
          : "bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-500/30"
      }`}
    >
      {isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(value)}%
    </Badge>
  );
}

export default function AnalyticsPage() {
  const loading = useAdminLoading();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api.get<AnalyticsData>("/admin/analytics")
      .then(setData)
      .catch((e) => {
        setData(null);
        setError(e);
      })
      .finally(() => setDataLoading(false));
  }, [reloadKey]);

  const revenueData = useMemo(
    () => (data?.trends.monthlyRevenue ?? []).map((r) => ({ name: r.month, value: r.revenue })),
    [data]
  );

  const orderTrendData = useMemo(
    () => (data?.trends.monthlyRevenue ?? []).map((r) => ({ name: r.month, value: r.orders })),
    [data]
  );

  if (loading || dataLoading) return <AnalyticsSkeleton />;
  if (!data) {
    return <LoadError what="analytics" error={error} onRetry={() => {
          setDataLoading(true);
          setError(null);
          setReloadKey((k) => k + 1);
        }}
      />;
  }

  const s = data.summary;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Advanced metrics and trends for your marketplace
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          icon={Users}
          label="Total Users"
          value={s.totalUsers.toLocaleString()}
          trend={<GrowthBadge value={s.userGrowth} />}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Products"
          value={s.totalListings.toLocaleString()}
          trend={<GrowthBadge value={s.listingGrowth} />}
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Total Orders"
          value={s.totalOrders.toLocaleString()}
          trend={<GrowthBadge value={s.orderGrowth} />}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-500"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${s.totalRevenue.toLocaleString()}`}
          trend={<GrowthBadge value={s.revenueGrowth} />}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-500"
        />
        <StatCard
          icon={BarChart3}
          label="Avg. Order Value"
          value={`$${s.avgOrderValue.toLocaleString()}`}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-500"
        />
        <StatCard
          icon={Hash}
          label="New This Month"
          value={`${s.newUsersThisMonth} / ${s.newListingsThisMonth}`}
          trend={`${s.totalOrders} orders`}
          iconBg="bg-rose-500/10"
          iconColor="text-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Revenue Trend" subtitle="Monthly revenue (12 months)">
          <BarChartComponent data={revenueData} config={revenueChartConfig} barColor="var(--color-brand-primary)" />
        </SectionCard>

        <SectionCard title="Orders by Status" subtitle="Distribution of order statuses">
          <DonutChart
            data={data.ordersByStatus.map((d, i) => ({ ...d, fill: colors[i % colors.length] }))}
            config={orderChartConfig}
            innerLabel={String(s.totalOrders)}
            innerSublabel="Total Orders"
          />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Listing Status" subtitle="Inventory breakdown">
          <BarChartComponent data={data.listingStatus} config={listingChartConfig} />
        </SectionCard>

        <SectionCard title="Order Volume Trend" subtitle="Monthly completed orders">
          <BarChartComponent data={orderTrendData} config={revenueChartConfig} barColor="#3b82f6" />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border border-border/50 rounded col-span-1">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Top Brands</h3>
            </div>
          </div>
          <div className="divide-y divide-border/50">
            {data.topBrands.map((brand, i) => (
              <div key={brand.name} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-sm font-medium text-foreground">{brand.name}</span>
                </div>
                <Badge variant="outline" className="text-xs font-medium">{brand.count}</Badge>
              </div>
            ))}
            {data.topBrands.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No brands available</div>
            )}
          </div>
        </Card>

        <Card className="border border-border/50 rounded col-span-1">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Top Categories</h3>
            </div>
          </div>
          <div className="divide-y divide-border/50">
            {data.topCategories.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-sm font-medium text-foreground">{cat.name}</span>
                </div>
                <Badge variant="outline" className="text-xs font-medium">{cat.count}</Badge>
              </div>
            ))}
            {data.topCategories.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No categories available</div>
            )}
          </div>
        </Card>

        <Card className="border border-border/50 rounded col-span-1">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Package className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
            </div>
          </div>
          <div className="divide-y divide-border/50">
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                    {tx.buyer.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.productName}</p>
                  <p className="text-xs text-muted-foreground truncate">{tx.buyer}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">${tx.net.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Fee: ${tx.fee.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {data.recentTransactions.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No transactions yet</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
