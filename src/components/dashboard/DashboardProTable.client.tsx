"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardDataPanel } from "./DashboardDataPanel";
import {
  DashboardTable,
  type DashboardTableColumn,
  type DashboardValueEnum,
  type ExpandableConfig,
} from "./DashboardTable";
import { DashboardTableToolbar } from "./DashboardTableToolbar.client";

type DashboardProTableRequestParams = {
  current: number;
  pageSize: number;
  [key: string]: string | number;
};

type DashboardProTableRequestResult<T> = {
  data: T[];
  total?: number;
  totalPages?: number;
  searchValueEnum?: Record<string, DashboardValueEnum>;
};

type DashboardProTableActionState<T> = {
  rows: T[];
  total: number;
  loading: boolean;
  error: boolean;
};

type DashboardProTableProps<T> = {
  title: string;
  action?:
    | React.ReactNode
    | ((state: DashboardProTableActionState<T>) => React.ReactNode);
  columns: DashboardTableColumn<T>[];
  expandable?: ExpandableConfig<T>;
  request?: (
    params: DashboardProTableRequestParams,
  ) => Promise<DashboardProTableRequestResult<T>>;
  data?: T[];
  total?: number;
  totalPages?: number;
  loading?: boolean;
  onReload?: () => void;
  getRowKey: (row: T) => string | number;
  emptyText: string;
  className?: string;
  enabled?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: Array<{ value: string; label: string }>;
};

function getInitialQueryValues<T>(columns: DashboardTableColumn<T>[]) {
  return columns.reduce<Record<string, string>>((result, column) => {
    if (column.dataIndex && !column.hideInSearch) {
      result[column.dataIndex] = "";
    }
    return result;
  }, {});
}

export function DashboardProTable<T>({
  title,
  action,
  columns,
  expandable,
  request,
  data,
  total: externalTotal,
  totalPages: externalTotalPages,
  loading: externalLoading,
  onReload,
  getRowKey,
  emptyText,
  className,
  enabled = true,
  initialPageSize = 20,
  pageSizeOptions = ["10", "20", "50"].map((value) => ({
    value,
    label: value,
  })),
}: DashboardProTableProps<T>) {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const isControlled = data !== undefined;
  const searchColumns = useMemo(
    () => columns.filter((column) => !column.hideInSearch && column.dataIndex),
    [columns],
  );
  const initialQueryValues = useMemo(
    () => getInitialQueryValues(columns),
    [columns],
  );
  const [density, setDensity] = useState<"default" | "middle" | "small">(
    "default",
  );
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<string[]>([]);
  const [draftQueryValues, setDraftQueryValues] =
    useState<Record<string, string>>(initialQueryValues);
  const [queryValues, setQueryValues] =
    useState<Record<string, string>>(initialQueryValues);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [internalRows, setInternalRows] = useState<T[]>([]);
  const [internalTotal, setInternalTotal] = useState(0);
  const [internalTotalPages, setInternalTotalPages] = useState(1);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchValueEnumMap, setSearchValueEnumMap] = useState<
    Record<string, DashboardValueEnum>
  >({});
  const [queryExpanded, setQueryExpanded] = useState(false);
  const [visibleSearchCount, setVisibleSearchCount] = useState(3);
  const requestRef = useRef(request);

  // 使用外部数据或内部数据
  const rows = isControlled ? data : internalRows;
  const total = isControlled ? (externalTotal ?? data.length) : internalTotal;
  const totalPages = isControlled
    ? (externalTotalPages ?? Math.max(1, Math.ceil(total / pageSize)))
    : internalTotalPages;
  const loading = isControlled ? (externalLoading ?? false) : internalLoading;

  const triggerReload = () => {
    if (onReload) {
      onReload();
    } else {
      setReloadKey((k) => k + 1);
    }
  };


  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  useEffect(() => {
    setDraftQueryValues(initialQueryValues);
    setQueryValues(initialQueryValues);
    setPage(1);
  }, [initialQueryValues]);

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenColumnKeys.includes(column.key)),
    [columns, hiddenColumnKeys],
  );

  useEffect(() => {
    const updateVisibleSearchCount = () => {
      if (window.innerWidth >= 1280) {
        setVisibleSearchCount(3);
        return;
      }

      if (window.innerWidth >= 768) {
        setVisibleSearchCount(2);
        return;
      }

      setVisibleSearchCount(1);
    };

    updateVisibleSearchCount();
    window.addEventListener("resize", updateVisibleSearchCount);

    return () => window.removeEventListener("resize", updateVisibleSearchCount);
  }, []);

  // 只在非受控模式下加载数据
  useEffect(() => {
    if (!enabled || isControlled) {
      return;
    }

    let mounted = true;

    async function loadRows() {
      setInternalLoading(true);
      setError(false);

      try {
        const result = await requestRef.current?.({
          current: page,
          pageSize,
          ...queryValues,
        });

        if (!mounted || !result) {
          return;
        }

        const nextTotal = result.total ?? result.data.length;
        const nextTotalPages =
          result.totalPages ?? Math.max(1, Math.ceil(nextTotal / pageSize));

        setInternalRows(result.data);
        setInternalTotal(nextTotal);
        setInternalTotalPages(nextTotalPages);
        setSearchValueEnumMap(result.searchValueEnum || {});
      } catch {
        if (mounted) {
          setError(true);
          setInternalRows([]);
          setInternalTotal(0);
          setInternalTotalPages(1);
        }
      } finally {
        if (mounted) {
          setInternalLoading(false);
        }
      }
    }

    void loadRows();

    return () => {
      mounted = false;
    };
  }, [enabled, isControlled, page, pageSize, queryValues, reloadKey]);

  const resolvedAction =
    typeof action === "function"
      ? action({
          rows,
          total,
          loading,
          error,
        })
      : action;

  const hasExpandableQuery = searchColumns.length > visibleSearchCount;
  const displayedSearchColumns =
    hasExpandableQuery && !queryExpanded
      ? searchColumns.slice(0, visibleSearchCount)
      : searchColumns;

  const query =
    searchColumns.length > 0 ? (
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {displayedSearchColumns.map((column) => {
            const key = column.dataIndex as string;
            const valueEnum = searchValueEnumMap[key] || column.valueEnum;

            if (column.valueType === "select" && valueEnum) {
              return (
                <Select
                  key={column.key}
                  value={draftQueryValues[key] || ""}
                  onChange={(value) =>
                    setDraftQueryValues((previous) => ({
                      ...previous,
                      [key]: value,
                    }))
                  }
                  options={Object.entries(valueEnum).map(([value, item]) => ({
                    value,
                    label: item.text,
                  }))}
                  placeholder={column.searchPlaceholder || column.header}
                  className="h-9"
                />
              );
            }

            return (
              <Input
                fullWidth
                key={column.key}
                value={draftQueryValues[key] || ""}
                onChange={(event) =>
                  setDraftQueryValues((previous) => ({
                    ...previous,
                    [key]: event.target.value,
                  }))
                }
                placeholder={column.searchPlaceholder || column.header}
                className="h-9 flex-1"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setPage(1);
                    setQueryValues(draftQueryValues);
                  }
                }}
              />
            );
          })}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 xl:pt-0.5">
          <button
            type="button"
            className="inline-flex h-7  items-center justify-center rounded-full border border-border/70 px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => {
              setDraftQueryValues(initialQueryValues);
              setQueryValues(initialQueryValues);
              setPage(1);
            }}
          >
            {copy.common.reset}
          </button>
          <button
            type="button"
            className="inline-flex h-7 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:opacity-90"
            onClick={() => {
              setPage(1);
              setQueryValues(draftQueryValues);
            }}
          >
            {copy.common.search}
          </button>
          {hasExpandableQuery ? (
            <button
              type="button"
              className="inline-flex h-7 items-center justify-center rounded-full px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/8"
              onClick={() => setQueryExpanded((value) => !value)}
              aria-expanded={queryExpanded}
            >
              {queryExpanded ? copy.common.collapse : copy.common.expand}
            </button>
          ) : null}
        </div>
      </div>
    ) : null;

  return (
    <DashboardDataPanel
      query={query}
      toolbar={
        <DashboardTableToolbar
          title={title}
          action={resolvedAction}
          columns={columns}
          hiddenColumnKeys={hiddenColumnKeys}
          onToggleColumn={(key) =>
            setHiddenColumnKeys((previous) =>
              previous.includes(key)
                ? previous.filter((item) => item !== key)
                : previous.length >= columns.length - 1
                  ? previous
                  : [...previous, key],
            )
          }
          density={density}
          onDensityChange={setDensity}
          onReload={triggerReload}
          labels={{
            refresh: copy.common.refresh,
            density: copy.common.density,
            columnSetting: copy.common.columnSetting,
            densityDefault: copy.common.densityDefault,
            densityMiddle: copy.common.densityMiddle,
            densitySmall: copy.common.densitySmall,
          }}
        />
      }
    >
      {error ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border/70 px-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="text-sm text-muted-foreground">
              {copy.common.noPermission}
            </div>
            <button
              type="button"
              className="inline-flex h-7 items-center justify-center rounded-full border border-border/70 px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setReloadKey((current) => current + 1)}
            >
              {copy.common.retry}
            </button>
          </div>
        </div>
      ) : (
        <DashboardTable
          rows={rows}
          columns={visibleColumns}
          getRowKey={getRowKey}
          emptyText={emptyText}
          className={className}
          loading={loading}
          loadingText={copy.common.loading}
          density={density}
          expandable={expandable}
          pagination={{
            page,
            totalPages,
            pageSize,
            total,
            pageSizeOptions,
            onPageSizeChange: (value) => {
              setPage(1);
              setPageSize(value);
            },
            onPrevious: () => setPage((current) => Math.max(1, current - 1)),
            onNext: () =>
              setPage((current) =>
                totalPages ? Math.min(totalPages, current + 1) : current + 1,
              ),
            previousDisabled: page <= 1,
            nextDisabled: page >= totalPages,
          }}
          paginationLabels={{
            page: copy.common.page,
            pageSize: copy.common.pageSize,
            previous: copy.common.previous,
            next: copy.common.next,
          }}
        />
      )}
    </DashboardDataPanel>
  );
}
