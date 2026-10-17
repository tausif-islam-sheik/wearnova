"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/shared/Price";
import type { Listing } from "@/types";

interface MobileBuyBarProps {
  listing: Listing;
  available: boolean;
  /** The in-page CTA block; the bar only shows once it scrolls out of view. */
  targetRef: RefObject<HTMLElement | null>;
  onBuy: () => void;
  onOffer: () => void;
}

export function MobileBuyBar({ listing, available, targetRef, onBuy, onOffer }: MobileBuyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry!.isIntersecting && entry!.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetRef]);

  if (!available) return null;

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-200 lg:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <Price price={listing.price} size="lg" />
        <Button variant="outline" className="ml-auto h-11 flex-1" onClick={onOffer} tabIndex={visible ? 0 : -1}>
          Offer
        </Button>
        <Button className="h-11 flex-1 font-semibold" onClick={onBuy} tabIndex={visible ? 0 : -1}>
          Buy now
        </Button>
      </div>
    </div>
  );
}
