"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ShieldCheck, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { conditionLabels } from "@/components/shared/ConditionBadge";
import { money } from "@/lib/checkout";
import { cn } from "@/lib/utils";
import type { Listing, Quote } from "@/types";

interface OrderSummaryProps {
  listing: Listing;
  quote: Quote | null;
  loading: boolean;
  /** Promo + method are locked once the order has been created. */
  locked: boolean;
  appliedPromo: string | null;
  promoError: string | null;
  promoBusy: boolean;
  onApplyPromo: (code: string) => void;
  onRemovePromo: () => void;
}

function Row({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "success" }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium tabular-nums text-foreground", tone === "success" && "text-success")}>{value}</dd>
    </div>
  );
}

function PromoField(props: Pick<OrderSummaryProps, "appliedPromo" | "promoError" | "promoBusy" | "onApplyPromo" | "onRemovePromo" | "locked">) {
  const [code, setCode] = useState("");

  if (props.appliedPromo) {
    return (
      <div className="flex items-center justify-between rounded border border-success/30 bg-success/5 px-3 py-2 text-sm">
        <span className="flex items-center gap-2 font-medium text-success">
          <Tag className="size-3.5" /> {props.appliedPromo} applied
        </span>
        {!props.locked && (
          <button
            type="button"
            onClick={props.onRemovePromo}
            aria-label="Remove promo code"
            className="cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        props.onApplyPromo(code);
      }}
    >
      <label htmlFor="promo-code" className="sr-only">
        Promo code
      </label>
      <div className="flex gap-2">
        <Input
          id="promo-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Promo code"
          autoComplete="off"
          disabled={props.locked}
          aria-invalid={Boolean(props.promoError)}
          className="uppercase placeholder:normal-case"
        />
        <Button type="submit" variant="outline" disabled={!code.trim() || props.promoBusy || props.locked}>
          Apply
        </Button>
      </div>
      {props.promoError && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {props.promoError}
        </p>
      )}
    </form>
  );
}

function SummaryBody(props: OrderSummaryProps) {
  const { listing, quote, loading } = props;
  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded bg-muted">
          {listing.images[0] && (
            <Image src={listing.images[0]} alt={listing.title} fill sizes="80px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-medium text-foreground">{listing.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {listing.brand} · Size {listing.size}
          </p>
          <p className="text-xs text-muted-foreground">{conditionLabels[listing.condition]}</p>
        </div>
      </div>

      <PromoField {...props} />

      <dl className="space-y-2.5 border-t border-border pt-4">
        {loading || !quote ? (
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <>
            <Row label="Item" value={money(quote.subtotal)} />
            <Row
              label={`Shipping · ${quote.shippingLabel}`}
              value={quote.shipping === 0 ? "Free" : money(quote.shipping)}
              tone={quote.shipping === 0 ? "success" : undefined}
            />
            {quote.discount > 0 && (
              <Row label={`Discount (${quote.promo?.code})`} value={`−${money(quote.discount)}`} tone="success" />
            )}
            <Row label="Buyer protection" value="Included" tone="success" />
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="text-base font-semibold text-foreground">Total</dt>
              <dd className="text-xl font-bold tabular-nums text-foreground">{money(quote.total)}</dd>
            </div>
          </>
        )}
      </dl>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
        Your payment is held securely and only released to the seller once you confirm delivery.
      </p>
    </div>
  );
}

/** Sticky card on desktop. */
export function OrderSummaryCard(props: OrderSummaryProps) {
  return (
    <aside aria-label="Order summary" className="hidden rounded-md border border-border bg-background p-5 lg:sticky lg:top-6 lg:block">
      <h2 className="mb-4 text-base font-semibold text-foreground">Order summary</h2>
      <SummaryBody {...props} />
    </aside>
  );
}

/** Collapsible bar on mobile — shows the total even when closed. */
export function OrderSummaryMobile(props: OrderSummaryProps) {
  return (
    <Collapsible className="rounded border border-border bg-muted/30 lg:hidden">
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          Order summary
          <ChevronDown className="size-4 transition-transform group-data-[panel-open]:rotate-180" />
        </span>
        <span className="text-base font-bold tabular-nums text-foreground">
          {props.quote ? money(props.quote.total) : "…"}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border bg-background px-4 py-4">
        <SummaryBody {...props} />
      </CollapsibleContent>
    </Collapsible>
  );
}
