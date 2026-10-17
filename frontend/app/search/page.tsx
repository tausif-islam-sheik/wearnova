"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ListingCard } from "@/components/shared/ListingCard";
import { FilterBar } from "@/components/shared/FilterBar";
import { FilterSidebar, FilterSidebarMobile } from "@/components/shared/FilterSidebar";
import { SortDropdown } from "@/components/shared/SortDropdown";
import { Pagination } from "@/components/shared/Pagination";
import { ListingGridSkeleton } from "@/components/shared/ListingCardSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useListingStore } from "@/stores/useListingStore";
import { useListingFilterStore } from "@/stores/useListingFilterStore";
import { findCategoryInTree, collectDescendantIds, getCategories, getCategoriesSync } from "@/lib/category-utils";
import type { Category } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

const ITEMS_PER_PAGE = 10;

function SearchContent() {
  const searchParams = useSearchParams();
  const listings = useListingStore((s) => s.listings);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { setFromQuery, search } = useListingFilterStore();
  const filters = useListingFilterStore();

  const query = searchParams.get("q") ?? "";
  const [catTree, setCatTree] = useState<Category[]>(() => getCategoriesSync());

  useEffect(() => {
    getCategories().then(setCatTree);
  }, []);

  const categoryIds = useMemo(() => {
    if (filters.category.length === 0 || filters.category[0] === "__all__") return null;
    const ids = new Set<string>();
    for (const catId of filters.category) {
      const cat = findCategoryInTree(catId, catTree);
      if (cat) {
        collectDescendantIds(cat).forEach((id) => ids.add(id));
      }
    }
    return ids.size > 0 ? ids : null;
  }, [filters.category, catTree]);

  useEffect(() => {
    const q: Record<string, string | undefined> = {};
    searchParams.forEach((val, key) => {
      q[key] = val;
    });
    setFromQuery(q);
    setLoading(false);
  }, [searchParams, setFromQuery]);

  const filteredListings = useMemo(() => {
    let result = listings.filter((l) => l.status === "active");

    if (categoryIds) {
      result = result.filter((l) => categoryIds.has(l.categoryId));
    }

    const searchTerm = search || query;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(lower) ||
          l.brand.toLowerCase().includes(lower) ||
          l.description.toLowerCase().includes(lower)
      );
    }

    const brandParam = searchParams.get("brand");
    if (brandParam) {
      result = result.filter(
        (l) => l.brand.toLowerCase() === brandParam.toLowerCase()
      );
    }

    if (filters.brand.length > 0) {
      result = result.filter((l) =>
        filters.brand.some((b) => l.brand?.toLowerCase() === b.toLowerCase())
      );
    }

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
  }, [listings, search, query, searchParams, filters, categoryIds]);

  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);
  const paginatedListings = filteredListings.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const brandParam = searchParams.get("brand");
  const displayQuery = search || query;
  const hasBrandScope = !!brandParam;

  const selectedCategoryName = useMemo(() => {
    if (filters.category.length === 0 || filters.category[0] === "__all__") return null;
    const cat = findCategoryInTree(filters.category[0], catTree);
    return cat?.name ?? null;
  }, [filters.category, catTree]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          {hasBrandScope ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbLink href="/search">Brands</BreadcrumbLink>
              <BreadcrumbSeparator />
              <BreadcrumbPage>{brandParam}</BreadcrumbPage>
            </>
          ) : (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbPage>
                {displayQuery ? `Search: "${displayQuery}"` : "Search"}
              </BreadcrumbPage>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {hasBrandScope ? (
        <div className="flex gap-8">
          <FilterSidebar lockedBrand={brandParam} />
          <div className="flex-1 min-w-0">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-baseline gap-3">
                <h1 className="truncate text-2xl font-bold text-foreground sm:text-3xl">{brandParam}</h1>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {filteredListings.length}+ results
                  {selectedCategoryName && ` in ${selectedCategoryName}`}
                </span>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
                <FilterSidebarMobile lockedBrand={brandParam} />
                <SortDropdown className="flex-1 sm:flex-none" />
              </div>
            </div>
            {loading ? (
              <ListingGridSkeleton />
            ) : paginatedListings.length === 0 ? (
              <EmptyState
                title={`No ${brandParam} listings found`}
                description="Try adjusting your filters or check back later."
                actionLabel="Clear filters"
                actionHref={`/search?brand=${encodeURIComponent(brandParam!)}`}
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
      ) : (
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex min-w-0 items-baseline gap-3">
              <h1 className="truncate text-xl font-bold text-foreground">
                {displayQuery ? `Results for "${displayQuery}"` : "All listings"}
              </h1>
              <span className="shrink-0 text-sm text-muted-foreground">
                {filteredListings.length}+ results
                {selectedCategoryName && ` in ${selectedCategoryName}`}
              </span>
            </div>
            <div className="ml-0 flex w-full items-center gap-3 sm:ml-auto sm:w-auto">
              <SortDropdown className="w-full sm:w-auto" />
            </div>
          </div>
          <FilterBar />
          <div className="mt-6">
            {loading ? (
              <ListingGridSkeleton />
            ) : paginatedListings.length === 0 ? (
              <EmptyState
                title="No results found"
                description="Try different keywords or remove filters."
                actionLabel="Clear search"
                actionHref="/"
              />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-6">
          <ListingGridSkeleton />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
