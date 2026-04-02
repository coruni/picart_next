"use client";

import { cn } from "@/lib";
import { Columns3, RefreshCw, Rows3, Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DashboardTableColumn } from "./DashboardTable";

type DashboardDensity = "default" | "middle" | "small";

type DashboardTableToolbarProps<T> = {
  title: string;
  action?: React.ReactNode;
  columns: DashboardTableColumn<T>[];
  hiddenColumnKeys: string[];
  onToggleColumn: (key: string) => void;
  density: DashboardDensity;
  onDensityChange: (density: DashboardDensity) => void;
  onReload?: () => void;
  labels: {
    refresh: string;
    density: string;
    columnSetting: string;
    densityDefault: string;
    densityMiddle: string;
    densitySmall: string;
  };
};

export function DashboardTableToolbar<T>({
  title,
  action,
  columns,
  hiddenColumnKeys,
  onToggleColumn,
  density,
  onDensityChange,
  onReload,
  labels,
}: DashboardTableToolbarProps<T>) {
  const [densityOpen, setDensityOpen] = useState(false);
  const [columnOpen, setColumnOpen] = useState(false);
  const densityRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (densityRef.current && !densityRef.current.contains(target)) {
        setDensityOpen(false);
      }
      if (columnRef.current && !columnRef.current.contains(target)) {
        setColumnOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const densityOptions = [
    { value: "default" as const, label: labels.densityDefault },
    { value: "middle" as const, label: labels.densityMiddle },
    { value: "small" as const, label: labels.densitySmall },
  ];

  const toolButtonClass =
    "inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground";

  return (
    <div className="flex items-center justify-between gap-3  px-3 py-2.5">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="flex items-center gap-1.5">
        {action}

        <button
          type="button"
          className={toolButtonClass}
          onClick={onReload}
          aria-label={labels.refresh}
          title={labels.refresh}
        >
          <RefreshCw className="size-4" />
        </button>

        <div ref={densityRef} className="relative">
          <button
            type="button"
            className={toolButtonClass}
            onClick={() => setDensityOpen((value) => !value)}
            aria-label={labels.density}
            title={labels.density}
          >
            <Rows3 className="size-4" />
          </button>

          {densityOpen ? (
            <div className="absolute right-0 top-full z-20 mt-1 w-28 rounded-lg border border-border bg-card p-1 shadow-sm">
              {densityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center rounded-md px-2 py-1.5 text-xs text-left transition-colors hover:bg-foreground/[0.04]",
                    density === option.value && "text-primary",
                  )}
                  onClick={() => {
                    onDensityChange(option.value);
                    setDensityOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div ref={columnRef} className="relative">
          <button
            type="button"
            className={toolButtonClass}
            onClick={() => setColumnOpen((value) => !value)}
            aria-label={labels.columnSetting}
            title={labels.columnSetting}
          >
            <Settings2 className="size-4" />
          </button>

          {columnOpen ? (
            <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-card p-1 shadow-sm">
              {columns.map((column) => {
                const hidden = hiddenColumnKeys.includes(column.key);
                return (
                  <button
                    key={column.key}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left transition-colors hover:bg-foreground/[0.04]"
                    onClick={() => onToggleColumn(column.key)}
                  >
                    <Columns3 className={cn("size-3.5", hidden && "opacity-40")} />
                    <span className={cn(hidden && "text-muted-foreground line-through")}>
                      {column.header}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
