"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useListingStore } from "@/stores/useListingStore";
import type { Listing, Review, User } from "@/types";

export interface ProductReview extends Review {
  reviewer: { id: string; name: string; avatarUrl?: string | null };
}

interface Keyed<T> {
  key: string;
  value: T;
}

interface ListingsResponse {
  listings: Listing[];
}

const ROW_SIZE = 15;
const SIMILAR_SIZE = 6;

/** Fetch keyed by `key` so stale results from a previous product never show. */
function useKeyedFetch<T>(key: string | null, fetcher: () => Promise<T>, fallback: T) {
  const [result, setResult] = useState<Keyed<T> | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetcher()
      .then((value) => !cancelled && setResult({ key, value }))
      .catch(() => !cancelled && setResult({ key, value: fallback }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetcher/fallback are derived from `key`
  }, [key]);

  const ready = key !== null && result?.key === key;
  return { value: ready ? result.value : fallback, loading: key !== null && !ready };
}

/** The listing itself: from the store if already loaded, otherwise fetched by id. */
export function useProductListing(id: string) {
  const storeListing = useListingStore((s) => s.listings.find((l) => l.id === id));
  const fetched = useKeyedFetch<Listing | null>(
    storeListing ? null : id,
    () => api.get<Listing>(`/listings/${id}`),
    null
  );
  return {
    listing: storeListing ?? fetched.value,
    listingLoading: !storeListing && fetched.loading,
  };
}

/** "Name - Colour" titles: the part before the last " - " identifies the product. */
export function productBaseName(title: string) {
  const i = title.lastIndexOf(" - ");
  return i > 0 ? title.slice(0, i) : title;
}

/** Other active listings of the same product (same name and brand), i.e. its colour variants. */
export function useColorVariants(listing: Listing) {
  const base = productBaseName(listing.title);
  const result = useKeyedFetch<Listing[]>(
    `${listing.id}:${base}`,
    () =>
      api
        .get<ListingsResponse>(`/listings?search=${encodeURIComponent(base)}&limit=50`)
        .then((r) =>
          r.listings.filter(
            (l) =>
              l.id !== listing.id &&
              l.status === "active" &&
              l.brand === listing.brand &&
              productBaseName(l.title) === base
          )
        ),
    []
  );
  return result.value;
}

/** Seller, the seller's other items and similar items for an already-loaded listing. */
export function useProductExtras(listing: Listing) {
  const { id, sellerId, categoryId } = listing;

  const seller = useKeyedFetch<User | null>(
    sellerId,
    () => api.get<User>(`/users/${sellerId}`),
    null
  );

  const otherItems = useKeyedFetch<Listing[]>(
    `${sellerId}:${id}`,
    () =>
      api
        .get<ListingsResponse>(`/listings?sellerId=${sellerId}&limit=${ROW_SIZE + 1}`)
        .then((r) => r.listings.filter((l) => l.id !== id).slice(0, ROW_SIZE)),
    []
  );

  const similarItems = useKeyedFetch<Listing[]>(
    `${categoryId}:${id}`,
    () =>
      api
        .get<ListingsResponse>(`/listings?categoryId=${categoryId}&limit=${ROW_SIZE + SIMILAR_SIZE + 6}`)
        .then((r) =>
          r.listings
            .filter((l) => l.id !== id && l.sellerId !== sellerId)
            .slice(0, ROW_SIZE + SIMILAR_SIZE)
        ),
    []
  );

  const reviews = useKeyedFetch<ProductReview[]>(
    sellerId,
    () =>
      api
        .get<{ reviews: ProductReview[] }>(`/reviews?sellerId=${sellerId}`)
        .then((r) => r.reviews),
    []
  );

  return {
    reviews: reviews.value,
    reviewsLoading: reviews.loading,
    seller: seller.value,
    sellerLoading: seller.loading,
    otherItems: otherItems.value,
    otherItemsLoading: otherItems.loading,
    similarItems: similarItems.value,
  };
}
