"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  DollarSign,
  Package,
  PackageX,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatCard, STAT_GRID } from "@/components/admin/StatCard";
import { DataTable, type DataTableColumn, type RowAction } from "@/components/admin/DataTable";
import { CopyButton } from "@/components/ui/copy-button";
import { useAdminLoading, TablePageSkeleton } from "@/components/admin/PageSkeletons";
import { api, fetchAllPages } from "@/lib/api";
import { toast } from "sonner";

interface OrderDto {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  total: number;
  status: string;
  createdAt: string;
  listing: { id: string; title: string; images: string[]; price: number };
  buyer: { id: string; name: string; email: string };
  seller: { id: string; name: string; email: string };
}


function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortOrderId(id: string): string {
  return id.replace("ord-", "#").slice(0, 9);
}

interface StatusMeta {
  label: string;
  badge: string;
  dot: string;
}

const STATUS_META: Record<string, StatusMeta> = {
  PENDING_PAYMENT: {
    label: "Pending Payment",
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  PAID_ESCROW: {
    label: "Paid (Escrow)",
    badge: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  SHIPPED: {
    label: "Shipped",
    badge: "bg-secondary text-secondary-foreground border-border",
    dot: "bg-secondary-foreground",
  },
  DELIVERED_CONFIRMED: {
    label: "Delivered",
    badge: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
  },
  DISPUTED: {
    label: "Disputed",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
  RELEASED_TO_SELLER: {
    label: "Released to Seller",
    badge: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
  },
  REFUNDED: {
    label: "Refunded",
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  };
  return (
    <Badge variant="outline" className={`font-medium ${meta.badge}`}>
      {meta.label}
    </Badge>
  );
}

function StatusSelect({
  order,
  onStatusChange,
}: {
  order: OrderDto;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [updating, setUpdating] = useState(false);

  return (
    <Select
      value={order.status}
      onValueChange={async (v) => {
        if (!v || v === order.status) return;
        const previous = order.status;
        onStatusChange(order.id, v);
        setUpdating(true);
        try {
          await api.patch(`/orders/${order.id}/status`, { status: v });
          toast.success(`Order marked as ${STATUS_META[v]?.label ?? v}`);
        } catch {
          onStatusChange(order.id, previous);
          toast.error("Failed to update order status");
        } finally {
          setUpdating(false);
        }
      }}
    >
      <SelectTrigger
        className="h-8 w-fit cursor-pointer gap-1 border-transparent bg-transparent p-0 pl-0.5 pr-1 hover:bg-muted/50 focus-visible:ring-0"
        onClick={(e) => e.stopPropagation()}
        disabled={updating}
      >
        <StatusPill status={order.status} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(STATUS_META).map(([value, meta]) => (
          <SelectItem key={value} value={value}>
            {meta.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function OrdersPage() {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const router = useRouter();
  const loading = useAdminLoading();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [total, setTotal] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchAllPages<OrderDto>("/orders", "orders")
      .then((res) => {
        setOrders(res.items);
        setTotal(res.total);
      })
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setDataLoading(false));
  }, []);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "PENDING_PAYMENT").length;
    const completed = orders.filter((o) => o.status === "RELEASED_TO_SELLER").length;
    const revenue = orders
      .filter((o) => o.status === "RELEASED_TO_SELLER")
      .reduce((sum, o) => sum + o.total, 0);
    return { total, pending, completed, revenue };
  }, [orders, total]);

  const updateOrderStatus = (id: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const columns: DataTableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: "id",
        label: "Order ID",
        sortable: true,
        className: "font-mono text-xs",
        render: (row) => {
          const order = row as unknown as OrderDto;
          return (
            <span className="inline-flex items-center gap-0.5 font-mono text-xs text-muted-foreground">
              {shortOrderId(order.id)}
              <CopyButton value={order.id} />
            </span>
          );
        },
      },
      {
        key: "listingId",
        label: "Product",
        sortable: true,
        sortValue: (row) => (row as unknown as OrderDto).listing.title,
        render: (row) => {
          const order = row as unknown as OrderDto;
          const thumb = order.listing.images?.[0];
          return (
            <div className="flex items-center gap-3">
              {thumb ? (
                <img src={thumb} alt="" className="size-10 shrink-0 rounded-md object-cover bg-muted" />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Package className="size-4 text-muted-foreground" />
                </div>
              )}
              <span
                className="max-w-[180px] truncate text-sm font-medium"
                title={order.listing.title}
              >
                {order.listing.title}
              </span>
            </div>
          );
        },
      },
      {
        key: "quantity",
        label: "Qty",
        sortable: true,
        align: "right",
        render: (row) => {
          const order = row as unknown as OrderDto;
          return (
            <span className="text-sm tabular-nums text-foreground">{order.quantity}</span>
          );
        },
      },
      {
        key: "buyerId",
        label: "Buyer",
        sortable: true,
        sortValue: (row) => (row as unknown as OrderDto).buyer.name,
        render: (row) => {
          const order = row as unknown as OrderDto;
          const isTestAccount = order.buyer.email.endsWith("@example.com");
          return (
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm text-muted-foreground">{order.buyer.name}</span>
              {isTestAccount && (
                <Badge
                  variant="outline"
                  className="shrink-0 text-[10px] font-medium text-muted-foreground"
                >
                  Test
                </Badge>
              )}
            </span>
          );
        },
      },
      {
        key: "total",
        label: "Amount",
        sortable: true,
        align: "right",
        render: (row) => {
          const order = row as unknown as OrderDto;
          return (
            <span className="text-sm font-semibold tabular-nums text-foreground">
              ${order.total.toLocaleString()}
            </span>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (row) => {
          const order = row as unknown as OrderDto;
          return <StatusSelect order={order} onStatusChange={updateOrderStatus} />;
        },
      },
      {
        key: "createdAt",
        label: "Date",
        sortable: true,
        render: (row) => {
          const order = row as unknown as OrderDto;
          return <span className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</span>;
        },
      },
    ],
    []
  );

  const rowActions: RowAction<Record<string, unknown>>[] = useMemo(() => [
    {
      label: "View",
      icon: <Eye className="size-3.5" />,
      onClick: (row) => router.push(`/admin/orders/${(row as unknown as OrderDto).id}`),
    },
  ], [router]);

  const tableData = useMemo(
    () =>
      orders
        .filter((o) => statusFilter === "all" || o.status === statusFilter)
        .map((o) => o as unknown as Record<string, unknown>),
    [orders, statusFilter]
  );

  if (loading || dataLoading) return <TablePageSkeleton statCards={4} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} total orders</p>
      </div>

      <div className={STAT_GRID}>
        <StatCard icon={ClipboardCheck} label="Total Orders" value={stats.total} iconBg="bg-brand-primary/10" iconColor="text-brand-primary" />
        <StatCard icon={Clock} label="Pending Orders" value={stats.pending} iconBg="bg-amber-500/10" iconColor="text-amber-500" />
        <StatCard icon={CheckCircle} label="Completed Orders" value={stats.completed} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatCard icon={DollarSign} label="Revenue" value={`$${stats.revenue.toLocaleString()}`} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        exportFileName="orders"
        searchPlaceholder="Search by order ID, buyer, or product..."
        searchKeys={["id", "buyerId", "sellerId", "listingId"]}
        filter={
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_META).map(([value, meta]) => (
                <SelectItem key={value} value={value}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No orders found"
        emptyDescription="No orders match your search criteria"
        emptyIcon={<PackageX className="size-6 text-muted-foreground" />}
        onRowClick={(row) => router.push(`/admin/orders/${(row as unknown as OrderDto).id}`)}
        rowActions={rowActions}
      />
    </div>
  );
}
