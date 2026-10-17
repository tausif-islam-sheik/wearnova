"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Check, Star, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/useCartStore";
import { QuickAddDialog } from "@/components/shared/QuickAddDialog";
import { LikeButton } from "@/components/shared/LikeButton";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

export function ListingCard({ listing, className }: ListingCardProps) {
  const inCart = useCartStore((s) =>
    s.items.some((i) => i.listingId === listing.id),
  );
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const removeItem = useCartStore((s) => s.removeItem);
  const available = listing.status === "active";
  const category = listing.categoryPath[listing.categoryPath.length - 1];
  const bestseller = listing.likesCount >= 15;
  const rating = listing.sellerRating ?? 0;
  const reviews = listing.sellerReviews ?? 0;

  const openQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) {
      removeItem(listing.id);
      toast.success("Removed from cart");
    } else {
      setQuickAddOpen(true);
    }
  };

  return (
    <>
      <Link
        href={`/products/${listing.id}`}
        className={`contents ${className ?? ""}`}
      >
        <Card className="group flex h-full flex-col overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow p-0 gap-0 rounded">
          <div className="relative aspect-[3/4] bg-surface-muted overflow-hidden shrink-0">
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              unoptimized
              className="object-cover product-image-zoom"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            />
            {listing.isPromoted && (
              <Badge className="absolute top-2 left-2 bg-brand-primary text-white text-[10px] px-2 py-0.5">
                Bumped
              </Badge>
            )}
            <div className="absolute top-2 right-2">
              <LikeButton
                listingId={listing.id}
                initialCount={listing.likesCount}
                size="sm"
              />
            </div>
          </div>
          <div className="p-3 space-y-1 mt-auto">
            {category && (
            <div className="flex items-center gap-1.5 overflow-hidden text-[11px] font-medium">
              {bestseller ? (
                <span className="flex min-w-0 items-center gap-1">
                  <span className="shrink-0 rounded-sm bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                    Bestseller
                  </span>
                  <span className="truncate text-foreground-muted">in {category}</span>
                  <ChevronRight className="size-3 shrink-0 text-foreground-muted" />
                </span>
              ) : (
                <span className="flex min-w-0 items-center gap-1 rounded-sm bg-violet-100 px-1.5 py-0.5 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                  <span className="truncate">#{category.replace(/[^A-Za-z0-9]+/g, "")}</span>
                  <ChevronRight className="size-3 shrink-0" />
                </span>
              )}
            </div>
          )}
          <p className="text-sm font-medium text-foreground truncate">
              {listing.title}
            </p>
            {reviews > 0 && (
            <div className="flex items-center gap-1 text-xs text-foreground-muted">
              <span className="flex" aria-label={`${rating.toFixed(1)} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={
                      n <= Math.round(rating)
                        ? "size-3 fill-amber-400 text-amber-400"
                        : "size-3 text-border"
                    }
                  />
                ))}
              </span>
              <span>({reviews})</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
              <p className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold leading-none tracking-tight text-brand-primary">
                  ${listing.price.toFixed(2)}
                </span>
                {listing.originalPrice != null && listing.originalPrice > listing.price && (
                  <span className="text-xs text-foreground-muted line-through">
                    ${listing.originalPrice.toFixed(2)}
                  </span>
                )}
              </p>
              {available && (
                <Button
                  type="button"
                  size="icon-sm"
                  variant={inCart ? "default" : "outline"}
                  aria-label={inCart ? "Remove from cart" : "Add to cart"}
                  onClick={openQuickAdd}
                >
                  {inCart ? <Check /> : <ShoppingCart />}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </Link>
      {available && (
        <QuickAddDialog
          listing={listing}
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
        />
      )}
    </>
  );
}
