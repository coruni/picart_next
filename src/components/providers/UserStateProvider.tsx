"use client";

import { userControllerGetProfile } from "@/api";
import { initializeInterceptors } from "@/runtime.config";
import { useAppStore, useTranslateStore } from "@/stores";
import { useUserStore } from "@/stores/useUserStore";
import type { PublicConfigs, UserProfile } from "@/types";
import { startTransition, useEffect, useLayoutEffect, useRef } from "react";

// 服务端没有 layout effect，用 useEffect 兜底
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

interface UserStateProviderProps {
  initialToken: string | null;
  initialUser: UserProfile | null;
  initialConfig: PublicConfigs | null;
  children: React.ReactNode;
}

/**
 * 登录态初始化。
 *
 * 这里刻意不再用 `return null` 拦住子树：那会让整个应用在 SSR 阶段输出空壳。
 * 为了同时保证「有 SSR」和「首帧不 hydration mismatch」，
 * useUserStore / useAppStore 都关闭了自动 hydrate，
 * 由本组件在绘制前（layout effect）恢复 localStorage 并用服务端结果覆盖。
 */
export function UserStateProvider({
  initialToken,
  initialUser,
  initialConfig,
  children,
}: UserStateProviderProps) {
  const hasInitializedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // 先恢复持久化状态，再用服务端结果覆盖（服务端结果更权威）
    void useUserStore.persist.rehydrate();
    void useAppStore.persist.rehydrate();
    void useTranslateStore.persist.rehydrate();

    const userStore = useUserStore.getState();

    if (initialToken) {
      if (userStore.token !== initialToken) {
        userStore.setToken(initialToken);
      }
    } else if (userStore.token || userStore.user || userStore.isAuthenticated) {
      userStore.setToken(null);
      userStore.setUser(null);
    }

    if (initialUser) {
      userStore.setUser(initialUser);
    }

    if (initialConfig) {
      useAppStore.getState().setSiteConfig(initialConfig);
    }

    // 鉴权头已收敛到 resilientFetch，这里只需要 401 重试等响应侧拦截器
    void initializeInterceptors();

    // 服务端没拿到 profile（接口抖动）但有 token：客户端补一次
    if (initialToken && !initialUser) {
      void (async () => {
        try {
          const response = await userControllerGetProfile();
          const profile = response?.data?.data;

          if (profile) {
            startTransition(() => {
              useUserStore.getState().setUser(profile);
            });
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[auth][provider] client profile fetch failed", {
              error,
            });
          }
        }
      })();
    }
  }, []);

  return <>{children}</>;
}
