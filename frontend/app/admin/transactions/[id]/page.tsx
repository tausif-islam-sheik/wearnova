"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Package,
  Receipt,
  User,
  ArrowRightLeft,
  CreditCard,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CopyButton } from "@/components/ui/copy-button";

interface TransactionDetail {
  id: string;
  orderId: string;
  productName: string;
  buyer: string;
  gross: number;
  fee: number;
  net: number;
  status: string;
  payout: string | null;
  date: string;
  order: {
    id: string;
    status: string;
    createdAt: string;
    shippedAt?: string | null;
    listing: { id: string; title: string; images: string[]; price: number };
    buyer: { id: string; name: string; email: string };
    seller: { id: string; name: string; email: string };
    payment?: {
      amount: number;
      currency: string;
      platformFeePercent: number;
      stripePaymentIntentId: string;
      stripeTransferId?: string | null;
      status: string;
      capturedAt?: string | null;
      releasedAt?: string | null;
    } | null;
  };
}

const TXN_STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  refunded: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID_ESCROW: "Paid (Escrow)",
  SHIPPED: "Shipped",
  DELIVERED_CONFIRMED: "Delivered Confirmed",
  DISPUTED: "Disputed",
  RELEASED_TO_SELLER: "Released to Seller",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminTransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const [txn, setTxn] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<TransactionDetail>(`/transactions/${params.id}`)
      .then(setTxn)
      .catch(() => toast.error("Failed to load transaction"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-16 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!txn) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-sm text-muted-foreground mb-6">Transaction not found.</p>
        <Link
          href="/admin/transactions"
          className="inline-flex items-center gap-1.5 text-sm text-brand-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to transactions
        </Link>
      </div>
    );
  }

  const payment = txn.order.payment;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/transactions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to transactions
      </Link>

      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Transaction{" "}
            <span className="inline-flex items-center gap-1 font-mono text-lg text-muted-foreground">
              {txn.id}
              <CopyButton value={txn.id} />
            </span>
          </h1>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${TXN_STATUS_STYLE[txn.status] ?? "bg-muted text-muted-foreground"}`}
          >
            {txn.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Created on {formatDateTime(txn.date)}
        </p>
      </div>

      {/* Money summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Gross
          </p>
          <p className="text-xl font-bold text-foreground mt-1">{formatMoney(txn.gross)}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Platform fee
          </p>
          <p className="text-xl font-bold text-foreground mt-1">{formatMoney(txn.fee)}</p>
          {payment && (
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(payment.platformFeePercent * 100)}%
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Net payout
          </p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatMoney(txn.net)}</p>
        </div>
      </div>

      {/* Product */}
      <div className="rounded-lg border border-border p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Product
        </p>
        <div className="flex gap-4">
          <Link href={`/listings/${txn.order.listing.id}`} className="shrink-0">
            {txn.order.listing.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={txn.order.listing.images[0]}
                alt=""
                className="size-20 rounded object-cover bg-muted"
              />
            ) : (
              <div className="size-20 rounded bg-muted flex items-center justify-center">
                <Package className="size-6 text-muted-foreground" />
              </div>
            )}
          </Link>
          <div className="min-w-0">
            <Link
              href={`/listings/${txn.order.listing.id}`}
              className="font-medium text-foreground hover:text-brand-primary block truncate"
            >
              {txn.order.listing.title}
            </Link>
            <p className="text-xs text-muted-foreground mt-1">
              Listing ID:{" "}
              <span className="inline-flex items-center gap-0.5 align-middle font-mono">
                {txn.order.listing.id}
                <CopyButton value={txn.order.listing.id} />
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Price: <span className="font-medium text-foreground">{formatMoney(txn.order.listing.price)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Order */}
      <div className="rounded-lg border border-border p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Order
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <FileText className="size-3.5" />
              Order ID
            </span>
            <Link
              href={`/admin/orders/${txn.order.id}`}
              className="inline-flex items-center gap-1 font-mono text-xs text-brand-primary hover:underline"
            >
              {txn.order.id}
              <CopyButton value={txn.order.id} />
            </Link>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Receipt className="size-3.5" />
              Status
            </span>
            <span className="font-medium capitalize">
              {ORDER_STATUS_LABELS[txn.order.status] ?? txn.order.status}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Placed</span>
            <span className="font-medium">{formatDateTime(txn.order.createdAt)}</span>
          </div>
          {txn.order.shippedAt && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Shipped</span>
              <span className="font-medium">{formatDateTime(txn.order.shippedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Buyer
          </p>
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{txn.order.buyer.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{txn.order.buyer.email}</p>
          <p className="text-xs text-muted-foreground mt-2">
            User ID:{" "}
            <span className="inline-flex items-center gap-0.5 align-middle font-mono">
              {txn.order.buyer.id}
              <CopyButton value={txn.order.buyer.id} />
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Seller
          </p>
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{txn.order.seller.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{txn.order.seller.email}</p>
          <p className="text-xs text-muted-foreground mt-2">
            User ID:{" "}
            <span className="inline-flex items-center gap-0.5 align-middle font-mono">
              {txn.order.seller.id}
              <CopyButton value={txn.order.seller.id} />
            </span>
          </p>
        </div>
      </div>

      {/* Payment */}
      {payment && (
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Payment
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="size-3.5" />
                Stripe charge
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs">
                {payment.stripePaymentIntentId}
                <CopyButton value={payment.stripePaymentIntentId} />
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ArrowRightLeft className="size-3.5" />
                Payout transfer
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs">
                {txn.payout ?? payment.stripeTransferId ?? "—"}
                {txn.payout ?? payment.stripeTransferId ? (
                  <CopyButton value={txn.payout ?? payment.stripeTransferId ?? ""} />
                ) : null}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Payment status</span>
              <span className="font-medium capitalize">{payment.status}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Charged</span>
              <span className="font-medium">
                {formatMoney(payment.amount / 100)} {payment.currency.toUpperCase()}
              </span>
            </div>
            {payment.capturedAt && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Captured</span>
                <span className="font-medium">{formatDateTime(payment.capturedAt)}</span>
              </div>
            )}
            {payment.releasedAt && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Released to seller</span>
                <span className="font-medium">{formatDateTime(payment.releasedAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
