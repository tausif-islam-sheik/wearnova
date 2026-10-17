import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favorites: string[];
  toggleFavorite: (listingId: string) => void;
  isFavorite: (listingId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (listingId: string) =>
        set((state) => ({
          favorites: state.favorites.includes(listingId)
            ? state.favorites.filter((id) => id !== listingId)
            : [...state.favorites, listingId],
        })),
      isFavorite: (listingId: string) => get().favorites.includes(listingId),
    }),
    { name: "desire-favorites" }
  )
);
