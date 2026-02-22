import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface BearState {
  token: string | null | undefined;
  setToken: (token: string | null | undefined) => void;
}

export const useAuthStore = create<BearState>()(
  devtools(
    persist(
      (set) => ({
        token: undefined,
        setToken: () => set((state) => ({ token: state.token })),
      }),
      {
        name: "bear-storage",
      },
    ),
  ),
);
