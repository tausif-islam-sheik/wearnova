import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckoutStep } from "@/hooks/use-checkout";

const STEPS: { id: CheckoutStep; label: string }[] = [
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
];

export function CheckoutSteps({ current }: { current: CheckoutStep }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <ol aria-label="Checkout progress" className="flex items-center gap-3">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step.id} className="flex items-center gap-3" aria-current={active ? "step" : undefined}>
            {i > 0 && <span aria-hidden className={cn("h-px w-8 sm:w-12", done || active ? "bg-foreground" : "bg-border")} />}
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  done && "bg-foreground text-background",
                  active && "bg-foreground text-background ring-4 ring-foreground/10",
                  !done && !active && "border border-border text-muted-foreground"
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("text-sm font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
