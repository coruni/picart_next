"use client";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib";
import { ChevronRight, Home } from "lucide-react";
import { useLocale } from "next-intl";
import { getDashboardCopy } from "./copy";
import { dashboardNavItems } from "./nav";

type DashboardBreadcrumbProps = {
  pathname: string;
};

export function DashboardBreadcrumb({ pathname }: DashboardBreadcrumbProps) {
  const copy = getDashboardCopy(useLocale());

  const activeItem = dashboardNavItems
    .filter((item) => item.href !== "/dashboard")
    .find(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
  const label = activeItem ? copy.nav[activeItem.navKey] : pathname;
  const isOverview = pathname === "/dashboard";

  return (
    <nav
      aria-label={copy.shell.breadcrumb}
      className="flex min-w-0 items-center gap-1.5 text-sm"
    >
      <Link
        href="/dashboard"
        className={cn(
          "flex shrink-0 items-center gap-1.5 transition-colors",
          isOverview
            ? "font-medium text-foreground"
            : "text-muted-foreground hover:text-primary",
        )}
      >
        <Home className="size-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{copy.shell.home}</span>
      </Link>
      {isOverview ? null : (
        <>
          <ChevronRight
            className="size-3.5 shrink-0 text-border"
            aria-hidden="true"
          />
          <span className="truncate font-medium text-foreground">{label}</span>
        </>
      )}
    </nav>
  );
}
