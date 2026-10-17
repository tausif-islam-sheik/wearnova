"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const WINDOW = 5;

/**
 * Up to WINDOW page numbers centred on the current page, followed by the last page number
 * (behind an ellipsis when pages are skipped). The double arrow covers jumping to the first page.
 */
function pageItems(page: number, totalPages: number): (number | "gap")[] {
  const size = Math.min(WINDOW, totalPages);
  const start = Math.min(Math.max(page - Math.floor(size / 2), 1), totalPages - size + 1);
  const end = start + size - 1;
  const items: (number | "gap")[] = Array.from({ length: size }, (_, i) => start + i);
  if (end < totalPages) {
    if (totalPages - end > 1) items.push("gap");
    items.push(totalPages);
  }
  return items;
}

interface PageNavProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Freeze the controls, e.g. while the next page is loading. */
  disabled?: boolean;
  className?: string;
}

/**
 * « ‹ 1 2 3 4 5 … 25 › » built on the shadcn Pagination parts. The controls are real anchors, so they
 * are keyboard focusable; clicks are intercepted so the page state (not the URL) changes.
 */
export function PageNav({ page, totalPages, onPageChange, disabled, className }: PageNavProps) {
  const total = Math.max(1, totalPages);
  const go = (target: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled && target >= 1 && target <= total && target !== page) onPageChange(target);
  };
  const atStart = page <= 1;
  const atEnd = page >= total;

  return (
    <Pagination className={cn("mx-0 w-auto", className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationFirst href="#" disabled={disabled || atStart} onClick={go(1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious href="#" text="" disabled={disabled || atStart} onClick={go(page - 1)} />
        </PaginationItem>
        {pageItems(page, total).map((n, i) =>
          n === "gap" ? (
            <PaginationItem key={`gap-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={n}>
              <PaginationLink
                href="#"
                isActive={n === page}
                disabled={disabled && n !== page}
                aria-label={n === total ? `Go to last page, page ${n}` : `Go to page ${n}`}
                onClick={go(n)}
              >
                {n}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext href="#" text="" disabled={disabled || atEnd} onClick={go(page + 1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationLast href="#" disabled={disabled || atEnd} onClick={go(total)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
