"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartStore } from "@/stores/useCartStore";

export function CartButton() {
  const count = useCartStore((s) => s.items.length);
  const setOpen = useCartStore((s) => s.setOpen);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Open cart (${count} items)`}
      className="relative size-11 sm:size-8 rounded text-foreground-muted hover:text-brand-primary"
      onClick={() => setOpen(true)}
    >
      <ShoppingBag className="size-5" />
      {count > 0 && (
        <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
          {count}
        </Badge>
      )}
    </Button>
  );
}

export function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = items.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const first = items[0];

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md gap-0 p-0">
        <SheetHeader className="p-4">
          <SheetTitle>Shopping cart ({items.length})</SheetTitle>
          <SheetDescription>Items you&apos;ve added to your cart.</SheetDescription>
        </SheetHeader>
        <Separator />
        {items.length === 0 ? (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingBag />
              </EmptyMedia>
              <EmptyTitle>Your cart is empty</EmptyTitle>
              <EmptyDescription>Add something you love to get started.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <ul className="flex flex-col gap-4 p-4">
              {items.map((item) => (
                <li key={item.listingId} className="flex gap-3">
                  <Link
                    href={`/products/${item.listingId}`}
                    onClick={() => setOpen(false)}
                    className="relative h-24 w-18 shrink-0 overflow-hidden rounded bg-surface-muted"
                  >
                    {item.image && (
                      <Image src={item.image} alt={item.title ?? ""} fill unoptimized className="object-cover" sizes="72px" />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-sm font-medium">{item.title ?? "Item"}</p>
                    {item.brand && <p className="text-xs text-foreground-muted">{item.brand}</p>}
                    {item.size && <p className="text-xs text-foreground-muted">Size: {item.size}</p>}
                    <div className="mt-auto flex items-center justify-between">
                      <p className="text-sm font-semibold">${(item.price ?? 0).toFixed(2)}</p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove from cart"
                        onClick={() => removeItem(item.listingId)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
        {items.length > 0 && (
          <>
            <Separator />
            <SheetFooter className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-foreground-muted">
                Shipping and promo codes are calculated at checkout.
                {items.length > 1 && " Checkout is one item at a time, starting with the first in your cart."}
              </p>
              <Button
                size="lg"
                className="w-full uppercase"
                nativeButton={false}
                render={<Link href={`/checkout/${first.listingId}`} onClick={() => setOpen(false)} />}
              >
                Checkout
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
                Continue shopping
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
