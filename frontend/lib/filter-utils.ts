import type { Listing, Category } from "@/types";
import { findCategoryInTree, collectDescendantIds } from "@/lib/category-utils";

export interface FilterParams {
  categoryIds: Set<string> | null;
  brand: string[];
  size: string[];
  condition: string[];
  color: string[];
  priceMin: number | null;
  priceMax: number | null;
}

export function computeCategoryIds(
  selectedCats: string[],
  tree: Category[]
): Set<string> | null {
  if (selectedCats.length === 0 || selectedCats[0] === "__all__") return null;
  const ids = new Set<string>();
  for (const catId of selectedCats) {
    const cat = findCategoryInTree(catId, tree);
    if (cat) {
      collectDescendantIds(cat).forEach((id) => ids.add(id));
    }
  }
  return ids.size > 0 ? ids : null;
}

export function filterListings(
  listings: Listing[],
  filters: FilterParams
): Listing[] {
  let result = listings.filter((l) => l.status === "active");

  if (filters.categoryIds) {
    result = result.filter((l) => filters.categoryIds!.has(l.categoryId));
  }
  if (filters.brand.length > 0) {
    result = result.filter((l) =>
      filters.brand.some((b) => l.brand?.toLowerCase() === b.toLowerCase())
    );
  }
  if (filters.size.length > 0) {
    result = result.filter((l) =>
      filters.size.some((s) => l.size.toUpperCase().includes(s.toUpperCase()))
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

  return result;
}
