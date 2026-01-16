import { PublicConfigs } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  theme: "light" | "dark" | "system";
  sidebarOpen: boolean;
  locale: string;
  siteConfig: PublicConfigs;
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLocale: (locale: string) => void;
  setSiteConfig: (siteConfig: PublicConfigs) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "system",
      sidebarOpen: true,
      locale: "zh",
      siteConfig: {} as PublicConfigs,
      setTheme: (theme) =>
        set({
          theme,
        }),

      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),

      setSidebarOpen: (open) =>
        set({
          sidebarOpen: open,
        }),

      setSiteConfig: (siteConfig: PublicConfigs) =>
        set({
          siteConfig,
        }),

      setLocale: (locale) =>
        set({
          locale,
        }),
    }),
    {
      name: "app-storage",
    }
  )
);
