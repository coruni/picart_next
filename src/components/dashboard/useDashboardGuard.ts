"use client";

import { useRouter } from "@/i18n/routing";
import { useUserStore } from "@/stores/useUserStore";
import { useEffect, useMemo } from "react";
import { looksLikeAdminRole } from "./utils";

export function useDashboardGuard() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const isProfileLoading = useUserStore((state) => state.isProfileLoading);

  const hasAdminRole = useMemo(() => {
    return looksLikeAdminRole(user?.roles);
  }, [user?.roles]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    // 已登录但 profile 还在补拉：等结果，别在刷新首帧把用户踢回首页
    if (isProfileLoading) {
      return;
    }

    if (!user || !hasAdminRole) {
      router.replace("/");
    }
  }, [isAuthenticated, isProfileLoading, router, user, hasAdminRole]);

  return {
    user,
    isAuthenticated,
    hasAdminRole,
    ready: Boolean(isAuthenticated && user && hasAdminRole),
  };
}
