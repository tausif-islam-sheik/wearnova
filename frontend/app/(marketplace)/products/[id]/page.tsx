"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProductGalleryRail } from "@/components/product/product-gallery-rail";
import { ProductInfoPanel } from "@/components/product/product-info-panel";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductBreadcrumb } from "@/components/product/product-breadcrumb";
import { ProductPageSkeleton } from "@/components/product/product-page-skeleton";
import { MobileBuyBar } from "@/components/product/mobile-buy-bar";
import { OfferDialog, useProductActions } from "@/components/product/product-actions";
import { ProductQuestions } from "@/components/product/product-questions";
import { ReportDialog } from "@/components/product/report-dialog";
import { ListingCard } from "@/components/shared/ListingCard";
import { ListingGridSkeleton } from "@/components/shared/ListingCardSkeleton";
import { Container } from "@/components/layout/container";
import { useProductExtras, useProductListing } from "@/hooks/use-product-page";
import type { Listing } from "@/types";

function ListingRow({
  title,
  listings,
  loading,
}: {
  title: string;
  listings: Listing[];
  loading: boolean;
}) {
  if (!loading && listings.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="mb-4 text-xl font-semibold text-foreground">{title}</h2>
      {loading ? (
        <ListingGridSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductDetail({ listing }: { listing: Listing }) {
  const {
    seller,
    sellerLoading,
    otherItems,
    otherItemsLoading,
    similarItems,
    reviews,
    reviewsLoading,
  } = useProductExtras(listing);
  const moreItems = [...otherItems, ...similarItems.filter((l) => !otherItems.some((o) => o.id === l.id))].slice(0, 15);
  const { available, buyNow, makeOffer, offerOpen, setOfferOpen } = useProductActions(listing);
  const [reportOpen, setReportOpen] = useState(false);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  return (
    <Container className="pb-24 pt-6 lg:pb-12">
      <ProductBreadcrumb
        categoryPath={listing.categoryPath}
        onReport={() => setReportOpen(true)}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0 space-y-12">
          <ProductGalleryRail images={listing.images} title={listing.title} />
          <ProductReviews reviews={reviews} loading={reviewsLoading} sellerName={seller?.name} />
          <ProductQuestions listing={listing} />
        </div>

        <div className="min-w-0">
          <ProductInfoPanel
            listing={listing}
            available={available}
            seller={seller}
            sellerLoading={sellerLoading}
            matching={similarItems.slice(0, 6)}
            reviewCount={reviews.length}
            onBuy={buyNow}
            onOffer={makeOffer}
            ctaRef={ctaRef}
          />
        </div>
      </div>

      <ListingRow title="You may also like" listings={moreItems} loading={otherItemsLoading} />

      <MobileBuyBar
        listing={listing}
        available={available}
        targetRef={ctaRef}
        onBuy={buyNow}
        onOffer={makeOffer}
      />
      <OfferDialog listing={listing} open={offerOpen} onOpenChange={setOfferOpen} />

      <ReportDialog listingId={listing.id} open={reportOpen} onOpenChange={setReportOpen} />
    </Container>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { listing, listingLoading } = useProductListing(params.id);

  if (listingLoading) return <ProductPageSkeleton />;

  if (!listing) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-xl font-bold">Listing not found</h1>
        <p className="mt-2 text-muted-foreground">This listing may have been removed.</p>
        <Link href="/" className="mt-4 inline-block font-medium text-brand-primary hover:underline">
          Back to home
        </Link>
      </Container>
    );
  }

  return <ProductDetail key={listing.id} listing={listing} />;
}
