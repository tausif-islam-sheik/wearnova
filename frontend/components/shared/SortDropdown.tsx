"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ChevronsUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListingFilterStore } from "@/stores/useListingFilterStore";
import { cn } from "@/lib/utils";

const sortOptions = [
  { value: "newest", label: "Recently Listed" },
  { value: "popular", label: "Most Popular" },
  { value: "price_asc", label: "Lowest Price" },
  { value: "price_desc", label: "Highest Price" },
  { value: "oldest", label: "Oldest First" },
  // TODO: relevance ranking not implemented in backend yet — falls through to newest
  // { value: "relevance", label: "Relevance" },
] as const;

const sortLabelMap = Object.fromEntries(
  sortOptions.map((o) => [o.value, o.label])
);

function pushSortToUrl(
  router: ReturnType<typeof useRouter>,
  searchParams: URLSearchParams,
  sort: string
) {
  const params = new URLSearchParams(searchParams.toString());
  if (sort === "newest") {
    params.delete("sort");
  } else {
    params.set("sort", sort);
  }
  const qs = params.toString();
  router.push(qs ? `?${qs}` : window.location.pathname, { scroll: false });
}

export function SortDropdown({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = useListingFilterStore((s) => s.sort);
  const setFilter = useListingFilterStore((s) => s.setFilter);

  const displayLabel = useMemo(
    () => sortLabelMap[sort] ?? "Recently Listed",
    [sort]
  );

  const handleChange = useCallback(
    (val: string | null) => {
      if (!val) return;
      setFilter("sort", val);
      pushSortToUrl(router, searchParams, val);
    },
    [setFilter, router, searchParams]
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="hidden text-sm font-medium text-muted-foreground whitespace-nowrap sm:inline">
        Sort By:
      </span>
      <Select value={sort} onValueChange={handleChange}>
        <SelectTrigger className="h-10 w-full min-w-0 rounded border-border focus-visible:border-primary focus-visible:ring-primary/50 sm:min-w-[190px] [&>svg:last-child]:hidden">
          <SelectValue>{displayLabel}</SelectValue>
          <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
        </SelectTrigger>
        <SelectContent align="end">
          {sortOptions.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="[&_svg]:!text-primary"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
