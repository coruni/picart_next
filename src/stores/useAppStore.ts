import { PublicConfigs } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  theme: "light" | "dark" | "system";
  autoTranslateContent: boolean;
  sidebarOpen: boolean;
  locale: string;
  siteConfig: PublicConfigs;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setAutoTranslateContent: (enabled: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLocale: (locale: string) => void;
  setSiteConfig: (siteConfig: PublicConfigs) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "system",
      autoTranslateContent: false,
      sidebarOpen: true,
      locale: "zh",
      siteConfig: {} as PublicConfigs,
      setTheme: (theme) =>
        set({
          theme,
        }),

      setAutoTranslateContent: (autoTranslateContent) =>
        set({
          autoTranslateContent,
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
