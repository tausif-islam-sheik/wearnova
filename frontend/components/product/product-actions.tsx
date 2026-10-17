"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import type { Listing } from "@/types";

/** Buy / offer entry points shared by the summary panel and the mobile buy bar. */
export function useProductActions(listing: Listing) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [offerOpen, setOfferOpen] = useState(false);

  const available = listing.status === "active";

  const requireLogin = useCallback(() => {
    if (isAuthenticated) return false;
    router.push(`/login?redirect=/products/${listing.id}`);
    return true;
  }, [isAuthenticated, router, listing.id]);

  const buyNow = useCallback(() => {
    if (requireLogin()) return;
    router.push(`/checkout/${listing.id}`);
  }, [requireLogin, router, listing.id]);

  const makeOffer = useCallback(() => {
    if (requireLogin()) return;
    setOfferOpen(true);
  }, [requireLogin]);

  return { available, buyNow, makeOffer, offerOpen, setOfferOpen };
}

export function OfferDialog({
  listing,
  open,
  onOpenChange,
}: {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = useState("");
  const value = Number(amount);
  const valid = amount !== "" && value > 0 && value <= listing.price;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setAmount("");
      }}
    >
      <DialogContent className="rounded">
        <DialogHeader>
          <DialogTitle>Make an offer</DialogTitle>
          <DialogDescription>
            Listed at ${listing.price.toFixed(2)}. Enter your offer and the seller will be
            notified.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="offer-amount">Your offer</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="offer-amount"
                type="number"
                min="1"
                max={listing.price}
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {amount !== "" && value > listing.price && (
              <p className="text-xs text-destructive">
                Offers can&apos;t be higher than the listed price.
              </p>
            )}
          </div>
          <Button
            className="w-full"
            disabled={!valid}
            onClick={() => {
              toast.success(`Offer of $${value.toFixed(2)} submitted!`);
              onOpenChange(false);
              setAmount("");
            }}
          >
            Submit offer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
