"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ProductReview } from "@/hooks/use-product-page";

const PAGE = 3;

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-4",
            n <= Math.round(value) ? "fill-rating text-rating" : "text-border"
          )}
        />
      ))}
    </span>
  );
}

function maskName(name: string) {
  const first = name.trim().charAt(0).toLowerCase() || "u";
  const last = name.trim().slice(-1).toLowerCase();
  return `${first}***${last}`;
}

export function ProductReviews({
  reviews,
  loading,
  sellerName,
}: {
  reviews: ProductReview[];
  loading: boolean;
  sellerName?: string;
}) {
  const [shown, setShown] = useState(PAGE);
  const total = reviews.length;
  const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  return (
    <section id="reviews" className="scroll-mt-24">
      <h2 className="text-xl font-bold text-foreground">
        Customer Reviews{total > 0 ? ` (${total})` : ""}
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Reviews from buyers who purchased from {sellerName ?? "this seller"}.
      </p>

      {loading ? (
        <Skeleton className="mt-4 h-40 w-full" />
      ) : total === 0 ? (
        <p className="mt-4 bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
          No reviews yet.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-6 bg-muted/40 p-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-extrabold leading-none">{avg.toFixed(2)}</span>
                <Stars value={avg} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Based on {total} verified orders</p>
            </div>
            <ul className="flex-1 space-y-1.5" aria-label="Rating breakdown">
              {dist.map(({ n, count }) => (
                <li key={n} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-12 shrink-0 whitespace-nowrap">{n} star</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <span
                      className="block h-full rounded-full bg-foreground"
                      style={{ width: `${(count / total) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right">
                    {Math.round((count / total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <ul className="mt-2 divide-y divide-dashed divide-border">
            {reviews.slice(0, shown).map((r) => (
              <li key={r.id} className="py-5">
                <p className="text-sm">
                  <span className="font-bold text-foreground">{maskName(r.reviewer.name)}</span>
                  <span className="ml-2 text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </p>
                <Stars value={r.rating} className="mt-1.5" />
                {r.comment && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {r.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>

          {shown < total && (
            <div className="flex justify-center pt-2">
              <Button variant="ghost" className="font-semibold" onClick={() => setShown((n) => n + PAGE)}>
                View More Reviews
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
