"use client";

import { useCallback } from "react";
import { useTopLoader } from "nextjs-toploader";
import { useRouter } from "@/i18n/routing";
import { openLoginDialog } from "@/lib/modal-helpers";
import { requiresAuthForHref } from "@/lib/auth-guard";
import { useUserStore } from "@/stores";

type RouterInstance = ReturnType<typeof useRouter>;
type RouterPushArgs = Parameters<RouterInstance["push"]>;
type RouterReplaceArgs = Parameters<RouterInstance["replace"]>;

export function useAuthNavigation() {
  const router = useRouter();
  const loader = useTopLoader();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  const guardedPush = useCallback(
    (...args: RouterPushArgs) => {
      if (requiresAuthForHref(args[0]) && !isAuthenticated) {
        loader.done(true);
        loader.remove();
        openLoginDialog();
        return false;
      }

      router.push(...args);
      return true;
    },
    [isAuthenticated, loader, router],
  );

  const guardedReplace = useCallback(
    (...args: RouterReplaceArgs) => {
      if (requiresAuthForHref(args[0]) && !isAuthenticated) {
        loader.done(true);
        loader.remove();
        openLoginDialog();
        return false;
      }

      router.replace(...args);
      return true;
    },
    [isAuthenticated, loader, router],
  );

  return {
    ...router,
    push: guardedPush,
    replace: guardedReplace,
  };
}
