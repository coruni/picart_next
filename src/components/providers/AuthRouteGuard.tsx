"use client";

import { useEffect, useRef } from "react";
import { useTopLoader } from "nextjs-toploader";
import { usePathname, useRouter } from "@/i18n/routing";
import { useUserStore } from "@/stores";
import { openLoginDialog } from "@/lib/modal-helpers";
import { isProtectedPath } from "@/lib/auth-guard";

export function AuthRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const loader = useTopLoader();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const fallbackPathRef = useRef("/");

  useEffect(() => {
    if (!isProtectedPath(pathname) || isAuthenticated) {
      fallbackPathRef.current = pathname || "/";
      return;
    }

    loader.done(true);
    loader.remove();
    openLoginDialog();
    router.replace(fallbackPathRef.current || "/");
  }, [isAuthenticated, loader, pathname, router]);

  return null;
}
