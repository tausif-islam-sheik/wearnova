"use client";

import { useState } from "react";
import type { Ref } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Heart,
  Info,
  Lock,
  Share2,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FollowButton } from "@/components/shared/FollowButton";
import { conditionLabels } from "@/components/shared/ConditionBadge";
import { useFavoritesStore } from "@/stores/useFavoritesStore";
import { useCartStore } from "@/stores/useCartStore";
import { useColorVariants } from "@/hooks/use-product-page";
import { useShippingMethods } from "@/hooks/use-shipping-methods";
import {
  brandSlug,
  conditionTooltips,
  percentOff,
  unavailableMessages,
  uploadedLabel,
} from "@/lib/listing-utils";
import { cn } from "@/lib/utils";
import type { Listing, User } from "@/types";

interface ProductInfoPanelProps {
  listing: Listing;
  available: boolean;
  seller: User | null;
  sellerLoading: boolean;
  matching: Listing[];
  reviewCount: number;
  onBuy: () => void;
  onOffer: () => void;
  ctaRef?: Ref<HTMLDivElement>;
}

function colorFromTitle(title: string) {
  const i = title.lastIndexOf(" - ");
  return i > 0 ? title.slice(i + 3) : undefined;
}

function PriceTag({ price, originalPrice }: { price: number; originalPrice?: number }) {
  const [whole, cents] = price.toFixed(2).split(".");
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-foreground">
        <span className="text-lg font-bold">$</span>
        <span className="text-[2rem] font-extrabold leading-none tracking-tight">{whole}</span>
        <span className="text-base font-bold">.{cents}</span>
      </span>
      {originalPrice !== undefined && originalPrice > price && (
        <span className="text-sm text-muted-foreground line-through">
          ${originalPrice.toFixed(2)}
        </span>
      )}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}

export function ProductInfoPanel({
  listing,
  available,
  seller,
  sellerLoading,
  matching,
  reviewCount,
  onBuy,
  onOffer,
  ctaRef,
}: ProductInfoPanelProps) {
  const isFavorited = useFavoritesStore((s) => s.favorites.includes(listing.id));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const inCart = useCartStore((s) => s.items.some((i) => i.listingId === listing.id));
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const { methods, loading: shippingLoading } = useShippingMethods();
  const freeShippingAvailable =
    !shippingLoading && methods.some((m) => m.enabled && m.freeEligible);

  const [size, setSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [allColors, setAllColors] = useState(false);
  const variants = useColorVariants(listing);
  const swatches = [listing, ...variants];
  const visibleSwatches = allColors ? swatches : swatches.slice(0, 12);

  const category = listing.categoryPath[listing.categoryPath.length - 1];
  const off = percentOff(listing.price, listing.originalPrice);
  const uploaded = uploadedLabel(listing.uploadedAt);
  const unavailable = unavailableMessages[listing.status];
  const bestseller = listing.likesCount >= 15;
  const rating = seller?.avgRating ?? listing.sellerRating ?? 0;
  const left = listing.quantity ?? 1;
  const sellerHref = seller ? `/seller/${seller.name.toLowerCase().replace(/ /g, "-")}` : "#";

  const handleAddToCart = () => {
    if (inCart) {
      setCartOpen(true);
      return;
    }
    if (!size) {
      setSizeError(true);
      return;
    }
    addItem(listing, size);
    setCartOpen(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      /* share sheet dismissed or clipboard unavailable */
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-base font-medium leading-snug text-foreground sm:text-lg">
            {category && (
              <Link
                href={`/search?q=${encodeURIComponent(category)}`}
                className="mr-1.5 inline-block -translate-y-px rounded-sm bg-violet-100 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
              >
                #{category.replace(/[^A-Za-z0-9]+/g, "")}
              </Link>
            )}
            {listing.title}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Share"
            onClick={handleShare}
            className="shrink-0"
          >
            <Share2 />
          </Button>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            SKU:{" "}
            <Link
              href={`/brands/${brandSlug(listing.brand)}`}
              className="hover:text-foreground hover:underline"
            >
              {listing.brand}
            </Link>{" "}
            · {listing.id.slice(-10)}
          </span>
          {reviewCount > 0 && (
            <a href="#reviews" className="flex items-center gap-1.5 hover:underline">
              <span className="flex text-rating" aria-label={`${rating.toFixed(1)} out of 5`}>
                {"★★★★★".slice(0, Math.max(1, Math.round(rating)))}
              </span>
              <span className="text-rating">({reviewCount} Reviews)</span>
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <PriceTag price={listing.price} originalPrice={listing.originalPrice} />
        {off !== null && (
          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">
            {off}% off
          </Badge>
        )}
        {available && left >= 2 && left <= 5 && (
          <Badge variant="outline" className="border-warning/40 text-warning">
            Only {left} left
          </Badge>
        )}
      </div>

      {bestseller && category && (
        <Link
          href={`/search?q=${encodeURIComponent(category)}&sort=popular`}
          className="flex items-center gap-2 bg-amber-100 px-2 py-1.5 text-xs text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
        >
          <span className="rounded-sm bg-amber-600 px-1.5 py-0.5 font-bold text-white">
            Bestseller
          </span>
          <span className="truncate">in {category}</span>
          <ChevronRight className="ml-auto size-3.5 shrink-0" />
        </Link>
      )}

      <div className="border-t border-dashed border-border pt-4">
        <p className="mb-3 text-sm">
          <span className="font-bold text-foreground">Color:</span>{" "}
          <span className="ml-1">{colorFromTitle(listing.title) ?? listing.color}</span>
        </p>
        <ul className="mb-5 grid grid-cols-6 gap-2" aria-label="Colors">
          {visibleSwatches.map((v) => {
            const current = v.id === listing.id;
            const label = colorFromTitle(v.title) ?? v.color;
            return (
              <li key={v.id}>
                <Link
                  href={`/products/${v.id}`}
                  aria-label={label ? `Color ${label}` : v.title}
                  aria-current={current ? "true" : undefined}
                  title={label}
                  className={cn(
                    "relative block aspect-[3/4] overflow-hidden border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    current ? "border-foreground ring-1 ring-foreground" : "border-transparent hover:border-border"
                  )}
                >
                  <Image src={v.images[0]!} alt="" fill unoptimized sizes="64px" className="object-cover" />
                </Link>
              </li>
            );
          })}
        </ul>
        {swatches.length > 12 && (
          <button
            type="button"
            onClick={() => setAllColors((v) => !v)}
            className="-mt-2 mb-4 flex cursor-pointer items-center gap-1 text-xs text-sky-700 hover:underline dark:text-sky-400"
          >
            {allColors ? "Show Less Colors" : "Show More Colors"}
            {allColors ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        )}
        <p className="text-sm font-bold text-foreground">
          Size
          {size && <span className="ml-2 font-normal">{size}</span>}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Size">
          {[listing.size].map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={size === s}
              disabled={!available}
              onClick={() => {
                setSize(s);
                setSizeError(false);
              }}
              className={cn(
                "min-w-16 cursor-pointer rounded-full border px-5 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                size === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {sizeError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            Please select a size.
          </p>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5" />
          {conditionLabels[listing.condition]} — {conditionTooltips[listing.condition]}
        </p>
      </div>

      {unavailable && (
        <div
          role="status"
          className="flex items-center gap-2 border border-border bg-muted px-3 py-2.5 text-sm text-foreground"
        >
          <Info className="size-4 shrink-0 text-muted-foreground" />
          {unavailable}
        </div>
      )}

      <div ref={ctaRef} className="space-y-2.5">
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            className="h-12 flex-1 rounded-none text-sm font-bold uppercase tracking-wide"
            disabled={!available}
            onClick={handleAddToCart}
          >
            {inCart ? "View cart" : "Add to cart"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={isFavorited ? "Remove from favourites" : "Add to favourites"}
            aria-pressed={isFavorited}
            onClick={() => toggleFavorite(listing.id)}
            className="size-12 shrink-0 rounded-full"
          >
            <Heart className={cn(isFavorited && "fill-destructive text-destructive")} />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="outline"
            className="h-11 rounded-none font-semibold"
            disabled={!available}
            onClick={onBuy}
          >
            Buy now
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-none font-semibold"
            disabled={!available}
            onClick={onOffer}
          >
            Make an offer
          </Button>
        </div>
      </div>

      <div className="space-y-4 bg-muted/50 p-4 text-sm">
        <p className="text-base font-semibold text-foreground">Shipping &amp; protection</p>
        <div className="flex items-start gap-3">
          <Truck className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="font-semibold text-success">
              {listing.shippingFree && freeShippingAvailable
                ? "Free shipping"
                : "Shipping calculated at checkout"}
            </p>
            <p className="text-xs text-muted-foreground">
              Final cost and delivery estimate are shown at checkout.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="font-semibold text-foreground">Buyer protection</p>
            <p className="text-xs text-muted-foreground">
              Your payment is held until you confirm delivery. Open a dispute if the item isn&apos;t
              as described.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Lock className="size-5 shrink-0 text-success" />
          <p className="font-semibold text-foreground">Secure payments</p>
        </div>
      </div>

      <Accordion multiple defaultValue={["description", "store", "matching"]}>
        <AccordionItem value="description">
          <AccordionTrigger className="py-3 text-base font-bold">Description</AccordionTrigger>
          <AccordionContent className="[&_a]:no-underline">
            <p className="whitespace-pre-line leading-relaxed text-foreground/80">
              {listing.description}
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="details">
          <AccordionTrigger className="py-3 text-base font-bold">Details &amp; fit</AccordionTrigger>
          <AccordionContent className="[&_a]:no-underline">
            <dl className="divide-y divide-border">
              <DetailRow label="Brand">{listing.brand}</DetailRow>
              <DetailRow label="Size">{listing.size}</DetailRow>
              <DetailRow label="Condition">{conditionLabels[listing.condition]}</DetailRow>
              {listing.color && <DetailRow label="Color">{listing.color}</DetailRow>}
              {listing.material && <DetailRow label="Material">{listing.material}</DetailRow>}
              {listing.pattern && <DetailRow label="Pattern">{listing.pattern}</DetailRow>}
              <DetailRow label="Listed">
                <span title={uploaded.exact}>{uploaded.short}</span>
              </DetailRow>
            </dl>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="store">
          <AccordionTrigger className="py-3 text-base font-bold">About seller</AccordionTrigger>
          <AccordionContent className="[&_a]:no-underline">
            {sellerLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : seller ? (
              <div className="space-y-3">
                <Link href={sellerHref} className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src={seller.avatarUrl} alt={seller.name} />
                    <AvatarFallback>
                      {seller.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-foreground">{seller.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-rating">★</span> {seller.avgRating.toFixed(1)} ·{" "}
                      {seller.ratingsCount} reviews
                    </p>
                  </div>
                </Link>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="outline"
                    className="rounded-none"
                    nativeButton={false}
                    render={<Link href={sellerHref} />}
                  >
                    All Items
                  </Button>
                  <FollowButton userId={seller.id} className="w-full rounded-none" />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Seller information is unavailable.</p>
            )}
          </AccordionContent>
        </AccordionItem>

        {matching.length > 0 && (
          <AccordionItem value="matching">
            <AccordionTrigger className="py-3 text-base font-bold">Matching styles</AccordionTrigger>
            <AccordionContent className="[&_a]:no-underline">
              <ul className="grid grid-cols-3 gap-2.5">
                {matching.map((m) => (
                  <li key={m.id}>
                    <Link href={`/products/${m.id}`} className="group block">
                      <span className="relative block aspect-[3/4] overflow-hidden bg-muted">
                        <Image
                          src={m.images[0]!}
                          alt={m.title}
                          fill
                          unoptimized
                          sizes="130px"
                          className="object-cover"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-xs font-semibold text-white">
                          ${m.price.toFixed(2)}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-foreground group-hover:underline">
                        {m.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
