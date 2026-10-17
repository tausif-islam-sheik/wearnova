"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Search, Package, CheckCircle, Clock, Truck, Archive, XCircle, Loader2, ExternalLink, ShieldCheck, Lock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { CopyButton } from "@/components/ui/copy-button";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import type { Order } from "@/types";

const statusConfig: Record<string, { label: string; icon: typeof Package; color: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", icon: Clock, color: "text-muted-foreground" },
  PAID_ESCROW: { label: "Paid · Escrow", icon: CheckCircle, color: "text-brand-primary" },
  SHIPPED: { label: "Shipped", icon: Truck, color: "text-brand-primary" },
  DELIVERED_CONFIRMED: { label: "Delivered", icon: Package, color: "text-brand-primary" },
  DISPUTED: { label: "Disputed", icon: XCircle, color: "text-destructive" },
  RELEASED_TO_SELLER: { label: "Completed", icon: Archive, color: "text-green-600" },
  REFUNDED: { label: "Refunded", icon: XCircle, color: "text-muted-foreground" },
  CANCELLED: { label: "Cancelled", icon: XCircle, color: "text-muted-foreground" },
};

const statusOrder = [
  "PENDING_PAYMENT",
  "PAID_ESCROW",
  "SHIPPED",
  "DELIVERED_CONFIRMED",
  "RELEASED_TO_SELLER",
];

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");

  const loadOrder = async (id: string) => {
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const result = await api.get<Order>(`/orders/${id}`);
      setOrder(result);
    } catch {
      setError("Order not found. Please check the order ID and try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setOrderId(id);
      loadOrder(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    await loadOrder(orderId.trim());
  };

  const confirmReceived = async () => {
    if (!order) return;
    setActing(true);
    try {
      await api.post(`/orders/${order.id}/confirm-received`, {});
      toast.success("Escrow funds released to the seller. Thanks!");
      await loadOrder(order.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not confirm receipt");
    }
    setActing(false);
  };

  const openDispute = async () => {
    if (!order || !disputeReason) return;
    setActing(true);
    try {
      await api.post(`/orders/${order.id}/dispute`, {
        reason: disputeReason,
        details: disputeDetails.trim() || undefined,
      });
      setDisputeReason("");
      setDisputeDetails("");
      toast.success("Dispute opened. An admin will review your case.");
      await loadOrder(order.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open dispute");
    }
    setActing(false);
  };

  const currentIdx = order ? statusOrder.indexOf(order.status) : -1;
  const isBuyer = order && isAuthenticated && user?.id === order.buyerId;
  const isSeller = order && isAuthenticated && user?.id === order.sellerId;
  const canConfirm =
    order && (order.status === "PAID_ESCROW" || order.status === "SHIPPED");
  const canDispute =
    order &&
    ["PAID_ESCROW", "SHIPPED", "DELIVERED_CONFIRMED"].includes(order.status);
  const inEscrow =
    order &&
    ["PAID_ESCROW", "SHIPPED", "DELIVERED_CONFIRMED", "DISPUTED"].includes(
      order.status
    );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-6">
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div className="text-center mb-8">
        <Package className="size-10 mx-auto text-brand-primary mb-3" strokeWidth={1.5} />
        <h1 className="text-xl font-bold text-foreground">Track your order</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Enter your order ID to check the status of your purchase.
        </p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-2 mb-8">
        <Input
          placeholder="Enter order ID (e.g. abc123...)"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="flex-1 h-11 rounded"
        />
        <Button
          type="submit"
          disabled={loading || !orderId.trim()}
          className="rounded bg-brand-primary text-white hover:bg-brand-primary-hover shrink-0 h-11"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Track
        </Button>
      </form>

      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <XCircle className="size-10 text-destructive mb-3" strokeWidth={1.5} />
          <p className="text-sm text-foreground-muted">{error}</p>
        </div>
      )}

      {order && !error && (
        <div className="rounded-lg border border-border p-6 space-y-6">
          {/* Status header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground-muted">Order ID</p>
              <p className="inline-flex items-center gap-1 text-sm font-mono text-foreground">
                {order.id}
                <CopyButton value={order.id} />
              </p>
            </div>
            <Badge variant={currentIdx >= 4 ? "outline" : currentIdx >= 0 ? "default" : "secondary"}>
              {statusConfig[order.status]?.label ?? order.status}
            </Badge>
          </div>

          {/* Status steps */}
          {currentIdx >= 0 && (
            <div className="flex items-center gap-0">
              {statusOrder.map((s, i) => {
                const cfg = statusConfig[s];
                const Icon = cfg.icon;
                const done = i <= currentIdx;
                const isLast = i === statusOrder.length - 1;
                return (
                  <div key={s} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-1.5 min-w-0">
                      <div className={`size-8 rounded-full flex items-center justify-center transition-colors ${done ? "bg-brand-primary text-white" : "bg-surface-muted text-muted-foreground"}`}>
                        <Icon className="size-4" />
                      </div>
                      <span className={`text-[11px] font-medium whitespace-nowrap ${done ? "text-foreground" : "text-muted-foreground"}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={`flex-1 h-px mx-1 ${i < currentIdx ? "bg-brand-primary" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Escrow notice */}
          {inEscrow && (
            <div className="flex items-start gap-2.5 rounded-md bg-brand-primary/5 border border-brand-primary/15 px-4 py-3">
              <ShieldCheck className="size-4 text-brand-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  Your payment of ${(order.total ?? 0).toFixed(2)} is held in escrow
                </p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  The seller is paid only after you confirm you received your item.
                </p>
              </div>
            </div>
          )}

          <hr className="border-border" />

          {/* Seller escrow panel */}
          {isSeller && (
            <div className="flex items-start gap-2.5 rounded-md border border-border bg-surface-muted/40 px-4 py-3">
              {order.status === "RELEASED_TO_SELLER" ? (
                <Wallet className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : order.status === "DISPUTED" ? (
                <XCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Lock className="size-4 text-brand-primary shrink-0 mt-0.5" />
              )}
              <div className="w-full min-w-0">
                <p className="font-medium text-foreground">
                  {order.status === "RELEASED_TO_SELLER"
                    ? "Payout released to your Stripe balance"
                    : order.status === "DISPUTED"
                      ? "Payout frozen — order is under dispute review"
                      : order.status === "PENDING_PAYMENT" || !order.payment
                        ? "Awaiting payment from the buyer"
                        : "Funds held until the buyer confirms receipt"}
                </p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {order.status === "RELEASED_TO_SELLER"
                    ? `Released ${new Date(order.payment?.releasedAt ?? order.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                    : order.status === "DISPUTED"
                      ? "An admin will review the case before any funds move."
                      : "The buyer is paid only after they confirm they received the item as described."}
                </p>

                {order.payment && (
                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-foreground-muted">Order total (escrow)</span>
                      <span className="text-foreground">${(order.payment.amount / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-foreground-muted">
                        Platform fee ({order.payment.platformFeePercent}%)
                      </span>
                      <span className="text-foreground">
                        −${(order.payment.platformFeeAmount / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 font-medium">
                      <span className="text-foreground">
                        {order.status === "RELEASED_TO_SELLER" ? "Net payout" : "Expected payout"}
                      </span>
                      <span className="text-emerald-600">
                        ${(order.payment.sellerPayoutAmount / 100).toFixed(2)}
                      </span>
                    </div>
                    {order.status === "RELEASED_TO_SELLER" && order.payment.stripeTransferId && (
                      <div className="flex justify-between gap-4 pt-1">
                        <span className="text-foreground-muted">Transfer</span>
                        <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-foreground max-w-[220px]">
                          <span className="truncate">{order.payment.stripeTransferId}</span>
                          <CopyButton value={order.payment.stripeTransferId} />
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <hr className="border-border" />

          {/* Listing info */}
          <div className="flex gap-4">
            <Link href={`/listings/${order.listingId}`} className="shrink-0">
              <div className="size-16 rounded-md overflow-hidden bg-surface-muted">
                {order.listing?.images?.[0] ? (
                  <img src={order.listing.images[0]} alt={order.listing.title} className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center text-foreground-faint">
                    <Package className="size-5" />
                  </div>
                )}
              </div>
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/listings/${order.listingId}`} className="text-sm font-semibold text-foreground hover:text-brand-primary truncate block">
                {order.listing?.title ?? "Listing"}
              </Link>
              <p className="text-sm text-foreground-muted mt-0.5">
                ${(order.total ?? 0).toFixed(2)}
                {(order.quantity ?? 1) > 1 && (
                  <span className="text-xs text-foreground-muted">
                    {" "}· {order.quantity} items
                  </span>
                )}
              </p>
              {order.seller && (
                <Link
                  href={`/seller/${order.seller.name.toLowerCase()}`}
                  className="text-xs text-foreground-muted hover:text-brand-primary mt-1 inline-flex items-center gap-1"
                >
                  Sold by {order.seller.name}
                  <ExternalLink className="size-3" />
                </Link>
              )}
            </div>
          </div>

          <hr className="border-border" />

          {/* Order details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-foreground-muted">Price</p>
              <p className="text-foreground font-medium">${(order.price ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Shipping</p>
              <p className="text-foreground font-medium">{(order.shippingCost ?? 0) > 0 ? `$${(order.shippingCost ?? 0).toFixed(2)}` : "Free"}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Ordered</p>
              <p className="text-foreground font-medium">
                {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Buyer</p>
              <p className="text-foreground font-medium">{order.buyer?.name ?? "—"}</p>
            </div>
          </div>

          {/* Buyer actions */}
          {isBuyer && (canConfirm || canDispute) && (
            <>
              <hr className="border-border" />
              <div className="flex flex-col sm:flex-row gap-3">
                {canConfirm && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          className="rounded bg-brand-primary text-white hover:bg-brand-primary-hover flex-1"
                          disabled={acting}
                        />
                      }
                    >
                      <CheckCircle className="size-4 mr-1.5" />
                      Confirm received &amp; release funds
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm you received the item?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This releases ${(order.total ?? 0).toFixed(2)} from
                          escrow to the seller. You will not be able to open a
                          dispute afterwards.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmReceived}>
                          Confirm receipt
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {canDispute && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="outline"
                          className="rounded flex-1"
                          disabled={acting}
                        />
                      }
                    >
                      <XCircle className="size-4 mr-1.5" />
                      Report a problem
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Open a dispute?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Your payment stays in escrow while an admin reviews
                          the case. Do not open a dispute if you have received
                          the item as described.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label htmlFor="dispute-reason" className="text-sm font-medium">
                            What went wrong?
                          </label>
                          <NativeSelect
                            id="dispute-reason"
                            className="w-full"
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                          >
                            <NativeSelectOption value="">Choose a reason…</NativeSelectOption>
                            <NativeSelectOption value="not_received">I didn&apos;t receive the item</NativeSelectOption>
                            <NativeSelectOption value="not_as_described">Not as described</NativeSelectOption>
                            <NativeSelectOption value="damaged">Arrived damaged</NativeSelectOption>
                            <NativeSelectOption value="other">Something else</NativeSelectOption>
                          </NativeSelect>
                        </div>
                        <Textarea
                          value={disputeDetails}
                          onChange={(e) => setDisputeDetails(e.target.value)}
                          maxLength={500}
                          rows={3}
                          placeholder="Add details to help us review (optional)"
                          aria-label="Dispute details"
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={openDispute} disabled={!disputeReason}>
                          Open dispute
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

