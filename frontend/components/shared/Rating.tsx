import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  rating: number;
  maxRating?: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}

export function Rating({
  rating,
  maxRating = 5,
  count,
  size = "sm",
  className,
}: RatingProps) {
  const iconSize = size === "sm" ? "size-3" : "size-4";

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxRating }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            iconSize,
            i < Math.floor(rating)
              ? "fill-rating text-rating"
              : i < rating
                ? "fill-rating/50 text-rating"
                : "text-foreground-faint"
          )}
        />
      ))}
      {count !== undefined && (
        <span className="text-xs text-foreground-muted ml-1">({count})</span>
      )}
    </div>
  );
}
