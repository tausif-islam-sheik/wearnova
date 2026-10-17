"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Flag,
  HandCoins,
  Package,
  Scale,
  Truck,
  Undo2,
  Wallet,
  Landmark,
} from "lucide-react";
import { SectionCard } from "@/components/admin/SectionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DashboardData {
  attention: {
    disputes: { open: number; value: number; oldest: string | null };
    reports: { open: number; oldest: string | null };
    toShip: { count: number; oldest: string | null };
    awaitingConfirmation: number;
    staleListings: number;
  };
  finance: {
    platformEarnings: number;
    paidOut: number;
    heldInEscrow: number;
    escrowOrders: number;
    refunded: number;
    refundedOrders: number;
  };
  pipeline: Record<string, number>;
  topSellers: { id: string; name: string; revenue: number; orders: number }[];
  topCategories: { name: string; revenue: number; orders: number }[];
  recentActivity: { id: string; actorEmail: string; action: string; summary: string; createdAt: string }[];
}

const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: n >= 1000 ? 0 : 2 })}`;

/** "3 days", "5 hr", "just now": how long ago something happened. */
function since(iso: string | null) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.floor(ms / 3_600_000);
  return hours >= 1 ? `${hours} hr` : "just now";
}

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

/* ── Needs attention ─────────────────────────────────────────────── */

export function AttentionCard({ data }: { data: DashboardData | null }) {
  const a = data?.attention;
  const items = a
    ? [
        {
          href: "/admin/disputes",
          icon: Scale,
          label: "Open disputes",
          count: a.disputes.open,
          hint: a.disputes.open
            ? `${money(a.disputes.value)} held in escrow · oldest ${since(a.disputes.oldest)}`
            : "No disputes waiting",
          urgent: true,
        },
        {
          href: "/admin/reports",
          icon: Flag,
          label: "Open reports",
          count: a.reports.open,
          hint: a.reports.open ? `Oldest waiting ${since(a.reports.oldest)}` : "No reports waiting",
          urgent: true,
        },
        {
          href: "/admin/orders",
          icon: Truck,
          label: "Paid, waiting to ship",
          count: a.toShip.count,
          hint: a.toShip.count ? `Oldest paid ${since(a.toShip.oldest)} ago` : "Nothing waiting to ship",
          urgent: false,
        },
        {
          href: "/admin/orders",
          icon: Package,
          label: "Shipped, awaiting confirmation",
          count: a.awaitingConfirmation,
          hint: a.awaitingConfirmation ? "Funds release once buyers confirm" : "Nothing in transit",
          urgent: false,
        },
        {
          href: "/admin/inventory",
          icon: Clock,
          label: "Stale listings",
          count: a.staleListings,
          hint: a.staleListings ? "Active for 90+ days without selling" : "No stale listings",
          urgent: false,
        },
      ]
    : [];
  const open = items.filter((i) => i.count > 0).length;

  return (
    <SectionCard
      title="Needs attention"
      subtitle={
        data ? (open ? `${open} of ${items.length} queues need a look` : "Everything is up to date") : "Loading…"
      }
    >
      {!data ? (
        <SectionSkeleton rows={5} />
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((item) => (
            <li key={item.label} className="py-3 first:pt-0 last:pb-0">
              <Link
                href={item.href}
                className="group flex items-center gap-3 rounded outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    item.count > 0 ? (item.urgent ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning") : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.count > 0 ? <item.icon className="size-4" /> : <CheckCircle2 className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.hint}</p>
                </div>
                <span
                  className={cn(
                    "min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums",
                    item.count > 0 ? (item.urgent ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning") : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.count}
                </span>
                <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* ── Earnings & escrow ───────────────────────────────────────────── */

export function MoneyFlowCard({ data }: { data: DashboardData | null }) {
  const f = data?.finance;
  const tiles = f
    ? [
        { icon: Landmark, label: "Platform earnings", value: f.platformEarnings, hint: "Commission on released orders", tone: "text-emerald-500 bg-emerald-500/10" },
        { icon: Wallet, label: "Held in escrow", value: f.heldInEscrow, hint: `${f.escrowOrders} order${f.escrowOrders === 1 ? "" : "s"} in progress`, tone: "text-warning bg-warning/10" },
        { icon: HandCoins, label: "Paid out to sellers", value: f.paidOut, hint: "After the platform fee", tone: "text-blue-500 bg-blue-500/10" },
        { icon: Undo2, label: "Refunded to buyers", value: f.refunded, hint: `${f.refundedOrders} refunded order${f.refundedOrders === 1 ? "" : "s"}`, tone: "text-rose-500 bg-rose-500/10" },
      ]
    : [];

  return (
    <SectionCard title="Earnings & escrow" subtitle="Where the money is right now">
      {!data ? (
        <SectionSkeleton rows={4} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tiles.map((t) => (
            <div key={t.label} className="rounded border border-border/50 bg-muted/20 p-3">
              <div className="flex items-center gap-2.5">
                <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", t.tone)}>
                  <t.icon className="size-4" />
                </div>
                <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.label}</p>
              </div>
              <p className="mt-2 text-xl font-bold tracking-tight text-foreground">{money(t.value)}</p>
              <p className="text-xs text-muted-foreground">{t.hint}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* ── Order pipeline ──────────────────────────────────────────────── */

const PIPELINE: { key: string; label: string; bar: string }[] = [
  { key: "PENDING_PAYMENT", label: "Awaiting payment", bar: "bg-muted-foreground/50" },
  { key: "PAID_ESCROW", label: "Paid (in escrow)", bar: "bg-warning" },
  { key: "SHIPPED", label: "Shipped", bar: "bg-blue-500" },
  { key: "DELIVERED_CONFIRMED", label: "Delivery confirmed", bar: "bg-teal-500" },
  { key: "RELEASED_TO_SELLER", label: "Released to seller", bar: "bg-success" },
  { key: "DISPUTED", label: "Disputed", bar: "bg-destructive" },
  { key: "REFUNDED", label: "Refunded", bar: "bg-rose-400" },
  { key: "CANCELLED", label: "Cancelled", bar: "bg-muted-foreground/30" },
];

export function PipelineCard({ data }: { data: DashboardData | null }) {
  const rows = PIPELINE.map((p) => ({ ...p, count: data?.pipeline[p.key] ?? 0 }));
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <SectionCard title="Order pipeline" subtitle={data ? `${total} order${total === 1 ? "" : "s"} by stage` : "Loading…"}>
      {!data ? (
        <SectionSkeleton rows={5} />
      ) : total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label="Orders by stage">
            {rows
              .filter((r) => r.count > 0)
              .map((r) => (
                <div key={r.key} className={r.bar} style={{ width: `${(r.count / total) * 100}%` }} title={`${r.label}: ${r.count}`} />
              ))}
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {rows.map((r) => (
              <li key={r.key} className={cn("flex items-center gap-2 text-sm", r.count === 0 && "text-muted-foreground/60")}>
                <span className={cn("size-2.5 shrink-0 rounded-full", r.bar)} />
                <span className="truncate">{r.label}</span>
                <span className="ml-auto tabular-nums font-medium">{r.count}</span>
                <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                  {Math.round((r.count / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </SectionCard>
  );
}

/* ── Top sellers / categories ────────────────────────────────────── */

export function TopListCard({
  title,
  subtitle,
  rows,
  loading,
}: {
  title: string;
  subtitle: string;
  rows: { name: string; revenue: number; orders: number }[];
  loading: boolean;
}) {
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  return (
    <SectionCard title={title} subtitle={subtitle}>
      {loading ? (
        <SectionSkeleton rows={5} />
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No completed sales yet.</p>
      ) : (
        <ol className="space-y-3">
          {rows.map((r, i) => (
            <li key={r.name} className="text-sm">
              <div className="flex items-baseline gap-2">
                <span className="w-4 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="truncate font-medium">{r.name}</span>
                <span className="ml-auto shrink-0 tabular-nums text-foreground">{money(r.revenue)}</span>
                <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {r.orders} order{r.orders === 1 ? "" : "s"}
                </span>
              </div>
              <div className="ml-6 mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(r.revenue / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}

/* ── Recent admin activity ───────────────────────────────────────── */

export function ActivityCard({ data }: { data: DashboardData | null }) {
  const rows = data?.recentActivity ?? [];
  return (
    <SectionCard
      title="Recent admin activity"
      subtitle="The latest changes made in the panel"
      action={
        <Link href="/admin/audit-log" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          View audit log
          <ArrowRight className="size-3.5" />
        </Link>
      }
    >
      {!data ? (
        <SectionSkeleton rows={5} />
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No admin activity recorded yet.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {rows.map((a) => (
            <li key={a.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{a.summary}</p>
                <p className="truncate text-xs text-muted-foreground">{a.actorEmail}</p>
              </div>
              <time dateTime={a.createdAt} className="shrink-0 text-xs text-muted-foreground" title={new Date(a.createdAt).toLocaleString()}>
                {since(a.createdAt) === "just now" ? "just now" : `${since(a.createdAt)} ago`}
              </time>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
