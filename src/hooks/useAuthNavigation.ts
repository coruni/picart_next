"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { openLoginDialog } from "@/lib/modal-helpers";
import { requiresAuthForHref } from "@/lib/auth-guard";
import { useUserStore } from "@/stores";

type RouterInstance = ReturnType<typeof useRouter>;
type RouterPushArgs = Parameters<RouterInstance["push"]>;
type RouterReplaceArgs = Parameters<RouterInstance["replace"]>;

export function useAuthNavigation() {
  const router = useRouter();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  const guardedPush = useCallback(
    (...args: RouterPushArgs) => {
      if (requiresAuthForHref(args[0]) && !isAuthenticated) {
        openLoginDialog();
        return false;
      }

      router.push(...args);
      return true;
    },
    [isAuthenticated, router],
  );

  const guardedReplace = useCallback(
    (...args: RouterReplaceArgs) => {
      if (requiresAuthForHref(args[0]) && !isAuthenticated) {
        openLoginDialog();
        return false;
      }

      router.replace(...args);
      return true;
    },
    [isAuthenticated, router],
  );

  return {
    ...router,
    push: guardedPush,
    replace: guardedReplace,
  };
}
