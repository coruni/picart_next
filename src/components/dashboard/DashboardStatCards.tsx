"use client";

import { cn } from "@/lib";
import type { LucideIcon } from "lucide-react";
import { formatDashboardCount } from "./utils";

type DashboardStatCardsProps = {
  items: Array<{
    key: string;
    label: string;
    value: number;
    description?: string;
    icon: LucideIcon;
    accent: string;
    trend?: {
      value: number;
      positive: boolean;
    };
  }>;
  locale?: string;
};

export function DashboardStatCards({
  items,
  locale,
}: DashboardStatCardsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-2">
      {items.map((item, index) => {
        const Icon = item.icon;
        const displayValue = formatDashboardCount(item.value, locale);

        return (
          <article
            key={item.key}
            className={cn(
              "group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm",
              "transition-all duration-200",
              "hover:shadow-md hover:border-primary/20",
              "focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-2",
            )}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {/* 渐变背景装饰 */}
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b opacity-60",
                item.accent,
              )}
            />

            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    {item.label}
                  </p>
                  {item.trend && (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        item.trend.positive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
                      )}
                    >
                      {item.trend.positive ? "+" : ""}
                      {item.trend.value}%
                    </span>
                  )}
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {displayValue}
                </p>
                {item.description ? (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  "border border-border/80 bg-background/80",
                  "shadow-sm transition-colors duration-200",
                  "group-hover:border-primary/30 group-hover:bg-primary/5",
                )}
              >
                <Icon className="size-5 text-foreground/80" />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
