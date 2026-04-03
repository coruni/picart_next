"use client";

import { tagControllerFindAll, tagControllerRemove, tagControllerUpdate } from "@/api";
import { DropdownMenu, type MenuItem } from "@/components/shared";
import { Avatar } from "@/components/ui/Avatar";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardEditDialog, type DashboardEditField } from "./DashboardEditDialog.client";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import type { DashboardTableColumn } from "./DashboardTable";
import type { DashboardTagItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import {
  formatDashboardCount,
  formatDashboardDate,
} from "./utils";

export function DashboardTagsPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [editingItem, setEditingItem] = useState<DashboardTagItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const editFields = useMemo<DashboardEditField[]>(
    () => [
      { name: "name", label: copy.columns.name },
      { name: "description", label: copy.columns.description, type: "textarea" },
      { name: "avatar", label: "Avatar", type: "image" },
      { name: "background", label: "Background", type: "image" },
      { name: "cover", label: "Cover", type: "image" },
      { name: "sort", label: copy.columns.sort, type: "number", step: 1 },
    ],
    [copy],
  );

  const columns = useMemo<DashboardTableColumn<DashboardTagItem>[]>(
    () => [
      {
        key: "name",
        header: copy.columns.name,
        dataIndex: "name",
        searchPlaceholder: copy.filters.tagNamePlaceholder,
        render: (item) => (
          <Link href={`/topic/${item.id}`} className="flex min-w-0 items-center gap-3">
            <Avatar url={item.avatar || item.cover} className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {item.name}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {formatDashboardDate(item.createdAt)}
              </div>
            </div>
          </Link>
        ),
      },
      {
        key: "description",
        header: copy.columns.description,
        hideInSearch: true,
        ellipsis: true,
        ellipsisClassName: "max-w-[360px]",
        getTooltip: (item) => item.description || undefined,
        render: (item) => (
          <div className="truncate text-sm text-muted-foreground">
            {item.description || "-"}
          </div>
        ),
      },
      {
        key: "count",
        header: copy.columns.count,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>
              {copy.columns.posts}: {formatDashboardCount(item.articleCount || 0, locale)}
            </div>
            <div className="text-muted-foreground">
              {copy.columns.followers}: {formatDashboardCount(item.followCount || 0, locale)}
            </div>
          </div>
        ),
      },
      {
        key: "sort",
        header: copy.columns.sort,
        hideInSearch: true,
        render: (item) => (
          <div className="text-sm text-muted-foreground">{item.sort ?? 0}</div>
        ),
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
                await tagControllerRemove({
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
        title={copy.pages.tags.title}
        columns={columns}
        request={async ({ current, pageSize, name }) => {
          const response = await tagControllerFindAll({
            query: {
              page: current,
              limit: pageSize,
              name: typeof name === "string" && name ? name : undefined,
              sortBy: "createdAt",
              sortOrder: "DESC",
            },
          });

          return {
            data: response?.data?.data?.data || [],
            total: response?.data?.data?.meta?.total || 0,
            totalPages: response?.data?.data?.meta?.totalPages || 1,
          };
        }}
        getRowKey={(item) => item.id}
        emptyText={copy.empty.tags}
        className="h-full"
      />
      <DashboardEditDialog
        open={Boolean(editingItem)}
        title={`${copy.common.edit} · ${copy.pages.tags.title}`}
        fields={editFields}
        initialValues={{
          name: editingItem?.name,
          description: editingItem?.description,
          avatar: editingItem?.avatar,
          background: editingItem?.background,
          cover: editingItem?.cover,
          sort: editingItem?.sort,
        }}
        loading={submitting}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
          }
        }}
        onSubmit={async (values) => {
          if (!editingItem) {
            return;
          }

          setSubmitting(true);

          try {
            await tagControllerUpdate({
              path: { id: String(editingItem.id) },
              body: {
                name: values.name as string | undefined,
                description: values.description as string | undefined,
                avatar: values.avatar as string | undefined,
                background: values.background as string | undefined,
                cover: values.cover as string | undefined,
                sort: values.sort as number | undefined,
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
