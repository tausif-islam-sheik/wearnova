import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { api } from "@/lib/api";

interface AuthResponse {
  accessToken: string;
  user: User;
}

interface PendingVerificationResponse {
  pendingVerification: boolean;
  phoneMasked: string;
  message: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  viewingAsAdmin: boolean;
  impersonatedUserId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string, phone: string) => Promise<PendingVerificationResponse>;
  verifyPhone: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<PendingVerificationResponse>;
  setUser: (user: User) => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setViewingAsAdmin: (adminMode: boolean, userId?: string) => void;
  exitAdminView: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      viewingAsAdmin: false,
      impersonatedUserId: null,

      login: async (email: string, password: string) => {
        const data = await api.post<AuthResponse>("/auth/login", { email, password });
        set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
      },

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          viewingAsAdmin: false,
          impersonatedUserId: null,
        }),

      signup: (name: string, email: string, password: string, phone: string) =>
      api.post<PendingVerificationResponse>("/auth/signup", {
        name,
        email,
        password,
        phone,
      }),

      verifyPhone: async (email: string, otp: string) => {
        const data = await api.post<AuthResponse>("/auth/verify-phone", { email, otp });
        set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
      },

      resendOtp: (email: string) =>
        api.post<PendingVerificationResponse>("/auth/resend-otp", { email }),

      setUser: (user) =>
        set({ user, isAuthenticated: true }),

      updateProfile: async (data) => {
        const currentUser = get().user;
        if (!currentUser) return;
        try {
          const updated = await api.patch<User>(`/users/${currentUser.id}`, data);
          set({ user: updated });
        } catch {
          set({ user: { ...currentUser, ...data } });
        }
      },

      setViewingAsAdmin: (adminMode, userId) =>
        set({ viewingAsAdmin: adminMode, impersonatedUserId: userId ?? null }),

      exitAdminView: () =>
        set({ viewingAsAdmin: false, impersonatedUserId: null }),
    }),
    { name: "desire-wardrobe-auth" }
  )
);
