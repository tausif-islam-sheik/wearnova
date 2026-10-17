"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useListingFilterStore } from "@/stores/useListingFilterStore";

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const conditionOptions = [
  { value: "new_with_tags", label: "New with tags" },
  { value: "new_without_tags", label: "New without tags" },
  { value: "very_good", label: "Very good" },
  { value: "good", label: "Good" },
  { value: "satisfactory", label: "Satisfactory" },
];
const colorOptions = [
  "Black", "White", "Blue", "Red", "Green", "Grey",
  "Brown", "Beige", "Navy", "Pink", "Gold", "Silver", "Tan", "Ivory",
];
const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most popular" },
  { value: "oldest", label: "Oldest first" },
];

interface FilterChipProps {
  label: string;
  active?: boolean;
  onRemove?: () => void;
}

function FilterChip({ label, active, onRemove }: FilterChipProps) {
  if (!active) return null;
  return (
    <Badge
      variant="secondary"
      className="gap-1 bg-brand-primary/10 text-brand-primary"
    >
      {label}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:text-brand-primary-dark">
          <X className="size-3" />
        </button>
      )}
    </Badge>
  );
}

function FilterPopover({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          />
        }
      >
          {label}
          <ChevronDown className="size-3" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        {children}
      </PopoverContent>
    </Popover>
  );
}

function CheckboxGroup({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  return (
    <div className="space-y-2 max-h-48 overflow-auto">
      {options.map((opt) => (
        <label
          key={opt}
          className="flex items-center gap-2 text-sm cursor-pointer"
        >
          <Checkbox
            checked={selected.includes(opt)}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange([...selected, opt]);
              } else {
                onChange(selected.filter((s) => s !== opt));
              }
            }}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

export function FilterBar() {
  const {
    size,
    condition,
    color,
    priceMin,
    priceMax,
    sort,
    setFilter,
    resetFilters,
  } = useListingFilterStore();

  const [priceRange, setPriceRange] = useState<[number, number]>([
    priceMin ?? 0,
    priceMax ?? 500,
  ]);

  const hasActiveFilters =
    size.length > 0 ||
    condition.length > 0 ||
    color.length > 0 ||
    priceMin !== null ||
    priceMax !== null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Size */}
        <FilterPopover label="Size">
          <CheckboxGroup
            options={sizeOptions}
            selected={size}
            onChange={(val) => setFilter("size", val)}
          />
        </FilterPopover>

        {/* Condition */}
        <FilterPopover label="Condition">
          <div className="space-y-2 max-h-48 overflow-auto">
            {conditionOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={condition.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilter("condition", [...condition, opt.value]);
                    } else {
                      setFilter(
                        "condition",
                        condition.filter((c) => c !== opt.value)
                      );
                    }
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </FilterPopover>

        {/* Color */}
        <FilterPopover label="Color">
          <CheckboxGroup
            options={colorOptions}
            selected={color}
            onChange={(val) => setFilter("color", val)}
          />
        </FilterPopover>

        {/* Price */}
        <FilterPopover label="Price">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-foreground-muted">
                ${priceRange[0]} — ${priceRange[1]}
              </span>
            </div>
            <Slider
              value={priceRange}
              onValueChange={(val) => setPriceRange(val as [number, number])}
              max={500}
              step={5}
            />
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                setFilter("priceMin", priceRange[0] || null);
                setFilter("priceMax", priceRange[1] || null);
              }}
            >
              Apply
            </Button>
          </div>
        </FilterPopover>

        {/* Sort */}
        <FilterPopover label="Sort by">
          <div className="space-y-1">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter("sort", opt.value)}
                className={`block w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                  sort === opt.value
                    ? "bg-surface-muted font-medium text-foreground"
                    : "text-foreground-muted hover:bg-surface-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FilterPopover>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-brand-primary hover:underline ml-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {size.map((s) => (
            <FilterChip
              key={`size-${s}`}
              label={`Size: ${s}`}
              active
              onRemove={() =>
                setFilter(
                  "size",
                  size.filter((x) => x !== s)
                )
              }
            />
          ))}
          {condition.map((c) => (
            <FilterChip
              key={`cond-${c}`}
              label={conditionOptions.find((o) => o.value === c)?.label ?? c}
              active
              onRemove={() =>
                setFilter(
                  "condition",
                  condition.filter((x) => x !== c)
                )
              }
            />
          ))}
          {color.map((c) => (
            <FilterChip
              key={`color-${c}`}
              label={`Color: ${c}`}
              active
              onRemove={() =>
                setFilter(
                  "color",
                  color.filter((x) => x !== c)
                )
              }
            />
          ))}
          {(priceMin !== null || priceMax !== null) && (
            <FilterChip
              label={`$${priceMin ?? 0} — $${priceMax ?? "∞"}`}
              active
              onRemove={() => {
                setFilter("priceMin", null);
                setFilter("priceMax", null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
