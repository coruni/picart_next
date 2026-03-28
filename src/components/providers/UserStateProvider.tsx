"use client";

import { userControllerGetProfile } from "@/api";
import { getCookie } from "@/lib/cookies";
import { TOKEN_COOKIE_NAME } from "@/lib/request-auth";
import { initializeInterceptors } from "@/runtime.config";
import { useAppStore } from "@/stores";
import { useUserStore } from "@/stores/useUserStore";
import type { PublicConfigs, UserProfile } from "@/types";
import { startTransition, useEffect, useRef, useState } from "react";

interface UserStateProviderProps {
  initialToken: string | null;
  initialUser: UserProfile | null;
  initialConfig: PublicConfigs | null;
  children: React.ReactNode;
}

export function UserStateProvider({
  initialToken,
  initialUser,
  initialConfig,
  children,
}: UserStateProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const hasInitializedRef = useRef(false);

  const token = useUserStore((state) => state.token);
  const user = useUserStore((state) => state.user);
  const setToken = useUserStore((state) => state.setToken);
  const setUser = useUserStore((state) => state.setUser);
  const setConfig = useAppStore((state) => state.setSiteConfig);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const run = async () => {
      await initializeInterceptors();

      const cookieToken = getCookie(TOKEN_COOKIE_NAME);
      const resolvedToken =
        initialToken || cookieToken || useUserStore.getState().token;

      if (process.env.NODE_ENV === "development") {
        console.log("[auth][provider] hydration start", {
          initialToken,
          cookieToken,
          resolvedToken,
          initialUserId: initialUser?.id ?? null,
          storeToken: token,
          storeUserId: user?.id ?? null,
        });
      }

      if (resolvedToken && resolvedToken !== useUserStore.getState().token) {
        setToken(resolvedToken);
      }

      if (initialUser) {
        const currentUser = useUserStore.getState().user;
        if (!currentUser || currentUser.id !== initialUser.id) {
          setUser(initialUser);
        }
      }

      if (initialConfig) {
        setConfig(initialConfig);
      }

      setIsInitialized(true);

      if (!initialUser && resolvedToken) {
        const fetchProfile = async () => {
          try {
            const response = await userControllerGetProfile();
            const profile = response?.data?.data || null;

            if (profile) {
              startTransition(() => {
                const currentUser = useUserStore.getState().user;
                if (!currentUser || currentUser.id !== profile.id) {
                  setUser(profile);
                }
              });
            }
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              console.warn("[auth][provider] client profile fetch failed", {
                error,
              });
            }
          }
        };

        const schedule = () => {
          void fetchProfile();
        };

        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          window.requestIdleCallback(schedule);
        } else {
          setTimeout(schedule, 0);
        }
      }

      if (process.env.NODE_ENV === "development") {
        const currentState = useUserStore.getState();
        console.log("[auth][provider] hydration end", {
          token: currentState.token,
          userId: currentState.user?.id ?? null,
          isAuthenticated: currentState.isAuthenticated,
        });
      }
    };

    void run();
  }, [
    initialConfig,
    initialToken,
    initialUser,
    setConfig,
    setToken,
    setUser,
    token,
    user,
  ]);

  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
}
