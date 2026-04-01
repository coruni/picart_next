import { userControllerLogout } from "@/api";
import { removeCookie, setCookie } from "@/lib/cookies";
import type { UserProfile } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const TOKEN_COOKIE_NAME = "auth-token";
const TOKEN_EXPIRY_DAYS = 30;

export interface UserState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<UserProfile>) => void;
  clearStorage: () => void;
}

/**
 * 同步 token 到 cookie（支持 SSR）
 */
function syncTokenToCookie(token: string | null): void {
  if (typeof window === "undefined") return; // 确保只在客户端执行

  if (token) {
    const expires = new Date();
    expires.setDate(expires.getDate() + TOKEN_EXPIRY_DAYS);
    setCookie(TOKEN_COOKIE_NAME, token, {
      expires,
      path: "/",
      sameSite: "Lax",
    });
  } else {
    // 删除 cookie
    removeCookie(TOKEN_COOKIE_NAME, {
      path: "/",
      sameSite: "Lax",
    });
  }
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user: UserProfile | null) =>
        set((state: UserState) => ({
          user,
          isAuthenticated: !!user || !!state.token,
        })),

      setToken: (token: string | null) => {
        syncTokenToCookie(token);
        set((state: UserState) => ({
          token,
          isAuthenticated: !!token || !!state.user,
        }));
      },

      login: (user: UserProfile, token: string) => {
        syncTokenToCookie(token);
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        // 1. 清除 cookie
        syncTokenToCookie(null);

        // 触发退出登录
        await userControllerLogout();
        
        // 2. 清除 localStorage（在 set 之前）
        if (typeof window !== "undefined") {
          localStorage.removeItem("user-storage");
        }

        // 3. 重置状态
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      clearStorage: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("user-storage");
        }
      },

      updateUser: (userData: Partial<UserProfile>) =>
        set((state: UserState) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: "user-storage",
      partialize: (state: UserState) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ) as never,
);
