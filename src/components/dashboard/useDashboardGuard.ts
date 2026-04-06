"use client";

import { useRouter } from "@/i18n/routing";
import { useUserStore } from "@/stores/useUserStore";
import { useEffect, useMemo } from "react";
import { looksLikeAdminRole } from "./utils";

export function useDashboardGuard() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  const hasAdminRole = useMemo(() => {
    return looksLikeAdminRole(user?.roles);
  }, [user?.roles]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/");
      return;
    }

    if (!hasAdminRole) {
      router.replace("/");
    }
  }, [isAuthenticated, router, user, hasAdminRole]);

  return {
    user,
    isAuthenticated,
    hasAdminRole,
    ready: Boolean(isAuthenticated && user && hasAdminRole),
  };
}
