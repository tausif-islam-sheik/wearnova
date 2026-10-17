"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { useAdminLoading, FormPageSkeleton } from "@/components/admin/PageSkeletons";
import { LoadError } from "@/components/admin/LoadError";
import { api, ApiError } from "@/lib/api";
import type { Listing } from "@/types";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const loading = useAdminLoading();
  const [listing, setListing] = useState<Listing | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    api.get<Listing>(`/listings/${id}`)
      .then(setListing)
      .catch((e) => {
        setListing(null);
        setError(e);
      })
      .finally(() => setDataLoading(false));
  }, [id, reloadKey]);

  if (loading || dataLoading) return <FormPageSkeleton />;
  if (error && !(error instanceof ApiError && error.statusCode === 404)) {
    return <LoadError what="this product" error={error} onRetry={() => {
          setDataLoading(true);
          setError(null);
          setReloadKey((k) => k + 1);
        }}
      />;
  }
  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center text-muted-foreground">
        Product not found
      </div>
    );
  }

  return (
    <ProductForm
      listingId={id}
      initialData={{
        title: listing.title,
        description: listing.description,
        price: String(listing.price),
        brand: listing.brand,
        size: listing.size,
        condition: listing.condition,
        material: listing.material ?? "",
        color: listing.color ?? "",
        pattern: listing.pattern ?? "",
        images: listing.images.join(", "),
        categoryId: listing.categoryId,
        sellerId: listing.sellerId,
        status: listing.status,
        quantity: String(listing.quantity ?? 1),
        shippingFree: listing.shippingFree ?? false,
        isPromoted: listing.isPromoted ?? false,
      }}
    />
  );
}
