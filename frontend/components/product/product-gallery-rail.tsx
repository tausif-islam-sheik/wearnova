"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryRailProps {
  images: string[];
  title: string;
  className?: string;
}

/** Vertical thumbnail rail beside one large image (rail drops below on mobile). */
export function ProductGalleryRail({ images, title, className }: ProductGalleryRailProps) {
  const [active, setActive] = useState(0);
  const count = images.length;

  if (count === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        No photos
      </div>
    );
  }

  const go = (i: number) => setActive((i + count) % count);

  return (
    <div className={cn("flex flex-col-reverse gap-3 md:flex-row", className)}>
      <div
        className="flex shrink-0 gap-2 overflow-x-auto md:max-h-[40rem] md:w-[68px] md:flex-col md:overflow-y-auto md:overflow-x-visible"
        role="tablist"
        aria-label="Product photos"
      >
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Photo ${i + 1} of ${count}`}
            onMouseEnter={() => setActive(i)}
            onClick={() => setActive(i)}
            className={cn(
              "relative aspect-[3/4] w-14 shrink-0 cursor-pointer overflow-hidden bg-muted outline-none md:w-[66px]",
              "border transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              i === active ? "border-foreground" : "border-transparent hover:border-border"
            )}
          >
            <Image src={src} alt="" fill unoptimized sizes="66px" className="object-cover" />
          </button>
        ))}
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden bg-muted">
        <div className="relative aspect-[3/4] w-full">
          <Image
            key={images[active]}
            src={images[active]!}
            alt={`${title} — photo ${active + 1}`}
            fill
            unoptimized
            priority
            sizes="(max-width: 1024px) 100vw, 600px"
            className="object-cover"
          />
        </div>
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => go(active - 1)}
              className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/90 shadow outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => go(active + 1)}
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/90 shadow outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-1.5 rounded-full",
                    i === active ? "bg-foreground" : "bg-foreground/30"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
