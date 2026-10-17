"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ListingCard } from "@/components/shared/ListingCard";
import { FilterSidebar, FilterSidebarMobile } from "@/components/shared/FilterSidebar";
import { SortDropdown } from "@/components/shared/SortDropdown";
import { Pagination } from "@/components/shared/Pagination";
import { ListingGridSkeleton } from "@/components/shared/ListingCardSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useListingStore } from "@/stores/useListingStore";
import { useListingFilterStore } from "@/stores/useListingFilterStore";

const ITEMS_PER_PAGE = 10;

function BrandContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const listings = useListingStore((s) => s.listings);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { setFromQuery } = useListingFilterStore();
  const filters = useListingFilterStore();

  const brandSlug = (params.brand as string) ?? "";
  const brandName = decodeURIComponent(brandSlug).replace(/-/g, " ");

  useEffect(() => {
    const query: Record<string, string | undefined> = {};
    searchParams.forEach((val, key) => {
      query[key] = val;
    });
    setFromQuery(query);
    setLoading(false);
  }, [searchParams, setFromQuery]);

  const filteredListings = useMemo(() => {
    let result = listings.filter((l) => l.status === "active");

    result = result.filter(
      (l) => l.brand?.toLowerCase() === brandName.toLowerCase()
    );

    if (filters.size.length > 0) {
      result = result.filter((l) =>
        filters.size.some((s) =>
          l.size.toUpperCase().includes(s.toUpperCase())
        )
      );
    }
    if (filters.condition.length > 0) {
      result = result.filter((l) => filters.condition.includes(l.condition));
    }
    if (filters.color.length > 0) {
      result = result.filter(
        (l) => l.color && filters.color.includes(l.color)
      );
    }
    if (filters.priceMin !== null) {
      result = result.filter((l) => l.price >= filters.priceMin!);
    }
    if (filters.priceMax !== null) {
      result = result.filter((l) => l.price <= filters.priceMax!);
    }

    switch (filters.sort) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        result.sort((a, b) => b.likesCount - a.likesCount);
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.uploadedAt).getTime() -
            new Date(b.uploadedAt).getTime()
        );
        break;
      default:
        result.sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() -
            new Date(a.uploadedAt).getTime()
        );
    }

    return result;
  }, [listings, brandName, filters]);

  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);
  const paginatedListings = filteredListings.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbLink href="/search">Brands</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{brandName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6 space-y-2">
        <h1 className="text-xl font-bold text-foreground">{brandName}</h1>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filteredListings.length}+ results
          </span>
          <div className="flex items-center gap-3">
            <FilterSidebarMobile lockedBrand={brandName} />
            <SortDropdown />
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        <FilterSidebar lockedBrand={brandName} />

        <div className="flex-1 min-w-0">
          {loading ? (
            <ListingGridSkeleton className="lg:!grid-cols-4" />
          ) : paginatedListings.length === 0 ? (
            <EmptyState
              title={`No ${brandName} listings found`}
              description="Try adjusting your filters or check back later."
              actionLabel="Clear filters"
              actionHref={`/brands/${brandSlug}`}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {paginatedListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-6">
          <ListingGridSkeleton />
        </div>
      }
    >
      <BrandContent />
    </Suspense>
  );
}
