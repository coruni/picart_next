"use client";

import { articleControllerFindAll } from "@/api";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
import type { DashboardArticleItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardCount, formatDashboardDate } from "./utils";

export function DashboardArticlesPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const statusValueEnum = useMemo(
    () => ({
      DRAFT: { text: copy.status.DRAFT },
      PUBLISHED: { text: copy.status.PUBLISHED },
      PENDING: { text: copy.status.PENDING },
    }),
    [copy],
  );

  const columns = useMemo<DashboardTableColumn<DashboardArticleItem>[]>(
    () => [
      {
        key: "title",
        header: copy.columns.article,
        dataIndex: "title",
        searchPlaceholder: copy.filters.articleTitlePlaceholder,
        ellipsis: true,
        getTooltip: (item) => item.title,
        render: (item) => (
          <div className="min-w-0">
            <Link
              href={`/article/${item.id}`}
              className="block truncate text-sm font-medium text-foreground hover:text-primary"
            >
              {item.title}
            </Link>
            <div className="mt-1 text-xs text-muted-foreground">
              {formatDashboardDate(item.updatedAt)}
            </div>
          </div>
        ),
      },
      {
        key: "author",
        header: copy.columns.author,
        hideInSearch: true,
        render: (item) => (
          <div className="text-sm text-foreground">
            {item.author?.nickname || item.author?.username || "-"}
          </div>
        ),
      },
      {
        key: "category",
        header: copy.columns.category,
        hideInSearch: true,
        render: (item) => (
          <div className="text-sm text-muted-foreground">
            {item.category?.name || "-"}
          </div>
        ),
      },
      {
        key: "metrics",
        header: copy.columns.views,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>
              {copy.columns.views}:{" "}
              {formatDashboardCount(item.views || 0, locale)}
            </div>
            <div className="text-muted-foreground">
              {copy.columns.comments}:{" "}
              {formatDashboardCount(item.commentCount || 0, locale)}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: copy.columns.status,
        dataIndex: "status",
        valueType: "select",
        valueEnum: statusValueEnum,
        render: (item) => <DashboardStatusBadge value={item.status} />,
      },
    ],
    [copy, locale, statusValueEnum],
  );

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        title={copy.pages.articles.title}
        columns={columns}
        request={async ({ current, pageSize, ...rest }) => {
          const response = await articleControllerFindAll({
            query: {
              page: current,
              limit: pageSize,
              ...rest,
            },
          });

          return {
            data: response?.data?.data?.data || [],
            total: response?.data?.data?.meta?.total || 0,
            totalPages: response?.data?.data?.meta?.totalPages || 1,
          };
        }}
        getRowKey={(item) => item.id}
        emptyText={copy.empty.articles}
        className="h-full"
      />
    </DashboardPageFrame>
  );
}
