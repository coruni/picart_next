"use client";

import { cn } from "@/lib";
import { useLocale } from "next-intl";
import { getDashboardCopy } from "./copy";
import { getStatusClassName, getStatusLabel } from "./utils";

type DashboardStatusBadgeProps = {
  value?: string | boolean | null;
};

export function DashboardStatusBadge({ value }: DashboardStatusBadgeProps) {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);

  return (
    <span
      className={cn(
        "inline-flex min-w-18 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-medium",
        getStatusClassName(value),
      )}
    >
      {getStatusLabel(copy.status, value)}
    </span>
  );
}
