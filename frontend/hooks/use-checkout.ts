"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProductListing } from "@/hooks/use-product-page";
import { useShippingMethods } from "@/hooks/use-shipping-methods";
import {
  toAddressPayload,
  toFormValues,
  type AddressFormValues,
} from "@/lib/checkout";
import type { Address, Order, Quote, ShippingMethodId } from "@/types";

export type CheckoutStep = "delivery" | "payment";

export const NEW_ADDRESS = "new";

interface PlacedOrder {
  id: string;
  total: number;
  clientSecret: string | null;
  address: Address;
}

type QuoteMap = Partial<Record<ShippingMethodId, Quote>>;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useCheckout(listingId: string) {
  const { listing, listingLoading } = useProductListing(listingId);
  const userId = useAuthStore((s) => s.user?.id);

  const [step, setStep] = useState<CheckoutStep>("delivery");
  const [saved, setSaved] = useState<Address[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const shipping = useShippingMethods();
  const [chosenMethod, setMethodId] = useState<ShippingMethodId>("standard");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [quoteState, setQuoteState] = useState<{ key: string; quotes: QuoteMap; error?: string } | null>(null);
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saved addresses
  useEffect(() => {
    let cancelled = false;
    api
      .get<Address[]>("/addresses")
      .then((list) => !cancelled && setSaved(list))
      .catch(() => !cancelled && setSaved([]));
    return () => {
      cancelled = true;
    };
  }, []);

  // Only methods an admin has switched on; fall back to the first one if the chosen one is off.
  const methods = shipping.methods.filter((m) => m.enabled);
  const methodId: ShippingMethodId = methods.some((m) => m.id === chosenMethod)
    ? chosenMethod
    : (methods[0]?.id ?? "standard");
  const methodIds = methods.map((m) => m.id);

  // Server-side quotes for every available shipping method (re-fetched when the promo changes)
  const quoteKey =
    listing && !shipping.loading ? `${listing.id}:${appliedPromo ?? ""}:${methodIds.join(",")}` : null;
  useEffect(() => {
    if (!quoteKey || !listing) return;
    let cancelled = false;
    Promise.allSettled(
      methodIds.map((m) =>
        api.post<Quote>("/orders/quote", {
          listingId: listing.id,
          shippingMethod: m,
          ...(appliedPromo ? { promoCode: appliedPromo } : {}),
        })
      )
    ).then((results) => {
      if (cancelled) return;
      const quotes: QuoteMap = {};
      let firstError: string | undefined;
      results.forEach((r, i) => {
        if (r.status === "fulfilled") quotes[methodIds[i]!] = r.value;
        else firstError ??= errorMessage(r.reason, "Could not price this order");
      });
      setQuoteState({ key: quoteKey, quotes, error: Object.keys(quotes).length ? undefined : firstError });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- quoteKey captures listing id + promo
  }, [quoteKey]);

  const quotesReady = quoteState?.key === quoteKey;
  const quotes: QuoteMap = quotesReady ? quoteState!.quotes : {};
  const quoteLoading = quoteKey !== null && !quotesReady;
  const quoteError = quotesReady ? quoteState!.error ?? null : null;
  const quote = quotes[methodId] ?? Object.values(quotes)[0] ?? null;

  const defaultId = saved?.find((a) => a.isDefault)?.id ?? saved?.[0]?.id ?? NEW_ADDRESS;
  const effectiveSelectedId =
    selectedId && (selectedId === NEW_ADDRESS || saved?.some((a) => a.id === selectedId))
      ? selectedId
      : defaultId;

  const applyPromo = useCallback(
    async (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed || !listingId) return;
      setPromoBusy(true);
      setPromoError(null);
      try {
        await api.post<Quote>("/orders/quote", {
          listingId,
          shippingMethod: methodId,
          promoCode: trimmed,
        });
        setAppliedPromo(trimmed);
      } catch (e) {
        setPromoError(errorMessage(e, "This promo code can't be applied."));
      } finally {
        setPromoBusy(false);
      }
    },
    [listingId, methodId]
  );

  const removePromo = useCallback(() => {
    setAppliedPromo(null);
    setPromoError(null);
  }, []);

  /** Create (or update) the order, then create/refresh its PaymentIntent. */
  const continueToPayment = useCallback(
    async (values: AddressFormValues, address: Address, saveForLater: boolean) => {
      if (!listingId) return;
      setSubmitting(true);
      setError(null);
      try {
        const placed = await api.post<Order>("/orders", {
          listingId,
          shippingMethod: methodId,
          ...(appliedPromo ? { promoCode: appliedPromo } : {}),
          shippingAddress: toAddressPayload(values),
        });
        const { clientSecret } = await api.post<{ clientSecret: string | null }>(
          `/orders/${placed.id}/checkout`
        );
        setOrder({ id: placed.id, total: placed.total, clientSecret, address });
        setStep("payment");
        window.scrollTo({ top: 0, behavior: "smooth" });

        if (saveForLater) {
          api
            .post<Address>("/addresses", { ...toAddressPayload(values), isDefault: !saved?.length })
            .then((created) => setSaved((prev) => [...(prev ?? []), created]))
            .catch(() => undefined);
        }
      } catch (e) {
        setError(errorMessage(e, "We couldn't start your payment. Please try again."));
      } finally {
        setSubmitting(false);
      }
    },
    [listingId, methodId, appliedPromo, saved]
  );

  const continueWithSaved = useCallback(
    (address: Address) => continueToPayment(toFormValues(address), address, false),
    [continueToPayment]
  );

  const backToDelivery = useCallback(() => {
    setStep("delivery");
    setError(null);
  }, []);

  return {
    listing,
    listingLoading,
    isOwnListing: Boolean(listing && userId && listing.sellerId === userId),
    step,
    saved,
    selectedId: effectiveSelectedId,
    setSelectedId,
    methodId,
    setMethodId,
    methods,
    quotes,
    quote,
    quoteLoading,
    quoteError,
    appliedPromo,
    promoError,
    promoBusy,
    applyPromo,
    removePromo,
    order,
    submitting,
    error,
    continueToPayment,
    continueWithSaved,
    backToDelivery,
  };
}
