"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/shared/ListingCard";
import { useFavoritesStore } from "@/stores/useFavoritesStore";
import { useListingStore } from "@/stores/useListingStore";

export default function FavoritesPage() {
  const { favorites } = useFavoritesStore();
  const listings = useListingStore((s) => s.listings);

  const favoriteListings = listings.filter((l) => favorites.includes(l.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-6">
        Favorited Items
      </h1>

      {favoriteListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart
            className="size-12 text-pink-400 mb-5"
            strokeWidth={1.5}
          />
          <h2 className="text-lg font-bold text-foreground mb-1">
            Save your favorites
          </h2>
          <p className="text-sm text-foreground-muted mb-6">
            Favorite some items and find them here
          </p>
          <Link href="/">
            <Button className="rounded bg-brand-primary text-white hover:bg-brand-primary-hover px-6">
              Browse
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {favoriteListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
