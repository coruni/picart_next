"use client";

import { Select } from "@/components/ui/Select";
import { cn } from "@/lib";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";

const DEFAULT_ELLIPSIS_WIDTH_CLASS = "w-[420px] max-w-[420px]";

export type DashboardValueEnum = Record<string, { text: string }>;

export type DashboardTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  width?: number | string;
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

export type ExpandableConfig<T> = {
  expandedRowRender?: (row: T) => React.ReactNode;
  rowExpandable?: (row: T) => boolean;
  expandedRowKeys?: (string | number)[];
  onExpand?: (expanded: boolean, row: T) => void;
  expandIcon?: (props: {
    expanded: boolean;
    onExpand: () => void;
    record: T;
    expandable: boolean;
  }) => React.ReactNode;
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
  expandable?: ExpandableConfig<T>;
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
  expandable,
  pagination,
  paginationLabels,
}: DashboardTableProps<T>) {
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);

  // 内部管理展开状态（当外部没有提供时）
  const [internalExpandedKeys, setInternalExpandedKeys] = useState<
    Set<string | number>
  >(new Set());

  const expandedKeys = expandable?.expandedRowKeys
    ? new Set(expandable.expandedRowKeys)
    : internalExpandedKeys;

  const setExpandedKeys = (keys: Set<string | number>) => {
    if (!expandable?.expandedRowKeys) {
      setInternalExpandedKeys(keys);
    }
  };

  const toggleExpand = (row: T) => {
    const key = getRowKey(row);
    const isExpanded = expandedKeys.has(key);
    const newKeys = new Set(expandedKeys);

    if (isExpanded) {
      newKeys.delete(key);
    } else {
      newKeys.add(key);
    }

    setExpandedKeys(newKeys);
    expandable?.onExpand?.(!isExpanded, row);
  };

  const getEllipsisWidthClass = (column: DashboardTableColumn<T>) =>
    column.ellipsis
      ? column.ellipsisClassName || DEFAULT_ELLIPSIS_WIDTH_CLASS
      : undefined;

  const getColumnWidth = (column: DashboardTableColumn<T>) => {
    if (column.width !== undefined) {
      return typeof column.width === "number"
        ? { width: `${column.width}px` }
        : { width: column.width };
    }

    if (column.key === "action") {
      return { width: "84px" };
    }

    if (column.key === "status") {
      return { width: "120px" };
    }

    if (column.key === "updatedAt") {
      return { width: "132px" };
    }

    return undefined;
  };

  const isActionColumn = (column: DashboardTableColumn<T>) =>
    column.key === "action";

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

  // 默认展开图标
  const DefaultExpandIcon = ({
    expanded,
    onExpand,
    expandable,
  }: {
    expanded: boolean;
    onExpand: () => void;
    expandable: boolean;
  }) => {
    if (!expandable) {
      return <span className="inline-block w-6" />;
    }
    return (
      <button
        onClick={onExpand}
        className="inline-flex h-6 w-6 items-center justify-center rounded border border-border/70 text-muted-foreground hover:bg-muted"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
    );
  };

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col h-full overflow-hidden border border-border/70 bg-card ${className || ""}`}
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

      <div className="relative hidden min-h-0 flex-1 flex-col md:flex">
        <div className="flex-1 overflow-auto">
          <table className="min-w-full table-fixed border-separate border-spacing-0">
            <thead ref={theadRef} className="sticky top-0 z-10">
              <tr>
                {expandable && (
                  <th className="w-12 border-b border-border bg-card px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {/* 展开列 */}
                  </th>
                )}
                {columns.map((column) =>
                  (() => {
                    return (
                      <th
                        key={column.key}
                        style={getColumnWidth(column)}
                        className={cn(
                          "border-b border-border bg-card text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground",
                          cellPadding,
                          isActionColumn(column) && "text-right",
                          column.className,
                          getEllipsisWidthClass(column),
                        )}
                      >
                        {column.header}
                      </th>
                    );
                  })(),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowKey = getRowKey(row);
                const isExpanded = expandedKeys.has(rowKey);
                const isExpandable = expandable?.rowExpandable?.(row) ?? true;

                return (
                  <React.Fragment key={rowKey}>
                    <tr className="align-top transition-colors hover:bg-foreground/[0.02]">
                      {expandable && (
                        <td className="border-b border-border/70 px-3 py-3">
                          {expandable.expandIcon ? (
                            expandable.expandIcon({
                              expanded: isExpanded,
                              onExpand: () => toggleExpand(row),
                              record: row,
                              expandable: isExpandable,
                            })
                          ) : (
                            <DefaultExpandIcon
                              expanded={isExpanded}
                              onExpand={() => toggleExpand(row)}
                              expandable={isExpandable}
                            />
                          )}
                        </td>
                      )}
                      {columns.map((column) => {
                        return (
                          <td
                            key={column.key}
                            style={getColumnWidth(column)}
                            className={cn(
                              "border-b border-border/70 last:border-b-0",
                              cellPadding,
                              isActionColumn(column) &&
                                "[&>*]:ml-auto [&>*]:w-fit",
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
                    {expandable?.expandedRowRender && isExpanded && (
                      <tr className="bg-muted/30">
                        <td
                          colSpan={columns.length + 1}
                          className="border-b border-border/70 px-3 py-3"
                        >
                          {expandable.expandedRowRender(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && paginationLabels ? (
        <div
          ref={footerRef}
          className="shrink-0 border-t border-border px-3 py-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>{paginationLabels.pageSize}</span>
                <div className="w-20 shrink-0">
                  <Select
                    value={String(pagination.pageSize)}
                    onChange={(value) =>
                      pagination.onPageSizeChange(Number(value))
                    }
                    options={pagination.pageSizeOptions}
                    className="h-8"
                    dropdownPlacement="top"
                  />
                </div>
              </div>
            </div>
            <div className="flex w-full flex-1 items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-7 truncate rounded-full"
                disabled={pagination.previousDisabled}
                onClick={pagination.onPrevious}
              >
                {paginationLabels.previous}
              </Button>
              <div className="text-secondary text-xs truncate">
                {paginationLabels.page
                  .replace("{page}", String(pagination.page))
                  .replace("{totalPages}", String(pagination.totalPages))}
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-7 truncate rounded-full"
                onClick={pagination.onNext}
              >
                {paginationLabels.next}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
