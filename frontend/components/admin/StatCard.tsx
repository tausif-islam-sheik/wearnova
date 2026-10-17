import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Stat card row: columns follow the available width (the sidebar shrinks it), not the viewport. */
export const STAT_GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]";

interface StatCardProps {
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value: string | number;
  trend?: React.ReactNode;
  trendColor?: string;
}

export function StatCard({
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  label,
  value,
  trend,
  trendColor = "text-emerald-600 dark:text-emerald-400",
}: StatCardProps) {
  return (
    <Card className="border border-border/50 rounded">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              iconBg
            )}
          >
            <Icon className={cn("size-5", iconColor)} />
          </div>
          <div className="min-w-0 w-full flex-1">
            <p className="text-[11px] font-medium text-muted-foreground truncate uppercase tracking-wider sm:text-xs">
              {label}
            </p>
            <p className="text-xl font-bold text-foreground tracking-tight mt-0.5 truncate sm:text-2xl" title={String(value)}>
              {value}
            </p>
          </div>
        </div>
        {trend && (
          <p className={cn("text-xs mt-2.5 font-medium", trendColor)}>{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}
