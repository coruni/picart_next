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
      const currentStore = useUserStore.getState();
      const resolvedToken = initialToken ?? cookieToken ?? null;

      if (!resolvedToken) {
        if (currentStore.token || currentStore.user || currentStore.isAuthenticated) {
          setToken(null);
          setUser(null);
        }
      }

      if (resolvedToken && resolvedToken !== currentStore.token) {
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

      const currentUser = useUserStore.getState().user;

      if (!initialUser && resolvedToken && !currentUser) {
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
