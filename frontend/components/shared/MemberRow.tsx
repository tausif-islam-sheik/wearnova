"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/shared/Rating";
import { FollowButton } from "@/components/shared/FollowButton";
import { useAuthStore } from "@/stores/useAuthStore";
import type { User } from "@/types";

const badgeLabels: Record<string, string> = {
  frequent_uploads: "Frequent Uploads",
  speedy_shipping: "Speedy Shipping",
  top_seller: "Top Seller",
  trusted: "Trusted",
};

export function MemberRow({ member }: { member: User }) {
  const currentUser = useAuthStore((s) => s.user);
  const isSelf = currentUser?.id === member.id;

  const profileHref = `/seller/${member.name.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-surface-muted/50">
      <Link href={profileHref} className="shrink-0">
        <Avatar className="size-12">
          <AvatarImage src={member.avatarUrl} alt={member.name} />
          <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm font-medium">
            {member.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={profileHref}
            className="text-sm font-semibold text-foreground hover:text-brand-primary transition-colors truncate"
          >
            {member.name}
          </Link>
          {member.badges.slice(0, 2).map((b) => (
            <Badge key={b} variant="outline" className="hidden sm:inline-flex text-[10px] px-1.5 py-0 rounded-full">
              {badgeLabels[b] ?? b}
            </Badge>
          ))}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
          <span className="inline-flex items-center gap-1">
            <Rating rating={member.avgRating} size="sm" />
            <span>({member.ratingsCount})</span>
          </span>
          {member.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {member.location}
            </span>
          )}
        </div>
      </div>

      {!isSelf && <FollowButton userId={member.id} />}
    </div>
  );
}
