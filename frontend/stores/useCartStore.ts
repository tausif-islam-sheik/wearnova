import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Listing } from "@/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (listing: Listing, size?: string) => void;
  removeItem: (listingId: string) => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (listing, size) =>
        set((state) => {
          if (state.items.some((i) => i.listingId === listing.id)) return state;
          return {
            items: [
              ...state.items,
              {
                listingId: listing.id,
                size,
                title: listing.title,
                brand: listing.brand,
                price: listing.price,
                image: listing.images[0],
                addedAt: new Date().toISOString(),
              },
            ],
          };
        }),
      removeItem: (listingId) =>
        set((state) => ({
          items: state.items.filter((i) => i.listingId !== listingId),
        })),
      clearCart: () => set({ items: [] }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "desire-wardrobe-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
