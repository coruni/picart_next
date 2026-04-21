"use client";

import { cn } from "@/lib";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type DashboardPanelProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  headerExtra?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  loading?: boolean;
};

export function DashboardPanel({
  title,
  description,
  action,
  headerExtra,
  className,
  headerClassName,
  contentClassName,
  children,
  collapsible = false,
  defaultCollapsed = false,
  loading = false,
}: DashboardPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm",
        "transition-all duration-200",
        "hover:border-border hover:shadow-md",
        className,
      )}
    >
      {headerExtra ? (
        <div
          className={cn(
            "border-b border-border/70 bg-card",
            headerClassName,
          )}
        >
          {headerExtra}
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center justify-between gap-4 border-b border-border/70 bg-card px-4 py-3.5",
            collapsible && "cursor-pointer hover:bg-muted/30",
            headerClassName,
          )}
          onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              {collapsible && (
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform duration-200",
                    isCollapsed && "-rotate-90",
                  )}
                />
              )}
            </div>
            {description ? (
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div
        className={cn(
          "transition-all duration-200 flex-1 flex-col flex min-h-0",
          isCollapsed ? "max-h-0 opacity-0" : "opacity-100",
        )}
      >
        <div className={cn("px-4 py-4", contentClassName)}>
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </section>
  );
}
