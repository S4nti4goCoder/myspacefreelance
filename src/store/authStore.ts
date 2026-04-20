import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsLoggingOut: (isLoggingOut: boolean) => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isLoggingOut: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsLoggingOut: (isLoggingOut) => set({ isLoggingOut }),
}));
