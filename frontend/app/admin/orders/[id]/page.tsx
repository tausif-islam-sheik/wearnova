"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Loader2,
  ArrowRightLeft,
  RotateCcw,
  Check,
  Copy,
  ShieldCheck,
  History,
  CheckCircle2,
  Circle,
  AlertTriangle,
  XCircle,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OrderDetail {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  quantity: number;
  shippingCost: number;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string | null;
  shippingAddress: Record<string, unknown> | null;
  listing: { id: string; title: string; images: string[]; price: number };
  buyer: { id: string; name: string; email: string };
  seller: { id: string; name: string; email: string };
  payment?: {
    id: string;
    amount: number;
    currency: string;
    platformFeeAmount: number;
    platformFeePercent: number;
    sellerPayoutAmount: number;
    stripePaymentIntentId: string;
    stripeTransferId?: string | null;
    status: string;
    capturedAt?: string | null;
    releasedAt?: string | null;
  } | null;
  dispute?: {
    id: string;
    reason: string;
    details: string | null;
    status: "open" | "resolved";
    resolution: "refunded" | "released" | null;
    openedAt: string;
    resolvedAt: string | null;
  } | null;
}

const DISPUTE_REASONS: Record<string, string> = {
  not_received: "Item not received",
  not_as_described: "Not as described",
  damaged: "Arrived damaged",
  other: "Something else",
};

const STATUS_OPTIONS = [
  "PENDING_PAYMENT",
  "PAID_ESCROW",
  "SHIPPED",
  "DELIVERED_CONFIRMED",
  "DISPUTED",
  "RELEASED_TO_SELLER",
  "REFUNDED",
  "CANCELLED",
] as const;

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: {
    label: "Pending Payment",
    className: "bg-muted text-muted-foreground border-border",
  },
  PAID_ESCROW: {
    label: "Paid (Escrow)",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  SHIPPED: {
    label: "Shipped",
    className: "bg-secondary text-secondary-foreground border-border",
  },
  DELIVERED_CONFIRMED: {
    label: "Delivered",
    className: "bg-success/10 text-success border-success/20",
  },
  DISPUTED: {
    label: "Disputed",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  RELEASED_TO_SELLER: {
    label: "Released to Seller",
    className: "bg-success/10 text-success border-success/20",
  },
  REFUNDED: {
    label: "Refunded",
    className: "bg-muted text-muted-foreground border-border",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const PAYMENT_STATUS_META: Record<string, { label: string; className: string }> = {
  captured: { label: "Captured", className: "bg-success/10 text-success border-success/20" },
  requires_payment_method: { label: "Awaiting payment", className: "bg-warning/10 text-warning border-warning/20" },
  requires_capture: { label: "Awaiting capture", className: "bg-warning/10 text-warning border-warning/20" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  processing: { label: "Processing", className: "bg-warning/10 text-warning border-warning/20" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
  canceled: { label: "Canceled", className: "bg-muted text-muted-foreground border-border" },
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

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={cn(meta.className, "font-medium")}>
      {meta.label}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const meta = PAYMENT_STATUS_META[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={cn(meta.className, "font-medium")}>
      {meta.label}
    </Badge>
  );
}

function CopyIdButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
      aria-label={`Copy ${label ?? "ID"}`}
      title={`Copy ${label ?? "ID"}`}
      onClick={async (e) => {
        e.stopPropagation();
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success("Copied to clipboard");
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Failed to copy");
        }
      }}
    >
      {copied ? (
        <Check className="size-3.5 text-success" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </Button>
  );
}

function SectionLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {icon && (
        <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
          {icon}
        </span>
      )}
      {children}
    </CardTitle>
  );
}

interface TimelineStep {
  key: string;
  label: string;
  time?: string | null;
  state: "done" | "current" | "pending";
  customIcon?: React.ReactNode;
  customClass?: string;
}

function buildTimelineSteps(order: OrderDetail): TimelineStep[] {
  const shipped = !!order.shippedAt;
  const captured = !!order.payment?.capturedAt;
  const released = !!order.payment?.releasedAt;

  let currentKey: string | null = null;
  if (order.status === "PENDING_PAYMENT") currentKey = "shipped";
  else if (order.status === "PAID_ESCROW" || order.status === "SHIPPED") currentKey = "escrow";
  else if (order.status === "DELIVERED_CONFIRMED") currentKey = "released";
  else if (order.status === "DISPUTED") currentKey = "released";

  const finalStep: TimelineStep = {
    key: "released",
    label: "Released",
    time: order.payment?.releasedAt,
    state: released ? "done" : currentKey === "released" ? "current" : "pending",
  };

  if (order.status === "DISPUTED") {
    finalStep.label = "Disputed";
    finalStep.customIcon = <AlertTriangle className="size-4 text-destructive" />;
    finalStep.customClass = "text-destructive";
  } else if (order.status === "REFUNDED") {
    finalStep.label = "Refunded";
    finalStep.customIcon = <RotateCcw className="size-4 text-muted-foreground" />;
    finalStep.customClass = "text-muted-foreground";
    finalStep.state = "done";
  } else if (order.status === "CANCELLED") {
    finalStep.label = "Cancelled";
    finalStep.customIcon = <XCircle className="size-4 text-muted-foreground" />;
    finalStep.customClass = "text-muted-foreground";
    finalStep.state = "done";
  }

  return [
    { key: "placed", label: "Placed", time: order.createdAt, state: "done" },
    {
      key: "shipped",
      label: "Shipped",
      time: order.shippedAt,
      state: shipped ? "done" : currentKey === "shipped" ? "current" : "pending",
    },
    {
      key: "escrow",
      label: "Escrow Held",
      time: order.payment?.capturedAt,
      state: captured ? "done" : currentKey === "escrow" ? "current" : "pending",
    },
    finalStep,
  ];
}

function OrderTimeline({ order }: { order: OrderDetail }) {
  const steps = buildTimelineSteps(order);

  return (
    <Card className="rounded-lg border border-border/50">
      <CardHeader className="px-4 pb-2 pt-4">
        <SectionLabel icon={<History className="size-4" />}>
          Order Timeline
        </SectionLabel>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        <ol className="flex items-start">
          {steps.map((step, i) => {
            const isFirst = i === 0;
            const isLast = i === steps.length - 1;
            const icon = step.customIcon ?? (
              step.state === "done" ? (
                <CheckCircle2 className="size-4 text-success" />
              ) : step.state === "current" ? (
                <Circle className="size-4 fill-brand-primary/15 text-brand-primary" />
              ) : (
                <Circle className="size-4 text-muted-foreground/30" />
              )
            );
            const labelClass =
              step.state === "current"
                ? "font-semibold text-foreground"
                : step.state === "done"
                  ? "text-foreground"
                  : "text-muted-foreground";
            return (
              <li
                key={step.key}
                className={cn(
                  "flex flex-col",
                  isFirst ? "items-start" : isLast ? "flex-none items-end" : "flex-1 items-center"
                )}
              >
                <div className="mb-1.5 flex w-full items-center">
                  {!isFirst && <div className="h-px flex-1 bg-border" />}
                  <div className={cn("px-1.5", step.customClass)}>{icon}</div>
                  {!isLast && <div className="h-px flex-1 bg-border" />}
                </div>
                <p className={cn("text-[11px] whitespace-nowrap", labelClass, step.customClass)}>
                  {step.label}
                </p>
                {step.time && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatShortDate(step.time)}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.get<OrderDetail>(`/orders/${params.id}`)
      .then(setOrder)
      .catch(() => toast.error("Failed to load order"))
      .finally(() => setLoading(false));
  }, [params.id]);

  /**
   * Status / release / refund endpoints return a bare order row (no listing, parties, payment or
   * dispute), so re-read the full order after each action instead of replacing state with it.
   */
  const reloadOrder = async (id: string) => {
    try {
      setOrder(await api.get<OrderDetail>(`/orders/${id}`));
    } catch {
      toast.error("Saved, but couldn't refresh the order. Reload the page.");
    }
  };

  const updateStatus = async (status: string | null) => {
    if (!order || !status || status === order.status) return;
    setUpdating(true);
    try {
      await api.patch(`/orders/${order.id}/status`, { status });
      await reloadOrder(order.id);
      toast.success(`Order marked as ${STATUS_META[status]?.label ?? status}`);
    } catch {
      toast.error("Failed to update order status");
    }
    setUpdating(false);
  };

  const releaseFunds = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      await api.post(`/orders/${order.id}/release-funds`, {});
      await reloadOrder(order.id);
      toast.success("Escrow funds released to seller");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to release funds");
    }
    setUpdating(false);
  };

  const refundOrder = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      await api.post(`/orders/${order.id}/refund`, {});
      await reloadOrder(order.id);
      toast.success("Payment refunded to buyer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to refund order");
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-16 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-sm text-muted-foreground mb-6">Order not found.</p>
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href="/admin/orders" />}
          className="gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to orders
        </Button>
      </div>
    );
  }

  const canRelease =
    order.status === "DISPUTED" || order.status === "DELIVERED_CONFIRMED";
  const canRefund =
    ["PAID_ESCROW", "SHIPPED", "DELIVERED_CONFIRMED", "DISPUTED"].includes(order.status) &&
    !order.payment?.stripeTransferId;

  // The address is nullable in the database (e.g. orders still awaiting checkout).
  const address = (order.shippingAddress ?? {}) as Record<string, string | undefined>;
  const hasAddress = Object.keys(address).length > 0;

  const canDispute = !["DISPUTED", "REFUNDED", "CANCELLED", "RELEASED_TO_SELLER"].includes(
    order.status
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button
        variant="ghost"
        nativeButton={false}
        render={<Link href="/admin/orders" />}
        className="-ml-2 w-fit gap-1.5 px-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to orders
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Order{" "}
          <span className="inline-flex items-center font-mono text-lg text-muted-foreground">
            {order.id}
            <CopyIdButton value={order.id} label="Order ID" />
          </span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Placed on {formatDateTime(order.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <OrderTimeline order={order} />

          {/* Dispute */}
          {order.dispute && (
            <Card
              className={
                order.dispute.status === "open"
                  ? "rounded-lg border border-warning/40 bg-warning/5"
                  : "rounded-lg border border-border/50"
              }
            >
              <CardHeader className="px-4 pb-2 pt-4">
                <SectionLabel icon={<AlertTriangle className="size-4" />}>
                  {order.dispute.status === "open"
                    ? "Open dispute"
                    : order.dispute.resolution === "refunded"
                      ? "Dispute resolved: buyer refunded"
                      : "Dispute resolved: released to seller"}
                </SectionLabel>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4 pt-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Reason: </span>
                  <span className="font-medium">
                    {DISPUTE_REASONS[order.dispute.reason] ?? order.dispute.reason}
                  </span>
                </p>
                <p className="whitespace-pre-line">
                  {order.dispute.details || (
                    <span className="text-muted-foreground">The buyer didn&apos;t add any details.</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Opened {new Date(order.dispute.openedAt).toLocaleString()}
                  {order.dispute.resolvedAt
                    ? ` · resolved ${new Date(order.dispute.resolvedAt).toLocaleString()}`
                    : " · use Quick Actions to refund the buyer or release funds to the seller"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Product */}
          <Card className="rounded-lg border border-border/50">
            <CardHeader className="px-4 pb-2 pt-4">
              <SectionLabel icon={<Package className="size-4" />}>Product</SectionLabel>
            </CardHeader>
            <CardContent className="flex gap-4 px-4 pb-4 pt-2">
              <Link href={`/listings/${order.listingId}`} className="shrink-0">
                {order.listing.images?.[0] ? (
                  <img
                    src={order.listing.images[0]}
                    alt=""
                    className="size-24 rounded-lg border border-border object-cover bg-muted"
                  />
                ) : (
                  <div className="size-24 rounded-lg border border-border bg-muted flex items-center justify-center">
                    <Package className="size-6 text-muted-foreground" />
                  </div>
                )}
              </Link>
              <div className="min-w-0">
                <Link
                  href={`/listings/${order.listingId}`}
                  className="block truncate font-medium text-foreground hover:text-brand-primary"
                >
                  {order.listing.title}
                </Link>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="uppercase">Listing ID:</span>
                  <span className="inline-flex items-center gap-0.5 align-middle font-mono">
                    {order.listingId}
                    <CopyIdButton value={order.listingId} label="Listing ID" />
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Parties */}
          <Card className="rounded-lg border border-border/50">
            <CardContent className="grid grid-cols-1 gap-5 px-4 py-4 sm:grid-cols-2">
              {[
                { role: "Buyer", person: order.buyer },
                { role: "Seller", person: order.seller },
              ].map(({ role, person }) => (
                <div key={role} className="flex min-w-0 items-start gap-3">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-muted text-sm font-medium text-muted-foreground">
                      {initialsOf(person.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <User className="size-3" />
                      {role}
                    </p>
                    <p className="mt-1 truncate font-medium text-foreground">{person.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{person.email}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment & escrow */}
          <Card className="rounded-lg border border-border/50">
            <CardHeader className="flex flex-row items-start justify-between gap-2 px-4 pb-2 pt-4">
              <SectionLabel
                icon={<ShieldCheck className="size-4" />}
              >
                Payment & Escrow
              </SectionLabel>
              {order.payment && (
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Intent
                  </span>
                  <Badge
                    variant="outline"
                    className="max-w-44 truncate font-mono text-[10px] text-muted-foreground"
                  >
                    {order.payment.stripePaymentIntentId}
                  </Badge>
                  <CopyIdButton value={order.payment.stripePaymentIntentId} label="PaymentIntent ID" />
                  <PaymentStatusBadge status={order.payment.status} />
                </div>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-2">
              {order.payment ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-foreground">Captured (escrow held)</span>
                    <span className="text-foreground tabular-nums">
                      {formatMoney(order.payment.amount)}{" "}
                      <span className="text-xs uppercase text-muted-foreground">
                        {order.payment.currency}
                      </span>
                    </span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      Platform fee ({order.payment.platformFeePercent}%)
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      -{formatMoney(order.payment.platformFeeAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Seller payout</span>
                    <span className="font-semibold text-brand-primary tabular-nums">
                      {formatMoney(order.payment.sellerPayoutAmount)}
                    </span>
                  </div>
                  {order.payment.stripeTransferId && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Transfer</span>
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="max-w-44 truncate font-mono text-[10px] text-muted-foreground"
                        >
                          {order.payment.stripeTransferId}
                        </Badge>
                        <CopyIdButton value={order.payment.stripeTransferId} label="Transfer ID" />
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No payment record yet — order is awaiting payment.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Shipping address */}
          {hasAddress && (
            <Card className="rounded-lg border border-border/50">
              <CardHeader className="px-4 pb-2 pt-4">
                <SectionLabel icon={<MapPin className="size-4" />}>
                  Shipping Address
                </SectionLabel>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-2">
                {address.fullName && (
                  <p className="text-sm font-medium text-foreground">{address.fullName}</p>
                )}
                {address.street && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {address.street}
                    {address.apt ? `, ${address.apt}` : ""}
                  </p>
                )}
                {[address.city, address.country].some(Boolean) && (
                  <p className="text-sm text-muted-foreground">
                    {[address.city, address.country].filter(Boolean).join(", ")}
                  </p>
                )}
                {address.phone && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="size-3.5" />
                    {address.phone}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          {/* Status */}
          <Card className="rounded-lg border border-border/50">
            <CardHeader className="px-4 pb-2 pt-4">
              <SectionLabel>Status</SectionLabel>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-2">
              <Select
                value={order.status}
                onValueChange={updateStatus}
                disabled={updating}
              >
                <SelectTrigger className="h-9 w-full gap-1.5 rounded-full py-0 pl-1 pr-1.5">
                  <StatusBadge status={order.status} />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Order summary */}
          <Card className="rounded-lg border border-border/50">
            <CardHeader className="px-4 pb-2 pt-4">
              <SectionLabel>Order Summary</SectionLabel>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-2">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Price</span>
                  <span className="text-foreground tabular-nums">
                    ${order.price.toLocaleString()}{" "}
                    {order.quantity > 1 && (
                      <span className="text-muted-foreground">× {order.quantity}</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground tabular-nums">
                    ${(order.price * order.quantity).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-foreground tabular-nums">
                    {order.shippingCost > 0 ? `$${order.shippingCost.toLocaleString()}` : "Free"}
                  </span>
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    ${order.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="rounded-lg border border-border/50">
            <CardHeader className="px-4 pb-2 pt-4">
              <SectionLabel>Quick Actions</SectionLabel>
            </CardHeader>
            <CardContent className="grid gap-2 px-4 pb-4 pt-2">
              {canRelease && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="default"
                        className="w-full"
                        disabled={updating}
                      />
                    }
                  >
                    <ArrowRightLeft className="size-4" />
                    Release funds to seller
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Release escrow funds?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This transfers{" "}
                        {order.payment
                          ? formatMoney(order.payment.sellerPayoutAmount)
                          : formatMoney(Math.round(order.total * 100))}{" "}
                        to the seller&apos;s Stripe account. The buyer cannot be
                        refunded afterwards.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={releaseFunds}>
                        Release funds
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {canRefund && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="destructive" className="w-full" disabled={updating} />}
                  >
                    <RotateCcw className="size-4" />
                    Refund buyer
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Refund this order?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The full{" "}
                        {order.payment
                          ? formatMoney(order.payment.amount)
                          : `$${order.total.toLocaleString()}`}{" "}
                        will be returned to the buyer and the order marked as
                        refunded.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={refundOrder}>
                        Refund buyer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {canDispute && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={updating}
                  onClick={() => updateStatus("DISPUTED")}
                >
                  <AlertTriangle className="size-4" />
                  Mark as disputed
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Escrow protection */}
          <Alert className="rounded-lg border-border/50 bg-muted/40">
            <ShieldCheck className="text-brand-primary" />
            <AlertTitle className="text-xs font-semibold text-foreground">
              Escrow protection
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              Escrow funds are held by the platform until the buyer confirms receipt or
              an admin resolves the dispute.
              <span className="mt-0.5 block text-foreground-faint">
                Last updated {formatDateTime(order.updatedAt)}
              </span>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}