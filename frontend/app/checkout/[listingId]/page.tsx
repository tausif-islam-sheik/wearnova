"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { DeliveryStep } from "@/components/checkout/delivery-step";
import { PaymentStep } from "@/components/checkout/payment-step";
import { OrderSummaryCard, OrderSummaryMobile } from "@/components/checkout/order-summary";
import { useCheckout } from "@/hooks/use-checkout";
import { toFormValues } from "@/lib/checkout";
import type { Address } from "@/types";

function Notice({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <Container className="max-w-xl py-20 text-center">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground">{body}</p>
      <Button nativeButton={false} render={<Link href={href} />} className="mt-6">
        {cta}
      </Button>
    </Container>
  );
}

function CheckoutSkeleton() {
  return (
    <Container className="max-w-5xl py-8">
      <Skeleton className="mb-8 h-8 w-64" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded" />
          <Skeleton className="h-20 w-full rounded" />
          <Skeleton className="h-20 w-full rounded" />
        </div>
        <Skeleton className="hidden h-96 w-full rounded-md lg:block" />
      </div>
    </Container>
  );
}

function CheckoutContent({ listingId }: { listingId: string }) {
  const c = useCheckout(listingId);
  const { listing } = c;

  if (c.listingLoading) return <CheckoutSkeleton />;

  if (!listing) {
    return (
      <Notice
        title="Listing not found"
        body="This listing may have been removed."
        href="/"
        cta="Back to home"
      />
    );
  }
  if (c.isOwnListing) {
    return (
      <Notice
        title="This is your own listing"
        body="You can't buy an item you're selling."
        href={`/products/${listing.id}`}
        cta="Back to listing"
      />
    );
  }
  if (listing.status === "sold" || listing.status === "deactivated") {
    return (
      <Notice
        title="This item is no longer available"
        body={listing.status === "sold" ? "Someone else got there first." : "The seller has removed this listing."}
        href="/"
        cta="Keep browsing"
      />
    );
  }

  const summaryProps = {
    listing,
    quote: c.quote,
    loading: c.quoteLoading,
    locked: c.step === "payment",
    appliedPromo: c.appliedPromo,
    promoError: c.promoError,
    promoBusy: c.promoBusy,
    onApplyPromo: c.applyPromo,
    onRemovePromo: c.removePromo,
  };

  const placedAddress: Address | undefined = c.order?.address;

  return (
    <div className="bg-muted/20 pb-16">
      <Container className="max-w-5xl py-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/products/${listing.id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to item
          </Link>
          <CheckoutSteps current={c.step} />
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Lock className="size-3.5" /> Secure checkout
          </span>
        </div>

        <h1 className="mb-6 text-2xl font-semibold text-foreground">Checkout</h1>

        <div className="mb-6 lg:hidden">
          <OrderSummaryMobile {...summaryProps} />
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-md border border-border bg-background p-5 sm:p-6">
            {c.quoteError && c.step === "delivery" && (
              <p role="alert" className="mb-6 rounded border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                {c.quoteError}
              </p>
            )}

            {c.step === "delivery" || !c.order ? (
              <DeliveryStep
                saved={c.saved}
                selectedId={c.selectedId}
                onSelect={c.setSelectedId}
                methods={c.methods}
                methodId={c.methodId}
                onMethodChange={c.setMethodId}
                quotes={c.quotes}
                quoteLoading={c.quoteLoading}
                submitting={c.submitting}
                error={c.error}
                initialValues={placedAddress ? toFormValues(placedAddress) : undefined}
                onContinueSaved={c.continueWithSaved}
                onContinueNew={(values, save) =>
                  c.continueToPayment(values, { ...values, apt: values.apt ?? null }, save)
                }
              />
            ) : (
              <PaymentStep
                orderId={c.order.id}
                clientSecret={c.order.clientSecret}
                total={c.order.total}
                address={c.order.address}
                shippingLabel={c.quote?.shippingLabel ?? "Shipping"}
                shippingEta={c.quote?.shippingEta ?? ""}
                onBack={c.backToDelivery}
              />
            )}
          </div>

          <OrderSummaryCard {...summaryProps} />
        </div>
      </Container>
    </div>
  );
}

export default function CheckoutPage() {
  const params = useParams<{ listingId: string }>();
  return (
    <AuthGuard>
      <CheckoutContent listingId={params.listingId} />
    </AuthGuard>
  );
}
