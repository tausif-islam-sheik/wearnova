import { create } from "zustand";

interface ListingFilterState {
  category: string[];
  size: string[];
  brand: string[];
  condition: string[];
  color: string[];
  material: string[];
  priceMin: number | null;
  priceMax: number | null;
  sort: string;
  search: string;
  setFilter: (key: string, value: string | number | string[] | null) => void;
  resetFilters: () => void;
  setFromQuery: (query: Record<string, string | undefined>) => void;
  toQuery: () => Record<string, string>;
}

const initialState = {
  category: [],
  size: [],
  brand: [],
  condition: [],
  color: [],
  material: [],
  priceMin: null,
  priceMax: null,
  sort: "newest",
  search: "",
};

export const useListingFilterStore = create<ListingFilterState>()((set, get) => ({
  ...initialState,
  setFilter: (key, value) =>
    set({ [key]: value } as Partial<ListingFilterState>),
  resetFilters: () => set(initialState),
  setFromQuery: (query) => {
    const filters: Partial<ListingFilterState> = {};
    for (const [key, val] of Object.entries(query)) {
      if (val === undefined || val === "") continue;
      if (key === "q") {
        filters.search = val;
      } else if (key === "priceMin" || key === "priceMax") {
        (filters as Record<string, unknown>)[key] = Number(val);
      } else if (key === "sort") {
        filters.sort = val;
      } else if (Array.isArray(val) || typeof val === "string") {
        (filters as Record<string, unknown>)[key] = Array.isArray(val) ? val : val.split(",");
      }
    }
    set({ ...initialState, ...filters });
  },
  toQuery: () => {
    const state = get();
    const q: Record<string, string> = {};
    if (state.search) q.q = state.search;
    if (state.category.length) q.category = state.category.join(",");
    if (state.size.length) q.size = state.size.join(",");
    if (state.brand.length) q.brand = state.brand.join(",");
    if (state.condition.length) q.condition = state.condition.join(",");
    if (state.color.length) q.color = state.color.join(",");
    if (state.material.length) q.material = state.material.join(",");
    if (state.priceMin !== null) q.priceMin = String(state.priceMin);
    if (state.priceMax !== null) q.priceMax = String(state.priceMax);
    if (state.sort !== "newest") q.sort = state.sort;
    return q;
  },
}));
