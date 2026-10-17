"use client";

/**
 * AUDIT — Filter sections supported by the product schema:
 * ✅ Category  — Listing.categoryId / categoryPath
 * ✅ Brand     — Listing.brand (string)
 * ✅ Size      — Listing.size (string)
 * ✅ Colour    — Listing.color (optional string)
 * ✅ Condition — Listing.condition (Condition union type)
 * ✅ Price     — Listing.price (number)
 * ✅ Material  — Listing.material (optional string) — included in store but omitted from UI for now (no material taxonomy defined)
 *
 * NOT in schema (do not build):
 * ❌ Discount / Sale  — no field
 * ❌ Item location    — no geo field on Listing
 * ❌ Vintage / Era    — no field
 * ❌ Gender target    — implicit via category, not a Listing field
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  ChevronDown,
  SlidersHorizontal,
  X,
  Search,
  HelpCircle,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetTitle,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useListingFilterStore } from "@/stores/useListingFilterStore";
import { useListingStore } from "@/stores/useListingStore";
import { mockBrands } from "@/mocks/admin-data-extra";
import { cn } from "@/lib/utils";
import { getCategories, getCategoriesSync, findCategoryInTree, collectDescendantIds, getCategoryPathToRoot } from "@/lib/category-utils";
import { filterListings, computeCategoryIds } from "@/lib/filter-utils";
import type { Category, Condition, Listing } from "@/types";

/* ── Data ──────────────────────────────────────────────────────────── */

const sizeGroups = [
  {
    label: "Clothing",
    sizes: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"],
  },
  {
    label: "Shoes",
    sizes: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "13"],
  },
  {
    label: "Kids",
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y", "14-15Y"],
  },
  {
    label: "Accessories",
    sizes: ["One Size", "XS/S", "M/L", "L/XL"],
  },
];

const conditionOptions: { value: Condition; label: string; tip: string; icon: string }[] = [
  { value: "new_with_tags", label: "New with tags", tip: "Unworn, all original tags attached. Includes hygienic stickers if applicable.", icon: "✦" },
  { value: "new_without_tags", label: "New without tags", tip: "Unworn, no defects, but no longer has original tags.", icon: "●" },
  { value: "very_good", label: "Very good", tip: "Minor signs of wear (1-2 uses), excellent overall condition. No defects.", icon: "◐" },
  { value: "good", label: "Good", tip: "Some signs of gentle wear. No major defects, may have minor pilling or fading.", icon: "◑" },
  { value: "satisfactory", label: "Satisfactory", tip: "Visible signs of wear. Fully functional, may have stains, holes, or repairs.", icon: "◒" },
];

const colorSwatches: Record<string, string> = {
  Black: "#1a1a1a",
  White: "#f5f5f5",
  Red: "#dc2626",
  Blue: "#2563eb",
  Green: "#16a34a",
  Grey: "#9ca3af",
  Brown: "#92400e",
  Beige: "#d4c5a9",
  Navy: "#1e3a5f",
  Pink: "#ec4899",
  Gold: "#ca8a04",
  Silver: "#a3a3a3",
  Tan: "#c2a66b",
  Ivory: "#fffff0",
  Purple: "#7c3aed",
  Burgundy: "#801a1a",
  Olive: "#6b8e23",
  Coral: "#f87171",
  Teal: "#0d9488",
  Lavender: "#c4b5fd",
  Mint: "#6ee7b7",
  Peach: "#fdba74",
  Maroon: "#7f1d1d",
  Charcoal: "#374151",
};

const colorOptions = Object.keys(colorSwatches);

const pricePresets = [
  { label: "Under $25", min: null, max: 25 },
  { label: "$25 – $50", min: 25, max: 50 },
  { label: "$50 – $100", min: 50, max: 100 },
  { label: "$100 – $250", min: 100, max: 250 },
  { label: "$250+", min: 250, max: null },
];

/* ── Collapsible Section Wrapper ───────────────────────────────────── */

function FilterSection({
  title,
  defaultOpen = true,
  count,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger
        render={
          <button className="flex w-full items-center justify-between py-3.5 text-left group/section"
          />
        }
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {title}
          </span>
          {count !== undefined && count > 0 && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary"
            >
              {count}
            </Badge>
          )}
        </div>
        <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[open]/section:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4 overflow-hidden data-open:animate-collapse-down data-closed:animate-collapse-up">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Category Section (hierarchical tree) ──────────────────────────── */

function isCategorySelected(catId: string, selected: string[]): boolean {
  return selected.includes(catId);
}

function getSiblingIds(id: string, tree: Category[]): string[] {
  if (tree.some((c) => c.id === id)) {
    return tree.filter((c) => c.id !== id).map((c) => c.id);
  }
  for (const cat of tree) {
    if (cat.subcategories?.some((s) => s.id === id)) {
      return cat.subcategories.filter((s) => s.id !== id).map((s) => s.id);
    }
    const found = getSiblingIds(id, cat.subcategories ?? []);
    if (found.length > 0) return found;
  }
  return [];
}

function CategoryNode({
  cat,
  depth = 0,
  selected,
  expandedIds,
  countMap,
  onSelect,
  onToggle,
}: {
  cat: Category;
  depth?: number;
  selected: string[];
  expandedIds: string[];
  countMap: Record<string, number>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const hasChildren = (cat.subcategories?.length ?? 0) > 0;
  const active = isCategorySelected(cat.id, selected);
  const open = expandedIds.includes(cat.id);

  return (
    <div>
      <div className={cn("flex items-center gap-2.5 py-1 text-sm group", depth > 0 && "ml-4")}>
        <span
          className="size-4 shrink-0 flex items-center justify-center cursor-pointer"
          onClick={() => {
            onSelect(cat.id);
            onToggle(cat.id);
          }}
        >
          <div
            className={cn(
              "size-3.5 rounded-full border-2 flex items-center justify-center",
              active ? "border-primary" : "border-muted-foreground/40"
            )}
          >
            {active && <div className="size-2 rounded-full bg-primary" />}
          </div>
        </span>
        <div
          className={cn(
            "flex items-center flex-1 cursor-pointer rounded-md transition-colors",
            active
              ? "font-medium text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => {
            onSelect(cat.id);
            onToggle(cat.id);
          }}
        >
          <span>{cat.name}</span>
          {(countMap[cat.id] ?? 0) > 0 && (
            <span className="ml-auto text-[11px] text-muted-foreground/60">{countMap[cat.id]}</span>
          )}
        </div>
      </div>
      {hasChildren && open && (
        <div className="ml-1">
          {(cat.subcategories ?? []).map((sub) => (
            <CategoryNode
              key={sub.id}
              cat={sub}
              depth={depth + 1}
              selected={selected}
              expandedIds={expandedIds}
              countMap={countMap}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const ALL_CATEGORIES = "__all__";

function CategorySection() {
  const { category, setFilter, brand, size, condition, color, priceMin, priceMax } = useListingFilterStore();
  const listings = useListingStore((s) => s.listings);
  const [catTree, setCatTree] = useState<Category[]>(() => getCategoriesSync());
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const base = filterListings(listings, {
      categoryIds: null,
      brand,
      size,
      condition,
      color,
      priceMin,
      priceMax,
    });
    const walk = (cat: Category) => {
      const ids = collectDescendantIds(cat);
      counts[cat.id] = base.filter((l) => ids.has(l.categoryId)).length;
      cat.subcategories?.forEach(walk);
    };
    catTree.forEach(walk);
    return counts;
  }, [listings, brand, size, condition, color, priceMin, priceMax, catTree]);

  const totalFiltered = useMemo(
    () =>
      filterListings(listings, {
        categoryIds: computeCategoryIds(category, catTree),
        brand,
        size,
        condition,
        color,
        priceMin,
        priceMax,
      }).length,
    [listings, category, catTree, brand, size, condition, color, priceMin, priceMax]
  );

  useEffect(() => {
    getCategories()
      .then(setCatTree)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isAllSelected = category[0] === ALL_CATEGORIES;

  useEffect(() => {
    const catId = category[0];
    if (!catId || catId === ALL_CATEGORIES) {
      setExpandedIds([]);
      return;
    }
    const path = getCategoryPathToRoot(catId, catTree);
    if (!path) return;
    const ancestorIds = path.slice(0, -1).map((c) => c.id);
    setExpandedIds((prev) => {
      const toRemove = new Set<string>();
      for (const ancestorId of ancestorIds) {
        const siblings = getSiblingIds(ancestorId, catTree);
        for (const sid of siblings) {
          toRemove.add(sid);
          const sib = findCategoryInTree(sid, catTree);
          if (sib) {
            collectDescendantIds(sib).forEach((d) => toRemove.add(d));
          }
        }
      }
      return [...new Set([...prev.filter((id) => !toRemove.has(id)), ...ancestorIds])];
    });
  }, [category, catTree]);

  const lastClickRef = useRef<{ id: string; time: number } | null>(null);

  const handleSelect = useCallback(
    (id: string) => {
      const now = Date.now();
      if (lastClickRef.current?.id === id && now - lastClickRef.current.time < 400) {
        lastClickRef.current = { id, time: now };
        return;
      }
      lastClickRef.current = { id, time: now };
      if (category[0] === id) {
        setFilter("category", [ALL_CATEGORIES]);
        setExpandedIds([]);
      } else {
        setFilter("category", [id]);
      }
    },
    [category, setFilter]
  );

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      if (prev.includes(id)) {
        const cat = findCategoryInTree(id, catTree);
        if (!cat) return prev.filter((x) => x !== id);
        const desc = collectDescendantIds(cat);
        return prev.filter((x) => x !== id && !desc.has(x));
      }
      const siblings = getSiblingIds(id, catTree);
      const toRemove = new Set<string>();
      for (const sid of siblings) {
        const sib = findCategoryInTree(sid, catTree);
        if (sib) {
          toRemove.add(sid);
          collectDescendantIds(sib).forEach((d) => toRemove.add(d));
        }
      }
      return [...prev.filter((x) => !toRemove.has(x)), id];
    });
  }, [catTree]);

  return (
    <FilterSection title="Category" count={isAllSelected ? 0 : category.length}>
      <div className="space-y-0.5">
        <div
          className={cn(
            "flex items-center gap-2.5 py-1 text-sm cursor-pointer rounded-md transition-colors",
            isAllSelected
              ? "font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => { setFilter("category", [ALL_CATEGORIES]); setExpandedIds([]); }}
        >
          <span className="size-4 shrink-0 flex items-center justify-center">
            <div
              className={cn(
                "size-3.5 rounded-full border-2 flex items-center justify-center",
                isAllSelected
                  ? "border-primary"
                  : "border-muted-foreground/40"
              )}
            >
              {isAllSelected && (
                <div className="size-2 rounded-full bg-primary" />
              )}
            </div>
          </span>
          <span>All categories</span>
          <span className="ml-auto text-[11px] text-muted-foreground/60">
            {totalFiltered}
          </span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          catTree.map((cat) => (
            <CategoryNode
              key={cat.id}
              cat={cat}
              selected={category}
              expandedIds={expandedIds}
              countMap={categoryCounts}
              onSelect={handleSelect}
              onToggle={handleToggle}
            />
          ))
        )}
      </div>
    </FilterSection>
  );
}

/* ── Brand Section (search + scrollable checklist) ──────────────────── */

function BrandSection({ lockedBrand }: { lockedBrand?: string }) {
  const { brand, setFilter, category, size, condition, color, priceMin, priceMax } = useListingFilterStore();
  const listings = useListingStore((s) => s.listings);
  const [catTree] = useState<Category[]>(() => getCategoriesSync());
  const [search, setSearch] = useState("");

  const brandCounts = useMemo(() => {
    const base = filterListings(listings, {
      categoryIds: computeCategoryIds(category, catTree),
      brand: [],
      size,
      condition,
      color,
      priceMin,
      priceMax,
    });
    const counts: Record<string, number> = {};
    for (const l of base) {
      if (l.brand) {
        counts[l.brand] = (counts[l.brand] ?? 0) + 1;
      }
    }
    return counts;
  }, [listings, category, catTree, size, condition, color, priceMin, priceMax]);

  const allBrands = useMemo(
    () => [...new Set([...mockBrands.map((b) => b.name), "Zara", "H&M", "Prada", "Free People", "Mango", "Rains", "Dr. Martens", "Ray-Ban", "New Balance", "Bang & Olufsen", "Lululemon"])].sort(),
    []
  );

  const filteredBrands = useMemo(() => {
    const q = search.toLowerCase();
    const matches = allBrands.filter((b) => b.toLowerCase().includes(q));
    const selected = matches.filter((b) => brand.includes(b));
    const unselected = matches.filter((b) => !brand.includes(b));
    return { selected, unselected };
  }, [allBrands, search, brand]);

  const isLocked = lockedBrand
    ? (b: string) => b.toLowerCase() === lockedBrand.toLowerCase()
    : () => false;

  const toggleBrand = useCallback(
    (b: string) => {
      if (isLocked(b)) return;
      if (brand.includes(b)) {
        setFilter("brand", brand.filter((x) => x !== b));
      } else {
        setFilter("brand", [...brand, b]);
      }
    },
    [brand, setFilter, isLocked]
  );

  const lockedInList = lockedBrand && !brand.includes(lockedBrand)
    ? [lockedBrand]
    : [];
  const displaySelected = [...lockedInList, ...filteredBrands.selected.filter((b) => !lockedInList.includes(b))];
  const displayUnselected = filteredBrands.unselected.filter(
    (b) => !lockedInList.includes(b)
  );

  return (
    <FilterSection title="Brand" count={brand.length}>
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Search brands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-8 pr-7 text-xs bg-muted/50"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      <ScrollArea className="max-h-[220px]">
        <div className="space-y-0.5 pr-2">
          {displaySelected.length > 0 && (
            <>
              {displaySelected.map((b) => {
                const locked = isLocked(b);
                return (
                  <label
                    key={b}
                    className={cn(
                      "flex items-center gap-2 py-1 text-sm transition-colors",
                      locked ? "cursor-default" : "cursor-pointer hover:text-primary"
                    )}
                  >
                    <Checkbox
                      checked
                      onCheckedChange={() => toggleBrand(b)}
                      disabled={locked}
                      className="data-[checked]:bg-primary data-[checked]:border-primary"
                    />
                    <span className="font-medium text-primary">{b}</span>
                    <span className="ml-auto flex items-center gap-1.5">
                      {brandCounts[b] > 0 && (
                        <span className="text-[11px] text-muted-foreground/60">{brandCounts[b]}</span>
                      )}
                      {locked && (
                        <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                          Current
                        </Badge>
                      )}
                    </span>
                  </label>
                );
              })}
              {displayUnselected.length > 0 && (
                <Separator className="my-1.5" />
              )}
            </>
          )}
          {displayUnselected.map((b) => (
            <label
              key={b}
              className="flex items-center gap-2 py-1 text-sm cursor-pointer hover:text-primary transition-colors"
            >
              <Checkbox
                checked={false}
                onCheckedChange={() => toggleBrand(b)}
                className="data-[checked]:bg-primary data-[checked]:border-primary"
              />
              <span className="text-muted-foreground">{b}</span>
              {brandCounts[b] > 0 && (
                <span className="ml-auto text-[11px] text-muted-foreground/60">{brandCounts[b]}</span>
              )}
            </label>
          ))}
          {displaySelected.length === 0 &&
            displayUnselected.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">
                No brands match &ldquo;{search}&rdquo;
              </p>
            )}
        </div>
      </ScrollArea>
    </FilterSection>
  );
}

/* ── Size Section (grouped pill-button grid) ──────────────────────── */

function SizeSection() {
  const { size, setFilter } = useListingFilterStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["Clothing"])
  );

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const toggleSize = (s: string) => {
    if (size.includes(s)) {
      setFilter("size", size.filter((x) => x !== s));
    } else {
      setFilter("size", [...size, s]);
    }
  };

  return (
    <FilterSection title="Size" count={size.length}>
      <div className="space-y-3">
        {sizeGroups.map((group) => {
          const expanded = expandedGroups.has(group.label);
          const groupActiveCount = group.sizes.filter((s) =>
            size.includes(s)
          ).length;

          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <span>{group.label}</span>
                  {groupActiveCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1 text-[9px] bg-primary/10 text-primary"
                    >
                      {groupActiveCount}
                    </Badge>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    "size-3 transition-transform duration-150",
                    expanded && "rotate-180"
                  )}
                />
              </button>
              {expanded && (
                <div className="grid grid-cols-4 gap-1.5">
                  {group.sizes.map((s) => {
                    const active = size.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSize(s)}
                        className={cn(
                          "flex items-center justify-center h-8 rounded-md border text-[11px] font-medium transition-all",
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </FilterSection>
  );
}

/* ── Colour Section (circular swatch grid) ───────────────────────── */

function ColourSection() {
  const { color, setFilter } = useListingFilterStore();
  const [showAll, setShowAll] = useState(false);

  const visibleColors = showAll ? colorOptions : colorOptions.slice(0, 12);
  const hasMore = colorOptions.length > 12;

  const toggleColor = (c: string) => {
    if (color.includes(c)) {
      setFilter("color", color.filter((x) => x !== c));
    } else {
      setFilter("color", [...color, c]);
    }
  };

  const lightColors = ["White", "Ivory", "Gold", "Silver", "Tan", "Beige", "Lavender", "Mint", "Peach"];

  return (
    <FilterSection title="Colour" count={color.length}>
      <div className="grid grid-cols-5 gap-2">
        {visibleColors.map((c) => {
          const active = color.includes(c);
          const isLight = lightColors.includes(c);
          return (
            <button
              key={c}
              onClick={() => toggleColor(c)}
              className="flex flex-col items-center gap-1 group/color"
              title={c}
            >
              <span
                className={cn(
                  "size-7 rounded-full border-2 transition-all duration-150 flex items-center justify-center",
                  active
                    ? "border-primary ring-2 ring-primary/20 scale-110"
                    : "border-transparent hover:scale-110",
                  isLight && !active && "border-border"
                )}
                style={{ backgroundColor: colorSwatches[c] }}
              >
                {active && (
                  <Check
                    className={cn(
                      "size-3.5",
                      isLight ? "text-foreground" : "text-white"
                    )}
                  />
                )}
              </span>
              <span
                className={cn(
                  "text-[10px] leading-none transition-colors",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground group-hover/color:text-foreground"
                )}
              >
                {c}
              </span>
            </button>
          );
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-xs text-primary font-medium hover:underline"
        >
          {showAll ? "Show less" : `Show all ${colorOptions.length} colours`}
        </button>
      )}
    </FilterSection>
  );
}

/* ── Condition Section (visual badges + tooltips) ──────────────────── */

const conditionBadgeStyles: Record<Condition, string> = {
  new_with_tags: "bg-emerald-50 text-emerald-700 border-emerald-200",
  new_without_tags: "bg-emerald-50/60 text-emerald-600 border-emerald-200/60",
  very_good: "bg-sky-50 text-sky-700 border-sky-200",
  good: "bg-amber-50 text-amber-700 border-amber-200",
  satisfactory: "bg-orange-50 text-orange-700 border-orange-200",
};

const conditionBarWidths: Record<Condition, string> = {
  new_with_tags: "w-full",
  new_without_tags: "w-[85%]",
  very_good: "w-[70%]",
  good: "w-[50%]",
  satisfactory: "w-[30%]",
};

const conditionBarColors: Record<Condition, string> = {
  new_with_tags: "bg-emerald-500",
  new_without_tags: "bg-emerald-400",
  very_good: "bg-sky-500",
  good: "bg-amber-500",
  satisfactory: "bg-orange-500",
};

function ConditionSection() {
  const { condition, setFilter } = useListingFilterStore();

  const toggleCondition = (c: Condition) => {
    if (condition.includes(c)) {
      setFilter("condition", condition.filter((x) => x !== c));
    } else {
      setFilter("condition", [...condition, c]);
    }
  };

  return (
    <FilterSection title="Condition" count={condition.length}>
      <div className="space-y-1">
        {conditionOptions.map((opt) => {
          const active = condition.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={cn(
                "flex items-center gap-2.5 w-full py-1.5 px-1 rounded-md text-left transition-colors cursor-pointer",
                active
                  ? "hover:bg-primary/5"
                  : "hover:bg-muted/50"
              )}
            >
              <Checkbox
                checked={active}
                onCheckedChange={() => toggleCondition(opt.value)}
                className="data-[checked]:bg-primary data-[checked]:border-primary"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm",
                      active
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {opt.label}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium",
                      conditionBadgeStyles[opt.value],
                      !active && "opacity-60"
                    )}
                  >
                    {opt.value.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        conditionBarWidths[opt.value],
                        conditionBarColors[opt.value],
                        !active && "opacity-40"
                      )}
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <HelpCircle className="size-3 text-muted-foreground/40 cursor-help shrink-0" />
                      }
                    />
                    <TooltipContent
                      side="top"
                      className="max-w-[220px] text-xs"
                    >
                      {opt.tip}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </FilterSection>
  );
}

/* ── Price Section (presets + custom range) ─────────────────────────── */

function PriceSection() {
  const { priceMin, priceMax, setFilter } = useListingFilterStore();
  const [customMin, setCustomMin] = useState(String(priceMin ?? ""));
  const [customMax, setCustomMax] = useState(String(priceMax ?? ""));

  const activePreset = useMemo(() => {
    return pricePresets.findIndex(
      (p) => p.min === priceMin && p.max === priceMax
    );
  }, [priceMin, priceMax]);

  const selectPreset = (idx: number) => {
    const p = pricePresets[idx];
    if (activePreset === idx) {
      setFilter("priceMin", null);
      setFilter("priceMax", null);
      setCustomMin("");
      setCustomMax("");
    } else {
      setFilter("priceMin", p.min);
      setFilter("priceMax", p.max);
      setCustomMin(String(p.min ?? ""));
      setCustomMax(String(p.max ?? ""));
    }
  };

  const applyCustom = () => {
    const min = customMin ? Number(customMin) : null;
    const max = customMax ? Number(customMax) : null;
    if (min !== null && max !== null && min > max) return;
    setFilter("priceMin", min);
    setFilter("priceMax", max);
  };

  const hasCustomRange =
    priceMin !== null || priceMax !== null;

  return (
    <FilterSection title="Price" count={hasCustomRange ? 1 : 0}>
      <div className="space-y-3">
        {/* Presets */}
        <div className="space-y-0.5">
          {pricePresets.map((p, i) => (
            <label
              key={p.label}
              className="flex items-center gap-2.5 py-1 text-sm cursor-pointer hover:text-primary transition-colors"
            >
              <Checkbox
                checked={activePreset === i}
                onCheckedChange={() => selectPreset(i)}
                className="data-[checked]:bg-primary data-[checked]:border-primary"
              />
              <span
                className={cn(
                  activePreset === i
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {p.label}
              </span>
            </label>
          ))}
        </div>

        <Separator />

        {/* Custom range */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Custom range
          </p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                placeholder="Min"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="h-8 pl-6 text-xs"
                min={0}
              />
            </div>
            <span className="text-muted-foreground text-xs">–</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                placeholder="Max"
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                className="h-8 pl-6 text-xs"
                min={0}
              />
            </div>
          </div>
          <button
            onClick={applyCustom}
            disabled={
              customMin !== "" &&
              customMax !== "" &&
              Number(customMin) > Number(customMax)
            }
            className="mt-2 text-xs text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply price
          </button>
        </div>
      </div>
    </FilterSection>
  );
}

/* ── Shared inner content ──────────────────────────────────────────── */

export function FilterSidebarContent({ lockedBrand }: { lockedBrand?: string }) {
  const {
    size,
    condition,
    color,
    brand,
    category,
    priceMin,
    priceMax,
    resetFilters,
  } = useListingFilterStore();

  const activeCount =
    size.length +
    condition.length +
    color.length +
    brand.length +
    category.length +
    (priceMin !== null || priceMax !== null ? 1 : 0);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filters</span>
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary"
            >
              {activeCount}
            </Badge>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-xs text-primary hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <Separator className="mb-4" />

      <div className="flex-1 space-y-4">
        <CategorySection />
        <Separator />
        <BrandSection lockedBrand={lockedBrand} />
        <Separator />
        <SizeSection />
        <Separator />
        <ColourSection />
        <Separator />
        <ConditionSection />
        <Separator />
        <PriceSection />
      </div>
    </div>
  );
}

/* ── Desktop sidebar (sticky) ──────────────────────────────────────── */

export function FilterSidebar({ lockedBrand }: { lockedBrand?: string }) {
  return (
    <aside className="hidden lg:block w-64 shrink-0 self-start py-4">
      <div className="sticky top-28">
        <FilterSidebarContent lockedBrand={lockedBrand} />
      </div>
    </aside>
  );
}

/* ── Mobile trigger button + Sheet wrapper ──────────────────────────── */

export function FilterSidebarMobile({ lockedBrand }: { lockedBrand?: string }) {
  const { size, condition, color, brand, category, priceMin, priceMax } =
    useListingFilterStore();

  const activeCount =
    size.length +
    condition.length +
    color.length +
    brand.length +
    category.length +
    (priceMin !== null || priceMax !== null ? 1 : 0);

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden gap-1.5"
          />
        }
      >
        <SlidersHorizontal className="size-3.5" />
        Filters
        {activeCount > 0 && (
          <Badge
            variant="secondary"
            className="ml-1 h-4 px-1 text-[10px] bg-primary/10 text-primary"
          >
            {activeCount}
          </Badge>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-4">
        <SheetTitle>Filters</SheetTitle>
        <FilterSidebarContent lockedBrand={lockedBrand} />
      </SheetContent>
    </Sheet>
  );
}
