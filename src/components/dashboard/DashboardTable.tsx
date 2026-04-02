"use client";

import { cn } from "@/lib";
import { Select } from "@/components/ui/Select";
import { useEffect, useRef, useState } from "react";

const DEFAULT_ELLIPSIS_WIDTH_CLASS = "w-[420px] max-w-[420px]";

export type DashboardValueEnum = Record<string, { text: string }>;

export type DashboardTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
  dataIndex?: string;
  hideInSearch?: boolean;
  valueType?: "text" | "select";
  valueEnum?: DashboardValueEnum;
  searchPlaceholder?: string;
  ellipsis?: boolean;
  ellipsisClassName?: string;
  getTooltip?: (row: T) => string | undefined;
};

type DashboardTableProps<T> = {
  rows: T[];
  columns: DashboardTableColumn<T>[];
  getRowKey: (row: T) => string | number;
  emptyText: string;
  className?: string;
  loading?: boolean;
  loadingText?: string;
  density?: "default" | "middle" | "small";
  pagination?: {
    page: number;
    totalPages: number;
    pageSize: number;
    total?: number;
    pageSizeOptions: Array<{ value: string; label: string }>;
    onPageSizeChange: (value: number) => void;
    onPrevious: () => void;
    onNext: () => void;
    previousDisabled?: boolean;
    nextDisabled?: boolean;
  };
  paginationLabels?: {
    page: string;
    pageSize: string;
    previous: string;
    next: string;
  };
};

export function DashboardTable<T>({
  rows,
  columns,
  getRowKey,
  emptyText,
  className,
  loading = false,
  loadingText,
  density = "default",
  pagination,
  paginationLabels,
}: DashboardTableProps<T>) {
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const getEllipsisWidthClass = (column: DashboardTableColumn<T>) =>
    column.ellipsis
      ? column.ellipsisClassName || DEFAULT_ELLIPSIS_WIDTH_CLASS
      : undefined;

  const cellPadding =
    density === "small"
      ? "px-3 py-2"
      : density === "middle"
        ? "px-3 py-2.5"
        : "px-3 py-3";

  useEffect(() => {
    const headElement = theadRef.current;
    const footerElement = footerRef.current;

    if (!headElement) {
      return;
    }

    const updateLayoutHeights = () => {
      setHeaderHeight(headElement.getBoundingClientRect().height);
      setFooterHeight(footerElement?.getBoundingClientRect().height || 0);
    };

    updateLayoutHeights();

    const observer = new ResizeObserver(() => updateLayoutHeights());
    observer.observe(headElement);
    if (footerElement) {
      observer.observe(footerElement);
    }

    return () => observer.disconnect();
  }, [columns, density, pagination]);

  if (!rows.length) {
    return (
      <div
        className={`relative flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border/70 px-4 text-sm text-muted-foreground ${className || ""}`}
      >
        {loading ? loadingText || emptyText : emptyText}
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden border border-border/70 bg-card ${className || ""}`}
    >
      {loading ? (
        <>
          <div
            className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-center bg-card/72 backdrop-blur-[2px] md:hidden"
            style={{ bottom: footerHeight }}
          >
            <div className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm text-muted-foreground">
              {loadingText || emptyText}
            </div>
          </div>
          <div
            className="absolute inset-x-0 z-30 hidden items-center justify-center bg-card/72 backdrop-blur-[2px] md:flex"
            style={{ top: headerHeight, bottom: footerHeight }}
          >
            <div className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm text-muted-foreground">
              {loadingText || emptyText}
            </div>
          </div>
        </>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto md:hidden">
        <div className="space-y-3 p-3">
          {rows.map((row) => (
            <article
              key={getRowKey(row)}
              className="rounded-xl border border-border/70 bg-card p-3"
            >
              <div className="min-w-0">
                {columns[0] ? columns[0].render(row) : null}
              </div>
              {columns.slice(1).length > 0 ? (
                <div className="mt-3 space-y-2 border-t border-border/70 pt-3">
                  {columns.slice(1).map((column) => (
                    <div
                      key={column.key}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {column.header}
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        {column.ellipsis ? (
                          <div
                            className="ml-auto min-w-0 max-w-full overflow-hidden"
                            title={column.getTooltip?.(row)}
                          >
                            {column.render(row)}
                          </div>
                        ) : (
                          column.render(row)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <div className="relative hidden min-h-0 flex-1 overflow-auto md:block">
        <table className="min-w-full table-fixed border-separate border-spacing-0">
          <thead ref={theadRef}>
            <tr>
              {columns.map((column) => (
                (() => {
                  return (
                <th
                  key={column.key}
                  className={cn(
                    "sticky top-0 z-10 border-b border-border bg-card text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground",
                    cellPadding,
                    column.className,
                    getEllipsisWidthClass(column),
                  )}
                >
                  {column.header}
                </th>
                  );
                })()
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="align-top transition-colors hover:bg-foreground/[0.02]"
              >
                {columns.map((column) => {
                  return (
                  <td
                    key={column.key}
                    className={cn(
                      "border-b border-border/70 last:border-b-0",
                      cellPadding,
                      column.className,
                      getEllipsisWidthClass(column),
                    )}
                  >
                    {column.ellipsis ? (
                      <div
                        className="min-w-0 max-w-full overflow-hidden"
                        title={column.getTooltip?.(row)}
                      >
                        {column.render(row)}
                      </div>
                    ) : (
                      column.render(row)
                    )}
                  </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && paginationLabels ? (
        <div ref={footerRef} className="shrink-0 border-t border-border px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>{paginationLabels.pageSize}</span>
                <div className="w-20 shrink-0">
                  <Select
                    value={String(pagination.pageSize)}
                    onChange={(value) => pagination.onPageSizeChange(Number(value))}
                    options={pagination.pageSizeOptions}
                    className="h-8"
                    dropdownPlacement="top"
                  />
                </div>
              </div>
              <span>
                {paginationLabels.page
                  .replace("{page}", String(pagination.page))
                  .replace("{totalPages}", String(pagination.totalPages))}
              </span>
              {typeof pagination.total === "number" ? (
                <span>{pagination.total}</span>
              ) : null}
            </div>
            <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-auto">
              <button
                type="button"
                className="inline-flex h-8 flex-1 items-center justify-center rounded-full border border-border/70 px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                disabled={pagination.previousDisabled}
                onClick={pagination.onPrevious}
              >
                {paginationLabels.previous}
              </button>
              <button
                type="button"
                className="inline-flex h-8 flex-1 items-center justify-center rounded-full border border-border/70 px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                disabled={pagination.nextDisabled}
                onClick={pagination.onNext}
              >
                {paginationLabels.next}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
