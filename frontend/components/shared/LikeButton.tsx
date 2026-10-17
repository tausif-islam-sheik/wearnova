"use client";

import { Toggle } from "@/components/ui/toggle";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/stores/useFavoritesStore";

interface LikeButtonProps {
  listingId: string;
  initialCount?: number;
  size?: "sm" | "default";
  className?: string;
}

export function LikeButton({
  listingId,
  initialCount = 0,
  size = "sm",
  className,
}: LikeButtonProps) {
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const liked = isFavorite(listingId);

  return (
    <Toggle
      size={size === "sm" ? "sm" : "default"}
      pressed={liked}
      onPressedChange={() => toggleFavorite(listingId)}
      className={cn(
        "gap-1 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background data-[state=on]:bg-muted",
        className
      )}
      aria-label={liked ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          liked
            ? "fill-destructive text-destructive"
            : "text-foreground-muted"
        )}
      />
      <span className="text-xs font-medium">
        {initialCount + (liked ? 1 : 0)}
      </span>
    </Toggle>
  );
}
