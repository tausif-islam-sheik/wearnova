"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProductGalleryRailProps {
  images: string[];
  title: string;
  className?: string;
}

/** Vertical thumbnail rail beside one large image (rail drops below on mobile). */
export function ProductGalleryRail({ images, title, className }: ProductGalleryRailProps) {
  const [active, setActive] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const finePointer = useRef(false);
  const count = images.length;

  useEffect(() => {
    finePointer.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  if (count === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        No photos
      </div>
    );
  }

  const go = (dir: number) => setActive((prev) => (prev + dir + count) % count);

  return (
    <div className={cn("flex flex-col-reverse gap-3 md:flex-row", className)}>
      <div
        className="flex shrink-0 gap-2 overflow-x-auto md:max-h-[40rem] md:w-20 md:flex-col md:overflow-y-auto md:overflow-x-visible"
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
              "relative aspect-[4/5] w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-muted outline-none md:w-20",
              "border transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              i === active ? "border-foreground" : "border-transparent hover:border-border"
            )}
          >
            <Image src={src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden bg-muted">
        <div
          ref={frameRef}
          onMouseEnter={() => {
            if (finePointer.current) setZooming(true);
          }}
          onMouseMove={(e) => {
            if (!finePointer.current || !frameRef.current) return;
            const r = frameRef.current.getBoundingClientRect();
            setOrigin({
              x: ((e.clientX - r.left) / r.width) * 100,
              y: ((e.clientY - r.top) / r.height) * 100,
            });
          }}
          onMouseLeave={() => setZooming(false)}
          className="relative aspect-[4/5] w-full overflow-hidden rounded-xl"
        >
          <button
            type="button"
            aria-label="View larger image"
            onClick={() => setLightbox(true)}
            className="block size-full cursor-zoom-in rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="relative size-full">
              <Image
                key={images[active]}
                src={images[active]!}
                alt={`${title} — photo ${active + 1}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45rem"
                style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
                className={cn(
                  "object-cover transition-transform duration-300",
                  zooming && "scale-150"
                )}
              />
            </div>
          </button>
        </div>
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/90 shadow outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => go(1)}
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

      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent
          className="max-w-5xl gap-0 p-2 sm:p-3"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") go(-1);
            if (e.key === "ArrowRight") go(1);
          }}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">Full-size product photo</DialogDescription>
          <div className="relative h-[78svh] w-full bg-muted">
            <Image
              key={`lightbox-${active}`}
              src={images[active]!}
              alt={`${title} — full-size photo ${active + 1}`}
              fill
              sizes="90vw"
              className="object-contain"
            />
            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() => go(-1)}
                  className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/90 shadow outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() => go(1)}
                  className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/90 shadow outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRight className="size-5" />
                </button>
                <div
                  aria-live="polite"
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold text-foreground shadow"
                >
                  {active + 1} / {count}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
