"use client";

import { userControllerGetProfile } from "@/api";
import { initializeInterceptors } from "@/runtime.config";
import { useAppStore, useTranslateStore } from "@/stores";
import { useUserStore } from "@/stores/useUserStore";
import type { PublicConfigs, UserProfile } from "@/types";
import { startTransition, useEffect, useLayoutEffect, useRef } from "react";
import { AuthSnapshotProvider } from "./AuthSnapshotProvider";

// 服务端没有 layout effect，用 useEffect 兜底
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

interface UserStateProviderProps {
  initialToken: string | null;
  initialUser: UserProfile | null;
  initialConfig: PublicConfigs | null;
  children: React.ReactNode;
}

async function loadProfile(): Promise<UserProfile | null> {
  try {
    const response = await userControllerGetProfile();
    return response?.data?.data ?? null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[auth][provider] profile fetch failed", { error });
    }
    return null;
  }
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
    } else if (userStore.token) {
      // SSR 没读到 token（cookie 缺失/过期/被浏览器丢弃），但本地仍有登录态：
      // 以客户端为准，并把 token 回写 cookie，让后续 SSR 恢复正常。
      // 直接按 SSR 结果清空会导致「刷新后台即掉登录」。
      userStore.setToken(userStore.token);
    } else if (userStore.user || userStore.isAuthenticated) {
      userStore.setToken(null);
      userStore.setUser(null);
    }

    if (initialUser) {
      userStore.setUser(initialUser);
    }

    if (initialConfig) {
      useAppStore.getState().setSiteConfig(initialConfig);
    }

    // 到这里 store 已经反映服务端结果，UI 可以从「服务端快照」切回 store
    useUserStore.getState().setAuthReady(true);

    // 鉴权头已收敛到 resilientFetch，这里只需要 401 重试等响应侧拦截器
    void initializeInterceptors();

    // 有 token 但没拿到 profile（接口抖动 / token 过期 / 上面自愈的客户端登录态）：
    // 先补拉一次，失败就尝试续期再补拉。
    // 不能直接放弃——否则「有登录态但 profile 缺失」会被后台守卫当成未登录踢回首页。
    if (useUserStore.getState().token && !useUserStore.getState().user) {
      useUserStore.getState().setProfileLoading(true);

      void (async () => {
        try {
          let profile = await loadProfile();

          if (!profile) {
            // refreshAccessToken 在「没有 refreshToken / refresh 被拒」时会自己清空登录态，
            // 所以这里无条件调用：能续期就续期，不能续期就干净地登出。
            const refreshed = await useUserStore.getState().refreshAccessToken();

            if (refreshed) {
              profile = await loadProfile();
            }
          }

          if (profile) {
            startTransition(() => {
              useUserStore.getState().setUser(profile);
            });
          }
        } finally {
          useUserStore.getState().setProfileLoading(false);
        }
      })();
    }
  }, []);

  return (
    <AuthSnapshotProvider
      value={{
        user: initialUser,
        // 只有拿到 profile 才算“可渲染的已登录态”：
        // 有 token 但 profile 没拉到时按未登录渲染，避免服务端产出 /account/undefined 这类链接
        isAuthenticated: Boolean(initialUser),
      }}
    >
      {children}
    </AuthSnapshotProvider>
  );
}
