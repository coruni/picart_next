import { routing } from "@/i18n/routing";
import { PublicConfigs } from "@/types";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
      theme: "system" as const,
      sidebarOpen: true,
      locale: routing.defaultLocale,
      siteConfig: {} as PublicConfigs,
      setTheme: (theme: "light" | "dark" | "system") =>
        set({
          theme,
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
      // 关闭自动 hydrate：首帧必须与服务端渲染一致，由 UserStateProvider 在挂载前统一恢复
      skipHydration: true,
    },
  ),
);

interface TranslateState {
  autoTranslateContent: boolean;
  setAutoTranslateContent: (enabled: boolean) => void;
}

export const useTranslateStore = create<TranslateState>()(
  persist(
    (set) => ({
      autoTranslateContent: false,
      setAutoTranslateContent: (autoTranslateContent: boolean) =>
        set({ autoTranslateContent }),
    }),
    {
      name: "translate-storage",
      storage: createJSONStorage(() => sessionStorage),
      // 同 app-storage：避免首帧与服务端渲染不一致
      skipHydration: true,
    },
  ),
);
