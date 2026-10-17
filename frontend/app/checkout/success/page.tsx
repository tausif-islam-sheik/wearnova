"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleAlert, CircleCheckBig, Loader2, Package, ShieldCheck } from "lucide-react";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatAddressLines, money } from "@/lib/checkout";
import { useShippingMethods } from "@/hooks/use-shipping-methods";
import type { Order } from "@/types";

const POLL_MS = 3000;
const MAX_POLLS = 10;

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; order: Order; polls: number };

function Notice({
  icon: Icon,
  tone,
  title,
  body,
  children,
}: {
  icon: typeof CircleAlert;
  tone: "success" | "warning" | "muted";
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  const toneClass = { success: "text-success", warning: "text-warning", muted: "text-muted-foreground" }[tone];
  return (
    <Container className="max-w-xl py-16 text-center">
      <Icon className={`mx-auto size-12 ${toneClass}`} aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground">{body}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </Container>
  );
}

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const redirectStatus = params.get("redirect_status");
  const [state, setState] = useState<State>({ phase: "loading" });
  const { methods: shippingMethods } = useShippingMethods();

  // Ask the server to re-check the payment with Stripe (works without the webhook),
  // and keep polling briefly while the payment is still processing.
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const run = async (polls: number) => {
      try {
        const order = await api.post<Order>(`/orders/${orderId}/sync-payment`);
        if (cancelled) return;
        setState({ phase: "ready", order, polls });
        const stillPending = order.status === "PENDING_PAYMENT" && redirectStatus !== "failed";
        if (stillPending && polls < MAX_POLLS) timer = setTimeout(() => run(polls + 1), POLL_MS);
      } catch (e) {
        if (!cancelled) {
          setState({ phase: "error", message: e instanceof Error ? e.message : "We couldn't load your order." });
        }
      }
    };
    run(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId, redirectStatus]);

  if (!orderId) {
    return (
      <Notice icon={CircleAlert} tone="muted" title="No order to show" body="We couldn't find an order for this page.">
        <Button nativeButton={false} render={<Link href="/orders" />}>Go to my orders</Button>
      </Notice>
    );
  }

  if (state.phase === "loading") {
    return (
      <Notice icon={Loader2} tone="muted" title="Confirming your payment…" body="This only takes a moment." />
    );
  }

  if (state.phase === "error") {
    return (
      <Notice icon={CircleAlert} tone="warning" title="We couldn't load this order" body={state.message}>
        <Button nativeButton={false} render={<Link href="/orders" />}>Go to my orders</Button>
      </Notice>
    );
  }

  const { order, polls } = state;

  if (order.status === "CANCELLED") {
    return (
      <Notice icon={CircleAlert} tone="muted" title="This order was cancelled" body="You haven't been charged.">
        <Button nativeButton={false} render={<Link href={`/products/${order.listingId}`} />}>Back to the item</Button>
      </Notice>
    );
  }

  if (order.status === "PENDING_PAYMENT") {
    const failed = redirectStatus === "failed";
    const gaveUp = polls >= MAX_POLLS;
    if (failed || gaveUp) {
      return (
        <Notice
          icon={CircleAlert}
          tone="warning"
          title={failed ? "Your payment didn't go through" : "We're still confirming your payment"}
          body={
            failed
              ? "You haven't been charged. You can try again with the same or a different payment method."
              : "If your bank approved the payment, this page will update shortly — check My orders in a few minutes."
          }
        >
          <Button nativeButton={false} render={<Link href={`/checkout/${order.listingId}`} />}>
            {failed ? "Try again" : "Back to checkout"}
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/orders" />}>
            My orders
          </Button>
        </Notice>
      );
    }
    return (
      <Notice icon={Loader2} tone="muted" title="Processing your payment…" body="Please don't close this page." />
    );
  }

  const address = order.shippingAddress;
  const shortId = order.id.slice(-8).toUpperCase();

  return (
    <Container className="max-w-2xl py-12">
      <div className="text-center">
        <CircleCheckBig className="mx-auto size-14 text-success" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">Thank you — your order is placed!</h1>
        <p className="mt-2 text-muted-foreground">
          Order <span className="font-mono font-medium text-foreground">#{shortId}</span>
        </p>
      </div>

      <div className="mt-8 divide-y divide-border rounded-md border border-border bg-background">
        <div className="flex gap-4 p-5">
          <div className="relative size-20 shrink-0 overflow-hidden rounded bg-muted">
            {order.listing?.images[0] && (
              <Image src={order.listing.images[0]} alt={order.listing.title} fill sizes="80px" className="object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{order.listing?.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">Sold by {order.seller?.name}</p>
          </div>
        </div>

        <dl className="space-y-2 p-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Item</dt>
            <dd className="tabular-nums">{money(order.price * order.quantity)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Shipping
              {order.shippingMethod && ` · ${shippingMethods.find((m) => m.id === order.shippingMethod)?.label ?? order.shippingMethod}`}
            </dt>
            <dd className="tabular-nums">{order.shippingCost === 0 ? "Free" : money(order.shippingCost)}</dd>
          </div>
          {!!order.discount && order.discount > 0 && (
            <div className="flex justify-between text-success">
              <dt>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
              <dd className="tabular-nums">−{money(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
            <dt>Total paid</dt>
            <dd className="tabular-nums">{money(order.total)}</dd>
          </div>
        </dl>

        {address && (
          <div className="p-5 text-sm">
            <p className="mb-1 font-medium text-foreground">Shipping to</p>
            {formatAddressLines(address).map((line, i) => (
              <p key={i} className="text-muted-foreground">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3 rounded-md bg-muted/50 p-5 text-sm">
        <p className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
          <span className="text-muted-foreground">
            <strong className="font-medium text-foreground">Your money is protected.</strong> We hold your payment
            and only release it to the seller once you confirm the item arrived.
          </span>
        </p>
        <p className="flex items-start gap-3">
          <Package className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            The seller has been notified and will ship your item. You can follow progress in My orders.
          </span>
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button nativeButton={false} render={<Link href="/orders" />} className="h-11 px-6">
          View my orders
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />} className="h-11 px-6">
          Continue shopping
        </Button>
      </div>
    </Container>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </AuthGuard>
  );
}
