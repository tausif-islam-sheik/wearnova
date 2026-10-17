"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, DollarSign, TrendingUp, Wallet } from "lucide-react";
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
import { fetchAllPages } from "@/lib/api";
import { toast } from "sonner";

interface TransactionDto {
  id: string;
  orderId: string;
  gross: number;
  fee: number;
  net: number;
  status: string;
  payout: string | null;
  date: string;
  order: {
    id: string;
    listing: { title: string; images: string[] };
    buyer: { name: string };
  };
}


const statusStyle: Record<string, string> = {
  completed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  refunded: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function TransactionsPage() {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const router = useRouter();
  const loading = useAdminLoading();
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    fetchAllPages<TransactionDto>("/transactions", "transactions")
      .then((res) => {
        setTransactions(res.items);
      })
      .catch(() => toast.error("Failed to load transactions"))
      .finally(() => setDataLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalGross = transactions.reduce((s, t) => s + t.gross, 0);
    const totalFees = transactions.reduce((s, t) => s + t.fee, 0);
    const totalNet = transactions.reduce((s, t) => s + t.net, 0);
    return { totalGross, totalFees, totalNet, count: transactions.length };
  }, [transactions]);

  const columns: DataTableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: "id",
        label: "Transaction ID",
        sortable: true,
        render: (row) => {
          const txn = row as unknown as TransactionDto;
          return (
            <span className="inline-flex items-center gap-0.5 font-mono text-xs text-muted-foreground">
              {txn.id}
              <CopyButton value={txn.id} />
            </span>
          );
        },
      },
      {
        key: "productName",
        label: "Product",
        sortable: true,
        sortValue: (row) => (row as unknown as TransactionDto).order.listing.title,
        render: (row) => {
          const txn = row as unknown as TransactionDto;
          return (
            <span className="max-w-[160px] truncate text-sm font-medium" title={txn.order.listing.title}>
              {txn.order.listing.title}
            </span>
          );
        },
      },
      {
        key: "buyer",
        label: "Buyer",
        sortable: true,
        sortValue: (row) => (row as unknown as TransactionDto).order.buyer.name,
        render: (row) => {
          const txn = row as unknown as TransactionDto;
          return <span className="truncate text-sm text-muted-foreground">{txn.order.buyer.name}</span>;
        },
      },
      {
        key: "gross",
        label: "Gross",
        sortable: true,
        align: "right",
        render: (row) => {
          const txn = row as unknown as TransactionDto;
          return <span className="text-sm font-medium tabular-nums">${txn.gross.toLocaleString()}</span>;
        },
      },
      {
        key: "fee",
        label: "Fee",
        sortable: true,
        align: "right",
        render: (row) => {
          const txn = row as unknown as TransactionDto;
          return <span className="text-sm tabular-nums text-muted-foreground">${txn.fee.toLocaleString()}</span>;
        },
      },
      {
        key: "net",
        label: "Net",
        sortable: true,
        align: "right",
        render: (row) => {
          const txn = row as unknown as TransactionDto;
          return <span className="text-sm font-semibold tabular-nums text-foreground">${txn.net.toLocaleString()}</span>;
        },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (row) => {
          const txn = row as unknown as TransactionDto;
          return (
            <Badge
              variant="outline"
              className={`font-medium capitalize ${statusStyle[txn.status] ?? "bg-muted text-muted-foreground border-border"}`}
            >
              {txn.status}
            </Badge>
          );
        },
      },
      {
        key: "payout",
        label: "Payout",
        sortable: true,
        render: (row) => {
          const txn = row as unknown as TransactionDto;
          return <span className="text-sm text-muted-foreground">{txn.payout ?? "—"}</span>;
        },
      },
      {
        key: "date",
        label: "Date",
        sortable: true,
        render: (row) => {
          const txn = row as unknown as TransactionDto;
          return <span className="text-sm text-muted-foreground">{new Date(txn.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>;
        },
      },
    ],
    []
  );

  const rowActions: RowAction<Record<string, unknown>>[] = useMemo(() => [
    {
      label: "View details",
      onClick: (row) =>
        router.push(`/admin/transactions/${(row as unknown as TransactionDto).id}`),
    },
  ], [router]);

  const tableData = useMemo(
    () => transactions.map((t) => t as unknown as Record<string, unknown>),
    [transactions]
  );

  if (loading || dataLoading) return <TablePageSkeleton statCards={4} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">{stats.count} total transactions</p>
      </div>

      <div className={STAT_GRID}>
        <StatCard icon={DollarSign} label="Total Gross" value={`$${stats.totalGross.toLocaleString()}`} iconBg="bg-brand-primary/10" iconColor="text-brand-primary" />
        <StatCard icon={TrendingUp} label="Total Fees" value={`$${stats.totalFees.toLocaleString()}`} iconBg="bg-amber-500/10" iconColor="text-amber-500" />
        <StatCard icon={Wallet} label="Total Net" value={`$${stats.totalNet.toLocaleString()}`} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatCard icon={ArrowLeftRight} label="Transactions" value={stats.count} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        exportFileName="transactions"
        searchPlaceholder="Search transactions..."
        searchKeys={["id", "productName", "buyer"]}
        filter={
          <div className="flex items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        emptyTitle="No results found"
        emptyDescription="Try adjusting your search or filter criteria"
        getRowKey={(row) => (row as unknown as TransactionDto).id}
        onRowClick={(row) =>
          router.push(`/admin/transactions/${(row as unknown as TransactionDto).id}`)
        }
        rowActions={rowActions}
      />
    </div>
  );
}
