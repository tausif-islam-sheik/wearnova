"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Lock, Pencil } from "lucide-react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import {
  formatAddressLines,
  money,
} from "@/lib/checkout";
import type { Address } from "@/types";

/** Publishable key comes from the backend (Admin → Settings → Payments), cached per page load. */
let stripePromiseCache: Promise<Stripe | null> | undefined;

function loadStripeFromApi(): Promise<Stripe | null> {
  if (stripePromiseCache === undefined) {
    stripePromiseCache = api
      .get<{ publishableKey: string | null }>("/stripe/config")
      .then((cfg) =>
        cfg.publishableKey ? loadStripe(cfg.publishableKey) : null,
      )
      .catch(() => {
        stripePromiseCache = undefined; // allow a retry on the next mount
        return null;
      });
  }
  return stripePromiseCache;
}

function useStripePromise() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; stripe: Promise<Stripe | null> | null }
  >({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    loadStripeFromApi().then((stripe) => {
      if (!cancelled)
        setState({
          status: "ready",
          stripe: stripe ? Promise.resolve(stripe) : null,
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

interface PaymentStepProps {
  orderId: string;
  clientSecret: string | null;
  total: number;
  address: Address;
  shippingLabel: string;
  shippingEta: string;
  onBack: () => void;
}

interface ShellProps extends Pick<
  PaymentStepProps,
  "total" | "address" | "shippingLabel" | "shippingEta" | "onBack"
> {
  /** The payment-method area (the Stripe card form). */
  children: React.ReactNode;
  heading: React.ReactNode;
  ready: boolean;
  paying: boolean;
  error: string | null;
  onPay: () => void;
  payLabel?: string;
}

/** Review + payment area + terms + actions. */
function PaymentShell({
  total,
  address,
  shippingLabel,
  shippingEta,
  onBack,
  children,
  heading,
  ready,
  paying,
  error,
  onPay,
  payLabel,
}: ShellProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-8">
      <section aria-labelledby="review-heading">
        <h2
          id="review-heading"
          className="mb-3 text-base font-semibold text-foreground"
        >
          Review
        </h2>
        <div className="divide-y divide-border rounded-md border border-border text-sm">
          <div className="flex items-start justify-between gap-4 p-4">
            <div>
              <p className="mb-1 font-medium text-foreground">Ship to</p>
              {formatAddressLines(address).map((line, i) => (
                <p key={i} className="text-muted-foreground">
                  {line}
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={onBack}
              className="flex cursor-pointer items-center gap-1 text-sm font-medium text-foreground underline-offset-2 hover:underline"
            >
              <Pencil className="size-3.5" /> Change
            </button>
          </div>
          <div className="p-4">
            <p className="mb-1 font-medium text-foreground">Shipping</p>
            <p className="text-muted-foreground">
              {shippingLabel}{shippingEta ? ` · ${shippingEta.toLowerCase()}` : ""}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="payment-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="payment-heading"
            className="text-base font-semibold text-foreground"
          >
            Payment
          </h2>
          {heading}
        </div>
        {children}
      </section>

      <div className="flex items-start gap-2.5">
        <Checkbox
          id="terms"
          checked={agreed}
          onCheckedChange={(v) => setAgreed(v === true)}
          className="mt-0.5"
        />
        <Label
          htmlFor="terms"
          className="cursor-pointer text-sm font-normal leading-snug text-muted-foreground"
        >
          <span>
            I agree to the{" "}
            <Link
              href="/terms"
              target="_blank"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Privacy Policy
            </Link>
            , and understand my payment is held until I confirm delivery.
          </span>
        </Label>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-12 sm:px-6"
          onClick={onBack}
          disabled={paying}
        >
          <ChevronLeft className="mr-1 size-4" /> Back
        </Button>
        <Button
          type="button"
          className="h-12 flex-1 text-base font-semibold"
          disabled={!ready || !agreed || paying}
          onClick={onPay}
        >
          {paying ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Lock className="mr-2 size-4" />
          )}
          {payLabel ?? `Pay ${money(total)}`}
        </Button>
      </div>
      {!agreed && (
        <p className="-mt-4 text-center text-xs text-muted-foreground">
          Accept the terms to place your order.
        </p>
      )}
    </div>
  );
}

function StripePayForm(props: Omit<PaymentStepProps, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    const submitted = await elements.submit();
    if (submitted.error) {
      setError(submitted.error.message ?? "Please check your payment details.");
      setPaying(false);
      return;
    }
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?orderId=${props.orderId}`,
      },
    });
    // Only reached when confirmation fails or needs the buyer to fix something;
    // on success Stripe redirects to return_url.
    setError(
      confirmError.message ??
        "Your payment could not be completed. Please try again.",
    );
    setPaying(false);
  };

  return (
    <PaymentShell
      {...props}
      ready={Boolean(stripe && elements)}
      paying={paying}
      error={error}
      onPay={handlePay}
      heading={
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" /> Secured by Stripe
        </span>
      }
    >
      <div className="rounded-md border border-border p-4">
        <PaymentElement />
      </div>
    </PaymentShell>
  );
}

export function PaymentStep({ clientSecret, ...rest }: PaymentStepProps) {
  const stripeState = useStripePromise();

  if (stripeState.status === "loading") {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading secure payment form…
      </div>
    );
  }

  if (!stripeState.stripe || !clientSecret) {
    return (
      <div
        role="alert"
        className="rounded-md border border-border bg-muted/40 p-6 text-sm"
      >
        <p className="font-semibold text-foreground">
          Card payments aren&apos;t available yet
        </p>
        <p className="mt-1 text-muted-foreground">
          The store hasn&apos;t finished setting up payments. Please try again
          later, or contact support if this keeps happening.
        </p>
        <Button variant="outline" className="mt-4" onClick={rest.onBack}>
          <ChevronLeft className="mr-1 size-4" /> Back
        </Button>
      </div>
    );
  }

  return (
    <Elements
      // Re-mount when the amount changes (user went back and changed shipping/promo).
      key={`${clientSecret}:${rest.total}`}
      stripe={stripeState.stripe}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: { colorPrimary: "#111111", borderRadius: "8px" },
        },
      }}
    >
      <StripePayForm {...rest} />
    </Elements>
  );
}
