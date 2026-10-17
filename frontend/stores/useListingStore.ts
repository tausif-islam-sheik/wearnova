import { create } from "zustand";
import type { Listing, ListingStatus } from "@/types";
import { mockListings } from "@/mocks/listings";
import { api } from "@/lib/api";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FetchListingsResponse {
  listings: Listing[];
  pagination: PaginationInfo;
}

interface ListingStoreState {
  listings: Listing[];
  pagination: PaginationInfo | null;
  loading: boolean;
  hydrated: boolean;
  fetchListings: (params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    brand?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    sort?: string;
  }) => Promise<void>;
  addListing: (listing: Listing) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  setListingStatus: (id: string, status: ListingStatus) => void;
}

export const useListingStore = create<ListingStoreState>()((set) => ({
  listings: mockListings,
  pagination: null,
  loading: false,
  hydrated: false,

  fetchListings: async (params) => {
    set({ loading: true });
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
      if (params?.brand) searchParams.set("brand", params.brand);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.minPrice !== undefined) searchParams.set("minPrice", String(params.minPrice));
      if (params?.maxPrice !== undefined) searchParams.set("maxPrice", String(params.maxPrice));
      if (params?.condition) searchParams.set("condition", params.condition);
      if (params?.sort) searchParams.set("sort", params.sort);

      const qs = searchParams.toString();
      const data = await api.get<FetchListingsResponse>(`/listings${qs ? `?${qs}` : ""}`);
      set({ listings: data.listings, pagination: data.pagination, loading: false, hydrated: true });
    } catch {
      set({ loading: false, hydrated: true });
    }
  },

  addListing: (listing) =>
    set((state) => ({ listings: [listing, ...state.listings] })),

  updateListing: (id, updates) =>
    set((state) => ({
      listings: state.listings.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),

  deleteListing: (id) =>
    set((state) => ({
      listings: state.listings.filter((l) => l.id !== id),
    })),

  setListingStatus: (id, status) =>
    set((state) => ({
      listings: state.listings.map((l) =>
        l.id === id ? { ...l, status } : l
      ),
    })),
}));
