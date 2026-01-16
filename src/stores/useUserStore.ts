import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/types";
import { setCookie, removeCookie } from "@/lib/cookies";

const TOKEN_COOKIE_NAME = "auth-token";
const TOKEN_EXPIRY_DAYS = 30;

interface UserState {
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
      sameSite: "Lax"
    });
  } else {
    // 删除 cookie
    removeCookie(TOKEN_COOKIE_NAME, {
      path: "/",
      sameSite: "Lax"
    });
    
    // 额外保险：直接使用 document.cookie 删除
    if (typeof document !== "undefined") {
      document.cookie = `${TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
      document.cookie = `${TOKEN_COOKIE_NAME}=; max-age=0; path=/`;
    }
  }
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setToken: (token) => {
        syncTokenToCookie(token);
        set({ token });
      },

      login: (user, token) => {
        syncTokenToCookie(token);
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        // 1. 清除 cookie
        syncTokenToCookie(null);
        
        // 2. 清除 localStorage（在 set 之前）
        if (typeof window !== "undefined") {
          localStorage.removeItem("user-storage");
        }
        
        // 3. 重置状态（persist 会尝试保存，但我们已经删除了 key）
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        
        // 4. 再次确保清除（防止 persist 中间件重新写入）
        if (typeof window !== "undefined") {
          requestAnimationFrame(() => {
            localStorage.removeItem("user-storage");
          });
        }
      },

      clearStorage: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("user-storage");
        }
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: "user-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

