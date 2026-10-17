"use client";

import Link from "next/link";
import { Flag } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ProductBreadcrumbProps {
  categoryPath: string[];
  onReport?: () => void;
  className?: string;
}

function slugify(segment: string) {
  return segment.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-");
}

export function ProductBreadcrumb({
  categoryPath,
  onReport,
  className,
}: ProductBreadcrumbProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3 pb-4", className)}>
      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          {categoryPath.map((segment, i) => {
            const isLast = i === categoryPath.length - 1;
            const href = `/c/${categoryPath.slice(0, i + 1).map(slugify).join("/")}`;
            return (
              <BreadcrumbItem key={segment + i}>
                <BreadcrumbSeparator />
                {isLast ? (
                  <BreadcrumbPage>{segment}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>{segment}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <Tooltip>
        <TooltipTrigger
          aria-label="Report this item"
          onClick={onReport}
          className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Flag className="size-4 stroke-[1.5]" />
        </TooltipTrigger>
        <TooltipContent>Report this item</TooltipContent>
      </Tooltip>
    </div>
  );
}
