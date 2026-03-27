"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { useUserStore } from "@/stores";
import { openLoginDialog } from "@/lib/modal-helpers";
import { isProtectedPath } from "@/lib/auth-guard";

export function AuthRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const fallbackPathRef = useRef("/");

  useEffect(() => {
    if (!isProtectedPath(pathname) || isAuthenticated) {
      fallbackPathRef.current = pathname || "/";
      return;
    }

    openLoginDialog();
    router.replace(fallbackPathRef.current || "/");
  }, [isAuthenticated, pathname, router]);

  return null;
}
