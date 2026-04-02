"use client";

import { useRouter } from "@/i18n/routing";
import { useUserStore } from "@/stores/useUserStore";
import { useEffect } from "react";

export function useDashboardGuard() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/");
    }
  }, [isAuthenticated, router, user]);

  return {
    user,
    isAuthenticated,
    ready: Boolean(isAuthenticated && user),
  };
}
