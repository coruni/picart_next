"use client";

import { articleControllerFindAll, articleControllerRemove } from "@/api";
import { DropdownMenu, type MenuItem } from "@/components/shared";
import { Link, useRouter } from "@/i18n/routing";
import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
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
  const router = useRouter();
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [refreshKey, setRefreshKey] = useState(0);
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
      {
        key: "action",
        header: copy.columns.action,
        hideInSearch: true,
        render: (item) => {
          const menuItems: MenuItem[] = [
            {
              label: copy.common.edit,
              icon: <PencilLine size={16} />,
              onClick: () => {
                router.push(
                  item.type === "image"
                    ? `/create/image?articleId=${item.id}`
                    : `/create/post?articleId=${item.id}`,
                );
              },
            },
            {
              label: copy.common.delete,
              icon: <Trash2 size={16} />,
              className: "text-red-500",
              confirmDialog: {
                enabled: true,
                title: copy.common.delete,
                description: copy.common.deleteConfirm,
                confirmText: copy.common.delete,
                cancelText: copy.common.cancel,
              },
              onClick: async () => {
                await articleControllerRemove({
                  path: { id: String(item.id) },
                });
                setRefreshKey((current) => current + 1);
              },
            },
          ];

          return (
            <DropdownMenu
              title={copy.columns.action}
              items={menuItems}
              trigger={
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <MoreHorizontal size={16} />
                </button>
              }
              className="inline-flex"
              menuClassName="top-8"
            />
          );
        },
      },
    ],
    [copy, locale, router, statusValueEnum],
  );

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        key={refreshKey}
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
