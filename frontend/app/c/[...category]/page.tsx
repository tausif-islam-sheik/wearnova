"use client";

import { Suspense, useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
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
import { EmptyState } from "@/components/shared/EmptyState";
import { useListingStore } from "@/stores/useListingStore";
import { useListingFilterStore } from "@/stores/useListingFilterStore";
import { findCategoryInTree, collectDescendantIds, getCategoryPathToRoot, getCategories, getCategoriesSync } from "@/lib/category-utils";
import type { Category } from "@/types";

const ITEMS_PER_PAGE = 24;

function CategoryContent() {
  const params = useParams();
  const listings = useListingStore((s) => s.listings);
  const [page, setPage] = useState(1);
  const { setFilter } = useListingFilterStore();
  const filters = useListingFilterStore();

  const [catTree, setCatTree] = useState<Category[]>(() => getCategoriesSync());

  useEffect(() => {
    getCategories().then(setCatTree);
  }, []);

  const categoryPath = Array.isArray(params.category)
    ? params.category
    : [params.category];

  const syncedCategoryRef = useRef<string | null>(null);

  const matchedCategory = useMemo(() => {
    if (!categoryPath.length) return null;
    let current = catTree.find((c) => c.slug === categoryPath[0]) ?? null;
    for (let i = 1; i < categoryPath.length && current; i++) {
      current = (current.subcategories ?? []).find((s) => s.slug === categoryPath[i]) ?? null;
    }
    return current;
  }, [categoryPath, catTree]);

  const categoryIds = useMemo(() => {
    if (filters.category[0] === "__all__") return null;

    if (filters.category.length > 0) {
      const ids = new Set<string>();
      for (const catId of filters.category) {
        const cat = findCategoryInTree(catId, catTree);
        if (cat) {
          const descendantIds = collectDescendantIds(cat);
          descendantIds.forEach((id) => ids.add(id));
        }
      }
      return ids;
    }

    if (!matchedCategory) return null;
    return collectDescendantIds(matchedCategory);
  }, [matchedCategory, filters.category, catTree]);

  useEffect(() => {
    if (!matchedCategory) return;
    if (syncedCategoryRef.current === matchedCategory.id) return;
    syncedCategoryRef.current = matchedCategory.id;
    setFilter("category", [matchedCategory.id]);
  }, [matchedCategory, setFilter]);

  useEffect(() => {
    setPage(1);
  }, [filters.category, filters.brand, filters.size, filters.condition, filters.color, filters.priceMin, filters.priceMax]);

  const filteredListings = useMemo(() => {
    let result = listings.filter((l) => l.status === "active");

    if (categoryIds) {
      result = result.filter((l) => categoryIds.has(l.categoryId));
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
  }, [listings, categoryIds, filters]);

  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);
  const paginatedListings = filteredListings.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const ALL_CATEGORIES_NODE: Category = { id: "__all__", name: "All Categories", slug: "__all__", icon: undefined, subcategories: [] };

  const activeCategoryPath = useMemo((): Category[] => {
    const catId = filters.category[0];
    if (catId === "__all__") {
      return [ALL_CATEGORIES_NODE];
    }
    if (catId) {
      const path = getCategoryPathToRoot(catId, catTree);
      if (path) return path;
    }
    if (matchedCategory) {
      const path = getCategoryPathToRoot(matchedCategory.id, catTree);
      if (path) return path;
    }
    return [];
  }, [filters.category, catTree, matchedCategory]);

  const activeCategoryName = useMemo(() => {
    const catId = filters.category[0];
    if (catId === "__all__") return "All Categories";
    if (catId) {
      const cat = findCategoryInTree(catId, catTree);
      if (cat) return cat.name;
    }
    return matchedCategory?.name ?? "Browse";
  }, [filters.category, catTree, matchedCategory]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          {activeCategoryPath.length === 0 ? (
            <BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbPage>{activeCategoryName}</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            activeCategoryPath.map((cat, i) => (
              <BreadcrumbItem key={cat.id}>
                <BreadcrumbSeparator />
                {i === activeCategoryPath.length - 1 ? (
                  <BreadcrumbPage>{cat.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setFilter("category", [cat.id]);
                    }}
                  >
                    {cat.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            ))
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex gap-8">
        <FilterSidebar />

        <div className="flex-1 min-w-0">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-baseline gap-3">
              <h1 className="truncate text-2xl font-bold text-foreground sm:text-3xl">
                {activeCategoryName}
              </h1>
              <span className="shrink-0 text-sm text-muted-foreground">
                {filteredListings.length}+ results
              </span>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
              <FilterSidebarMobile />
              <SortDropdown className="flex-1 sm:flex-none" />
            </div>
          </div>

          {paginatedListings.length === 0 ? (
            <EmptyState
              title="No listings found"
              description="Try adjusting your filters or search criteria."
              actionLabel="Clear filters"
              actionHref={`/c/${categoryPath.join("/")}`}
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

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-6" />}>
      <CategoryContent />
    </Suspense>
  );
}
