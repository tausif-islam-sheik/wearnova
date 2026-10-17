import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShippingOptionRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
  disabled?: boolean;
}

export function ShippingOptionRow({
  icon: Icon,
  title,
  description,
  disabled = false,
}: ShippingOptionRowProps) {
  return (
    <div
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-lg border px-6 py-5 transition-colors hover:bg-muted/50",
        disabled ? "border-border" : "border-border"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={cn(
            "size-5 shrink-0",
            disabled ? "text-foreground-muted" : "text-foreground"
          )}
          strokeWidth={1.5}
        />
        <div>
          <p
            className={cn(
              "text-sm font-medium",
              disabled ? "text-foreground-muted" : "text-foreground"
            )}
          >
            {title}
          </p>
          <p className="text-sm text-foreground-muted">{description}</p>
        </div>
      </div>
      <ChevronDown
        className={cn(
          "size-4 shrink-0",
          disabled ? "text-foreground-muted" : "text-foreground-muted"
        )}
        strokeWidth={1.5}
      />
    </div>
  );
}
