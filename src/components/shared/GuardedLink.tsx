"use client";

import type { ComponentProps, MouseEvent } from "react";
import { Link } from "@/i18n/routing";
import { useUserStore } from "@/stores";
import { openLoginDialog } from "@/lib/modal-helpers";
import { requiresAuthForHref } from "@/lib/auth-guard";

type GuardedLinkProps = ComponentProps<typeof Link>;

export function GuardedLink({
  href,
  onClick,
  ...props
}: GuardedLinkProps) {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const requiresAuth = requiresAuthForHref(href);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (requiresAuth && !isAuthenticated) {
      event.preventDefault();
      openLoginDialog();
      return;
    }

    onClick?.(event);
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
