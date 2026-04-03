"use client";

import { commentControllerFindAllComments, commentControllerRemove, commentControllerUpdate } from "@/api";
import { DropdownMenu, type MenuItem } from "@/components/shared";
import { Link } from "@/i18n/routing";
import { prepareCommentHtmlForDisplay } from "@/lib";
import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardEditDialog, type DashboardEditField } from "./DashboardEditDialog.client";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
import type { DashboardCommentItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardCount, formatDashboardDate } from "./utils";

export function DashboardCommentsPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [editingItem, setEditingItem] = useState<DashboardCommentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const editFields = useMemo<DashboardEditField[]>(
    () => [{ name: "content", label: copy.columns.content, type: "textarea" }],
    [copy],
  );

  const columns = useMemo<DashboardTableColumn<DashboardCommentItem>[]>(
    () => [
      {
        key: "content",
        header: copy.columns.content,
        dataIndex: "keyword",
        searchPlaceholder: copy.filters.commentPlaceholder,
        render: (item) => {
          const contentHtml = prepareCommentHtmlForDisplay(
            String(item.content || ""),
          );

          return (
            <div className="min-w-0">
              <div
                className="line-clamp-3 overflow-hidden text-sm text-foreground [&_p]:m-0 [&_span]:align-middle [&_img]:inline-block [&_img]:align-middle"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDashboardDate(item.createdAt)}
              </div>
            </div>
          );
        },
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
        key: "article",
        header: copy.columns.sourceArticle,
        hideInSearch: true,
        ellipsis: true,
        ellipsisClassName: "max-w-[320px]",
        getTooltip: (item) => item.article?.title || undefined,
        render: (item) => (
          <Link
            href={item.article?.id ? `/article/${item.article.id}` : "/"}
            className="block truncate text-sm text-foreground hover:text-primary"
          >
            {item.article?.title || "-"}
          </Link>
        ),
      },
      {
        key: "metrics",
        header: copy.columns.likes,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>
              {copy.columns.likes}: {formatDashboardCount(item.likes || 0, locale)}
            </div>
            <div className="text-muted-foreground">
              {copy.columns.replies}:{" "}
              {formatDashboardCount(item.replyCount || 0, locale)}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: copy.columns.status,
        hideInSearch: true,
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
              onClick: () => setEditingItem(item),
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
                await commentControllerRemove({
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
    [copy, locale],
  );

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        key={refreshKey}
        title={copy.pages.comments.title}
        columns={columns}
        request={async ({ current, pageSize, keyword }) => {
          const keywordValue = typeof keyword === "string" ? keyword : "";

          const response = await commentControllerFindAllComments({
            query: {
              page: current,
              limit: pageSize,
              keyword: keywordValue || undefined,
            },
          });

          return {
            data: response?.data?.data?.data || [],
            total: response?.data?.data?.meta?.total || 0,
            totalPages: response?.data?.data?.meta?.totalPages || 1,
          };
        }}
        getRowKey={(item) => item.id}
        emptyText={copy.empty.comments}
        className="h-full"
      />
      <DashboardEditDialog
        open={Boolean(editingItem)}
        title={`${copy.common.edit} ${copy.pages.comments.title}`}
        fields={editFields}
        initialValues={{
          content: editingItem?.content,
        }}
        loading={submitting}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
          }
        }}
        onSubmit={async (values) => {
          if (!editingItem?.id) {
            return;
          }

          setSubmitting(true);

          try {
            await commentControllerUpdate({
              path: { id: String(editingItem.id) },
              body: {
                content: values.content as string | undefined,
              },
            });
            setEditingItem(null);
            setRefreshKey((current) => current + 1);
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </DashboardPageFrame>
  );
}
