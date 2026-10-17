"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { ListingCard } from "@/components/shared/ListingCard";
import { CarouselHero } from "@/components/shared/CarouselHero";
import { PopularCategories } from "@/components/shared/PopularCategories";
import { ListingGridSkeleton } from "@/components/shared/ListingCardSkeleton";
import { Container } from "@/components/layout/container";
import { useListingStore } from "@/stores/useListingStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";

const ITEMS_PER_PAGE = 30;

export default function Home() {
  const listings = useListingStore((s) => s.listings);
  const hydrated = useListingStore((s) => s.hydrated);
  const loading = useListingStore((s) => s.loading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authHydrated = useAuthHydrated();
  const [ready, setReady] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    if (hydrated || !loading) {
      const timer = setTimeout(() => setReady(true), 300);
      return () => clearTimeout(timer);
    }
  }, [hydrated, loading]);

  const activeListings = listings.filter((l) => l.status === "active");
  const sortedListings = [...activeListings].sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
  const recentListings = sortedListings.slice(0, visibleCount);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || visibleCount >= sortedListings.length) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setTimeout(() => {
      loadingMoreRef.current = false;
      setVisibleCount((c) => c + ITEMS_PER_PAGE);
      setLoadingMore(false);
    }, 400);
  }, [visibleCount, sortedListings.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, ready, isAuthenticated]);

  if (!authHydrated) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <ListingGridSkeleton count={5} />
      </section>
    );
  }

  if (isAuthenticated) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        {!ready ? (
          <ListingGridSkeleton />
        ) : recentListings.length === 0 ? (
          <p className="text-sm text-foreground-muted py-8 text-center">
            No listings yet. Be the first to sell!
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {recentListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            {visibleCount < sortedListings.length && (
              <div ref={sentinelRef} className="flex justify-center py-8">
                {loadingMore && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
              </div>
            )}
            {visibleCount >= sortedListings.length && sortedListings.length > ITEMS_PER_PAGE && (
              <p className="text-center text-sm text-foreground-muted py-8">
                You&apos;ve seen it all
              </p>
            )}
          </>
        )}
      </section>
    );
  }

  return (
    <div>
      <section className="py-6">
        <Container>
          <CarouselHero />
        </Container>
      </section>

      <PopularCategories />

      {/* Recent listings */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Recently listed
          </h2>
        </div>
        {!ready ? (
          <ListingGridSkeleton />
        ) : recentListings.length === 0 ? (
          <p className="text-sm text-foreground-muted py-8 text-center">
            No listings yet. Be the first to sell!
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {recentListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            {visibleCount < sortedListings.length && (
              <div ref={sentinelRef} className="flex justify-center py-8">
                {loadingMore && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
              </div>
            )}
            {visibleCount >= sortedListings.length && sortedListings.length > ITEMS_PER_PAGE && (
              <p className="text-center text-sm text-foreground-muted py-8">
                You&apos;ve seen it all
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
