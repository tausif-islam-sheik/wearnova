"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Package, Star, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/useAuthStore";
import { api } from "@/lib/api";
import type { Order } from "@/types";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  PENDING_PAYMENT: { label: "Awaiting payment", variant: "secondary" },
  PAID_ESCROW: { label: "Paid (escrow)", variant: "default" },
  SHIPPED: { label: "Shipped", variant: "default" },
  DELIVERED_CONFIRMED: { label: "Delivered", variant: "default" },
  DISPUTED: { label: "Disputed", variant: "destructive" },
  RELEASED_TO_SELLER: { label: "Completed", variant: "outline" },
  REFUNDED: { label: "Refunded", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
};

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get<{ orders: Order[] }>(`/orders?buyerId=${user.id}`)
      .then((res) => setOrders(res.orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-6">
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <h1 className="text-xl font-bold text-foreground mb-2">My orders</h1>
        <p className="text-sm text-foreground-muted mb-8">Sign in to view your orders.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-6">
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <h1 className="text-xl font-bold text-foreground mb-2">My orders</h1>
      <p className="text-sm text-foreground-muted mb-8">Track your purchases, view order history, and leave reviews.</p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 rounded-lg border border-border">
              <Skeleton className="size-20 rounded-md shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-1/6" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="size-12 text-foreground-faint mb-5" strokeWidth={1.5} />
          <h2 className="text-lg font-bold text-foreground mb-1">No orders yet</h2>
          <p className="text-sm text-foreground-muted mb-6">
            You haven&apos;t placed any orders yet.
          </p>
          <Link href="/search">
            <Button className="rounded bg-brand-primary text-white hover:bg-brand-primary-hover">
              Start shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => {
            const statusInfo = statusLabels[order.status] ?? { label: order.status, variant: "outline" as const };
            const canReview = (order.status === "DELIVERED_CONFIRMED" || order.status === "RELEASED_TO_SELLER") && !order.review;

            return (
              <div key={order.id}>
                {i > 0 && <Separator className="mb-4" />}
                <div className="flex gap-4 p-4 rounded-lg border border-border hover:bg-surface-muted/50 transition-colors">
                  <Link href={`/listings/${order.listingId}`} className="shrink-0">
                    <div className="size-20 rounded-md overflow-hidden bg-surface-muted">
                      {order.listing?.images?.[0] ? (
                        <img
                          src={order.listing.images[0]}
                          alt={order.listing.title}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-foreground-faint">
                          <Package className="size-6" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/listings/${order.listingId}`}
                          className="text-sm font-semibold text-foreground hover:text-brand-primary truncate block"
                        >
                          {order.listing?.title ?? "Listing"}
                        </Link>
                        <p className="text-sm text-foreground-muted mt-0.5">
                          ${order.total.toFixed(2)}
                          <span className="text-xs text-foreground-muted">
                            {" "}· {order.quantity} {order.quantity === 1 ? "item" : "items"}
                          </span>
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
                      <Badge variant={statusInfo.variant} className="shrink-0 text-[11px] px-2 py-0.5">
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-4">
                      <Link
                        href={`/track-order?id=${order.id}`}
                        className="text-xs font-medium text-brand-primary hover:underline"
                      >
                        View order details
                      </Link>
                    </div>

                    {canReview && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <Link
                          href={`/seller/${order.seller?.name.toLowerCase() ?? order.sellerId}`}
                        >
                          <Button
                            size="sm"
                            className="rounded gap-1.5 bg-brand-primary text-white hover:bg-brand-primary-hover text-xs"
                          >
                            <Star className="size-3.5" />
                            Write a review
                          </Button>
                        </Link>
                      </div>
                    )}

                    {order.review && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Star className="size-3.5 fill-rating text-rating" />
                          <span className="text-xs text-foreground-muted">
                            Review submitted
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
