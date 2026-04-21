"use client";

import { cn } from "@/lib";
import { useLocale } from "next-intl";
import { getDashboardCopy } from "./copy";
import { getStatusClassName, getStatusLabel } from "./utils";

type DashboardStatusBadgeProps = {
  value?: string | boolean | null;
  size?: "sm" | "md" | "lg";
};

export function DashboardStatusBadge({ value, size = "md" }: DashboardStatusBadgeProps) {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);

  const sizeClasses = {
    sm: "min-w-14 px-2 py-0.5 text-[10px]",
    md: "min-w-18 px-2.5 py-1 text-xs",
    lg: "min-w-20 px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-medium",
        sizeClasses[size],
        getStatusClassName(value),
      )}
    >
      {getStatusLabel(copy.status, value)}
    </span>
  );
}
