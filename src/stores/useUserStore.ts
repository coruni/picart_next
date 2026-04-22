import { userControllerLogout } from "@/api";
import { removeCookie, setCookie } from "@/lib/cookies";
import type { UserProfile } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const TOKEN_COOKIE_NAME = "auth-token";
const REFRESH_TOKEN_COOKIE_NAME = "auth-refresh-token";
const TOKEN_EXPIRY_DAYS = 30;

export interface UserState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  login: (user: UserProfile, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<UserProfile>) => void;
  clearStorage: () => void;
  refreshAccessToken: () => Promise<boolean>;
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

/**
 * 同步 refresh token 到 cookie（支持 SSR）
 */
function syncRefreshTokenToCookie(refreshToken: string | null): void {
  if (typeof window === "undefined") return; // 确保只在客户端执行

  if (refreshToken) {
    const expires = new Date();
    expires.setDate(expires.getDate() + TOKEN_EXPIRY_DAYS);
    setCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      expires,
      path: "/",
      sameSite: "Lax",
    });
  } else {
    // 删除 cookie
    removeCookie(REFRESH_TOKEN_COOKIE_NAME, {
      path: "/",
      sameSite: "Lax",
    });
  }
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
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

      setRefreshToken: (refreshToken: string | null) => {
        syncRefreshTokenToCookie(refreshToken);
        set({ refreshToken });
      },

      login: (user: UserProfile, token: string, refreshToken: string) => {
        syncTokenToCookie(token);
        syncRefreshTokenToCookie(refreshToken);
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        const currentToken = get().token;

        try {
          if (currentToken) {
            await userControllerLogout({
              headers: {
                Authorization: `Bearer ${currentToken}`,
              },
            });
          }
        } catch (error) {
          console.error("Failed to logout on server:", error);
        } finally {
          syncTokenToCookie(null);
          syncRefreshTokenToCookie(null);

          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });

          if (typeof window !== "undefined") {
            localStorage.removeItem("user-storage");
          }
        }
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

      refreshAccessToken: async (): Promise<boolean> => {
        const currentRefreshToken = get().refreshToken;

        // 没有 refreshToken，直接清空登录状态
        if (!currentRefreshToken) {
          console.warn("[auth] No refresh token available, clearing auth state");
          syncTokenToCookie(null);
          syncRefreshTokenToCookie(null);
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          if (typeof window !== "undefined") {
            localStorage.removeItem("user-storage");
          }
          return false;
        }

        try {
          // 使用原始 fetch 避免被拦截器拦截导致循环
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";
          const response = await fetch(`${baseUrl}/user/refresh-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
          });

          if (response.status === 401) {
            console.warn("[auth] Refresh token expired (401), logging out");
            syncTokenToCookie(null);
            syncRefreshTokenToCookie(null);
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            });
            if (typeof window !== "undefined") {
              localStorage.removeItem("user-storage");
            }
            return false;
          }

          if (response.status === 400) {
            console.warn("[auth] Refresh token invalid (400), logging out");
            syncTokenToCookie(null);
            syncRefreshTokenToCookie(null);
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            });
            if (typeof window !== "undefined") {
              localStorage.removeItem("user-storage");
            }
            return false;
          }

          if (!response.ok) {
            console.error("[auth] Refresh token request failed:", response.status);
            return false;
          }

          const data = await response.json();
          if (data?.data?.token) {
            const { token } = data.data;
            syncTokenToCookie(token);
            set({
              token,
              isAuthenticated: true,
            });
            console.log("[auth] Token refreshed successfully");
            return true;
          }
        } catch (error) {
          console.error("[auth] Failed to refresh token:", error);
        }

        return false;
      },
    }),
    {
      name: "user-storage",
      partialize: (state: UserState) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ) as never,
);
