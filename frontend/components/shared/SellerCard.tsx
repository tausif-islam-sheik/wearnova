import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Rating } from "@/components/shared/Rating";
import { FollowButton } from "@/components/shared/FollowButton";
import type { User } from "@/types";

interface SellerCardProps {
  seller: User;
  showFollow?: boolean;
}

/** Compact seller row: avatar, name, rating and (optionally) a Follow button. */
export function SellerCard({ seller, showFollow = false }: SellerCardProps) {
  const profileHref = `/seller/${seller.name.toLowerCase().replace(/ /g, "-")}`;

  return (
    <Card className="flex-row items-center justify-between gap-3 rounded p-4 transition-shadow hover:shadow-sm">
      <Link href={profileHref} className="group flex min-w-0 items-center gap-3">
        <Avatar className="size-12 shrink-0">
          <AvatarImage src={seller.avatarUrl} alt={seller.name} />
          <AvatarFallback className="bg-brand-primary/10 text-sm font-medium text-brand-primary">
            {seller.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-brand-primary">
            {seller.name}
          </p>
          <div className="flex items-center gap-1.5">
            <Rating rating={seller.avgRating} size="sm" />
            <span className="text-sm text-muted-foreground">({seller.ratingsCount})</span>
          </div>
        </div>
      </Link>
      {showFollow && <FollowButton userId={seller.id} className="shrink-0" />}
    </Card>
  );
}
