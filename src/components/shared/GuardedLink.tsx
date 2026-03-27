"use client";

import type { ComponentProps, MouseEvent } from "react";
import { useTopLoader } from "nextjs-toploader";
import { Link } from "@/i18n/routing";
import { useUserStore } from "@/stores";
import { openLoginDialog } from "@/lib/modal-helpers";
import { requiresAuthForHref } from "@/lib/auth-guard";

type GuardedLinkProps = ComponentProps<typeof Link>;

export function GuardedLink({
  href,
  onClick,
  onClickCapture,
  ...props
}: GuardedLinkProps) {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const loader = useTopLoader();
  const requiresAuth = requiresAuthForHref(href);

  const blockNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation?.();
    loader.done(true);
    loader.remove();
    openLoginDialog();
  };

  const handleClickCapture = (event: MouseEvent<HTMLAnchorElement>) => {
    if (requiresAuth && !isAuthenticated) {
      blockNavigation(event);
      return;
    }

    onClickCapture?.(event);
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (requiresAuth && !isAuthenticated) {
      blockNavigation(event);
      return;
    }

    onClick?.(event);
  };

  return (
    <Link
      href={href}
      onClickCapture={handleClickCapture}
      onClick={handleClick}
      {...props}
    />
  );
}
