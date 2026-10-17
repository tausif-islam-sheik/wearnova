"use client";

import { PageNav } from "@/components/shared/PageNav";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Storefront pagination (search, brand and category pages): centred shadcn pagination. */
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex justify-center">
      <PageNav page={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
