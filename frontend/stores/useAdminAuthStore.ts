import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminUser } from "@/types";
import { api } from "@/lib/api";
import { useAuthStore } from "./useAuthStore";

interface AdminAuthResponse {
  accessToken: string;
  user: AdminUser;
}

interface AdminAuthState {
  admin: AdminUser | null;
  accessToken: string | null;
  isAdminAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateAdmin: (updates: Partial<AdminUser>) => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      accessToken: null,
      isAdminAuthenticated: false,

      login: async (email: string, password: string) => {
        const data = await api.post<AdminAuthResponse>("/auth/admin/login", { email, password });
        set({ admin: data.user, accessToken: data.accessToken, isAdminAuthenticated: true });
      },

      logout: () => {
        set({ admin: null, accessToken: null, isAdminAuthenticated: false });
        useAuthStore.getState().logout();
      },

      updateAdmin: (updates) =>
        set((state) => ({
          admin: state.admin ? { ...state.admin, ...updates } : null,
        })),
    }),
    { name: "desire-wardrobe-admin-auth" }
  )
);
