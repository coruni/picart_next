"use client";

import { cn } from "@/lib";

type DashboardTableSearchProps = {
  children: React.ReactNode;
};

export function DashboardTableSearch({
  children,
}: DashboardTableSearchProps) {
  return (
    <div className={cn("border-b border-border px-3 py-3")}>{children}</div>
  );
}
