import { create } from "zustand";

interface UIState {
  headerScrolled: boolean;
  setHeaderScrolled: (val: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (val: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (val: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  headerScrolled: false,
  setHeaderScrolled: (val) => set({ headerScrolled: val }),
  mobileMenuOpen: false,
  setMobileMenuOpen: (val) => set({ mobileMenuOpen: val }),
  searchOpen: false,
  setSearchOpen: (val) => set({ searchOpen: val }),
}));
