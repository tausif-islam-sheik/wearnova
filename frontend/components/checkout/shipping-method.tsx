"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { money } from "@/lib/checkout";
import { cn } from "@/lib/utils";
import type { Quote, ShippingMethodId, ShippingMethodInfo } from "@/types";

interface ShippingMethodProps {
  methods: ShippingMethodInfo[];
  value: ShippingMethodId;
  onChange: (id: ShippingMethodId) => void;
  quotes: Partial<Record<ShippingMethodId, Quote>>;
  loading: boolean;
}

export function ShippingMethodPicker({ methods, value, onChange, quotes, loading }: ShippingMethodProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as ShippingMethodId)}
      aria-label="Shipping method"
    >
      {methods.map((info) => {
        const id = info.id;
        const quote = quotes[id];
        const selected = value === id;
        return (
          <label
            key={id}
            htmlFor={`ship-${id}`}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded border p-4 transition-colors",
              selected ? "border-foreground bg-muted/40" : "border-border hover:border-foreground/40"
            )}
          >
            <RadioGroupItem id={`ship-${id}`} value={id} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">{info.label}</span>
              <span className="block text-xs text-muted-foreground">{info.eta}</span>
            </span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {loading || !quote ? (
                <span className="inline-block h-4 w-12 animate-pulse rounded bg-muted" />
              ) : quote.shipping === 0 ? (
                <span className="text-success">Free</span>
              ) : (
                money(quote.shipping)
              )}
            </span>
          </label>
        );
      })}
    </RadioGroup>
  );
}
