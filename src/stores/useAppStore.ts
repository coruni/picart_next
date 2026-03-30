import { routing } from "@/i18n/routing";
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
      theme: "system" as const,
      autoTranslateContent: false,
      sidebarOpen: true,
      locale: routing.defaultLocale,
      siteConfig: {} as PublicConfigs,
      setTheme: (theme: "light" | "dark" | "system") =>
        set({
          theme,
        }),

      setAutoTranslateContent: (autoTranslateContent: boolean) =>
        set({
          autoTranslateContent,
        }),

      toggleSidebar: () =>
        set((state: AppState) => ({
          sidebarOpen: !state.sidebarOpen,
        })),

      setSidebarOpen: (open: boolean) =>
        set({
          sidebarOpen: open,
        }),

      setSiteConfig: (siteConfig: PublicConfigs) =>
        set({
          siteConfig,
        }),

      setLocale: (locale: string) =>
        set({
          locale,
        }),
    }),
    {
      name: "app-storage",
      partialize: (state: AppState) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        locale: state.locale,
        siteConfig: state.siteConfig,
      }),
    },
  ) as never,
);
