"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/useCartStore";
import type { Listing } from "@/types";

interface QuickAddDialogProps {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddDialog({ listing, open, onOpenChange }: QuickAddDialogProps) {
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const sizes = [listing.size];
  const condition = listing.condition.replace(/_/g, " ");

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSize(null);
      setShowError(false);
      setActive(0);
    }
    onOpenChange(next);
  };

  const handleAdd = () => {
    if (!size) {
      setShowError(true);
      return;
    }
    addItem(listing, size);
    handleOpenChange(false);
    setCartOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl gap-0 p-0 overflow-hidden">
        <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr_1fr] sm:p-6">
          <div className="hidden sm:flex flex-col gap-2 max-h-[28rem] overflow-y-auto">
            {listing.images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}`}
                className={cn(
                  "relative h-16 w-12 shrink-0 overflow-hidden border bg-surface-muted",
                  i === active ? "border-foreground" : "border-transparent"
                )}
              >
                <Image src={src} alt="" fill unoptimized className="object-cover" sizes="48px" />
              </button>
            ))}
          </div>
          <div className="relative aspect-[3/4] w-full bg-surface-muted overflow-hidden">
            <Image
              src={listing.images[active] ?? listing.images[0]}
              alt={listing.title}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 640px) 90vw, 320px"
            />
          </div>
          <div className="flex flex-col gap-3">
            <DialogTitle className="pr-6 text-base font-medium leading-snug">
              {listing.title}
            </DialogTitle>
            <DialogDescription className="capitalize">
              {listing.brand} · {condition}
            </DialogDescription>
            <p className="text-2xl font-bold">${listing.price.toFixed(2)}</p>
            <div className="border-t border-dashed pt-3">
              <p className="text-sm font-semibold">
                Size{size ? <span className="ml-2 font-normal">{size}</span> : null}
              </p>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={size === s}
                    onClick={() => {
                      setSize(s);
                      setShowError(false);
                    }}
                    className={cn(
                      "min-w-12 border px-3 py-1.5 text-sm transition-colors",
                      size === s
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {showError && (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  Please select a size.
                </p>
              )}
            </div>
            <div className="mt-auto flex flex-col gap-2">
              <Button size="lg" className="w-full uppercase" onClick={handleAdd}>
                Add to cart
              </Button>
              <Button
                variant="link"
                size="sm"
                nativeButton={false}
                render={<Link href={`/products/${listing.id}`} />}
              >
                View full details
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
