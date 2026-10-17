import { Badge } from "@/components/ui/badge";
import type { Condition } from "@/types";

export const conditionLabels: Record<Condition, string> = {
  new_with_tags: "New with tags",
  new_without_tags: "New without tags",
  very_good: "Very good",
  good: "Good",
  satisfactory: "Satisfactory",
};

const conditionColors: Record<Condition, string> = {
  new_with_tags: "bg-success/10 text-success border-success/20",
  new_without_tags: "bg-success/10 text-success border-success/20",
  very_good: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
  good: "bg-secondary text-secondary-foreground border-border",
  satisfactory: "bg-warning/10 text-warning border-warning/20",
};

interface ConditionBadgeProps {
  condition: Condition;
  variant?: "default" | "success";
  className?: string;
}

export function ConditionBadge({
  condition,
  className,
  variant = "default",
}: ConditionBadgeProps) {
  const colors =
    variant === "success"
      ? "bg-success/10 text-success border-success/20"
      : conditionColors[condition];

  return (
    <Badge
      variant="outline"
      className={`text-xs font-normal ${colors} ${className ?? ""}`}
    >
      {conditionLabels[condition]}
    </Badge>
  );
}
