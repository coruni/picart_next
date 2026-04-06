"use client";

import {
  categoryControllerCreate,
  categoryControllerFindAll,
  categoryControllerRemove,
  categoryControllerUpdate,
} from "@/api";
import { DropdownMenu, type MenuItem } from "@/components/shared";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { MoreHorizontal, PencilLine, Plus, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import {
  DashboardEditDialog,
  type DashboardEditField,
} from "./DashboardEditDialog.client";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import type { DashboardTableColumn } from "./DashboardTable";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { DashboardCategoryItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardCount, formatDashboardDate } from "./utils";

export function DashboardCategoriesPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [editingItem, setEditingItem] = useState<DashboardCategoryItem | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [deletingItem, setDeletingItem] =
    useState<DashboardCategoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [allCategories, setAllCategories] = useState<DashboardCategoryItem[]>(
    [],
  );


  // 获取父分类选项
  const parentOptions = useMemo(() => {
    const options = [{ value: "0", label: "顶级分类" }];
    const addOptions = (cats: DashboardCategoryItem[]) => {
      for (const cat of cats) {
        options.push({ value: String(cat.id), label: cat.name });
        if (cat.children && cat.children.length > 0) {
          addOptions(cat.children as unknown as DashboardCategoryItem[]);
        }
      }
    };
    addOptions(allCategories);
    return options;
  }, [allCategories]);

  const editFields = useMemo<DashboardEditField[]>(
    () => [
      { name: "name", label: copy.columns.name },
      {
        name: "description",
        label: copy.columns.description,
        type: "textarea",
      },
      {
        name: "parentId",
        label: "父分类",
        type: "categorySelect",
        placeholder: "选择父分类",
      },
      {
        name: "avatar",
        label: "Avatar",
        type: "image",
        imagePreviewClassName: "aspect-square h-auto w-full max-w-52",
        imageObjectFit: "contain",
      },
      {
        name: "background",
        label: "Background",
        type: "image",
        imagePreviewClassName: "aspect-video h-auto w-full max-w-52",
        imageObjectFit: "cover",
      },
      {
        name: "cover",
        label: "Cover",
        type: "image",
        imagePreviewClassName: "aspect-video h-auto w-full max-w-52",
        imageObjectFit: "cover",
      },
      { name: "link", label: copy.columns.link },
      { name: "sort", label: copy.columns.sort, type: "number", step: 1 },
    ],
    [copy, parentOptions],
  );

  // 切换展开/收起
  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const columns = useMemo<DashboardTableColumn<DashboardCategoryItem>[]>(
    () => [
      {
        key: "name",
        header: copy.columns.name,
        dataIndex: "name",
        searchPlaceholder: copy.filters.categoryPlaceholder,
        render: (item) => {
          return (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                url={item.avatar || item.cover}
                className="size-10 shrink-0 rounded-xl"
              />
              <div className="min-w-0">
                <Link
                  href={`/channel/${item.id}`}
                  className="block truncate text-sm font-medium text-foreground hover:text-primary"
                >
                  {item.name}
                </Link>
                <div className="truncate text-xs text-muted-foreground">
                  {formatDashboardDate(item.createdAt)}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "description",
        header: copy.columns.description,
        hideInSearch: true,
        ellipsis: true,
        ellipsisClassName: "max-w-[240px]",
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
              {copy.columns.posts}:{" "}
              {formatDashboardCount(item.articleCount || 0, locale)}
            </div>
            <div className="text-muted-foreground">
              {copy.columns.followers}:{" "}
              {formatDashboardCount(item.followCount || 0, locale)}
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
        key: "status",
        header: copy.columns.status,
        hideInSearch: true,
        render: (item) => (
          <div className="text-sm text-muted-foreground">
            {item.status === "active"
              ? copy.status.active
              : copy.status.inactive}
          </div>
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
              onClick: () => setDeletingItem(item),
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

  const handleDelete = async () => {
    if (!deletingItem?.id) return;

    setDeleteLoading(true);
    try {
      await categoryControllerRemove({
        path: { id: String(deletingItem.id) },
      });
      setDeletingItem(null);
      setRefreshKey((current) => current + 1);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreate = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      await categoryControllerCreate({
        body: {
          name: values.name as string,
          description: (values.description as string) || undefined,
          parentId: values.parentId ? Number(values.parentId) : undefined,
          avatar: (values.avatar as string) || undefined,
          background: (values.background as string) || undefined,
          cover: (values.cover as string) || undefined,
          link: (values.link as string) || undefined,
          sort: (values.sort as number) || 0,
          status: "enabled",
        },
      });
      setCreating(false);
      setRefreshKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values: Record<string, unknown>) => {
    if (!editingItem) return;

    setSubmitting(true);
    try {
      await categoryControllerUpdate({
        path: { id: String(editingItem.id) },
        body: {
          name: values.name as string | undefined,
          description: (values.description as string) || undefined,
          parentId:
            values.parentId !== undefined ? Number(values.parentId) : undefined,
          avatar: (values.avatar as string) || undefined,
          background: (values.background as string) || undefined,
          cover: (values.cover as string) || undefined,
          link: (values.link as string) || undefined,
          sort: values.sort as number | undefined,
        },
      });
      setEditingItem(null);
      setRefreshKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        key={refreshKey}
        title={copy.pages.categories.title}
        action={
          <Button
            variant="primary"
            className="h-9 rounded-full px-4"
            onClick={() => setCreating(true)}
          >
            <Plus className="mr-2 size-4" />
            {copy.common.create}
          </Button>
        }
        columns={columns}
        request={async ({ current, pageSize, name }) => {
          const response = await categoryControllerFindAll({
            query: {
              page: current,
              limit: pageSize,
              name: typeof name === "string" && name ? name : undefined,
              parentId: 0,
              sortBy: "sort",
              sortOrder: "ASC",
            },
          });

          return {
            data: response?.data?.data?.data || [],
            total: response?.data?.data?.meta?.total || 0,
            totalPages: response?.data?.data?.meta?.totalPages || 1,
          };
        }}
        getRowKey={(item) => item.id}
        emptyText={copy.empty.categories}
        className="h-full"
        expandable={{
          expandedRowKeys: Array.from(expandedIds),
          rowExpandable: (item) =>
            !!(item.children && item.children.length > 0),
          onExpand: (expanded, item) => toggleExpand(item.id),
          expandedRowRender: (item) => {
            if (!item.children || item.children.length === 0) return null;
            return (
              <div className="pl-22">
                {item.children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-3 border-b border-border/30 py-3 last:border-b-0"
                  >
                    <Avatar
                      url={child.avatar || child.cover}
                      className="size-8 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/channel/${child.id}`}
                        className="block truncate text-sm font-medium text-foreground hover:text-primary"
                      >
                        {child.name}
                      </Link>
                      <div className="truncate text-xs text-muted-foreground">
                        {child.description || "-"}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {copy.columns.posts}: {child.articleCount || 0}
                    </div>
                    <DropdownMenu
                      title={copy.columns.action}
                      items={[
                        {
                          label: copy.common.edit,
                          icon: <PencilLine size={16} />,
                          onClick: () =>
                            setEditingItem(
                              child as unknown as DashboardCategoryItem,
                            ),
                        },
                        {
                          label: copy.common.delete,
                          icon: <Trash2 size={16} />,
                          className: "text-red-500",
                          onClick: () =>
                            setDeletingItem(
                              child as unknown as DashboardCategoryItem,
                            ),
                        },
                      ]}
                      trigger={
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      }
                    />
                  </div>
                ))}
              </div>
            );
          },
        }}
      />

      {/* Create Dialog */}
      <DashboardEditDialog
        open={creating}
        title={`${copy.common.create} · ${copy.pages.categories.title}`}
        fields={editFields}
        initialValues={{
          name: "",
          description: "",
          avatar: "",
          background: "",
          cover: "",
          link: "",
          sort: 0,
        }}
        loading={submitting}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
          }
        }}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      <DashboardEditDialog
        open={Boolean(editingItem)}
        title={`${copy.common.edit} · ${copy.pages.categories.title}`}
        fields={editFields}
        initialValues={{
          name: editingItem?.name,
          description: editingItem?.description,
          parentId: editingItem?.parentId ? String(editingItem.parentId) : "0",
          avatar: editingItem?.avatar,
          background: editingItem?.background,
          cover: editingItem?.cover,
          link: editingItem?.link,
          sort: editingItem?.sort,
        }}
        loading={submitting}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
          }
        }}
        onSubmit={handleUpdate}
      />

      <DeleteConfirmDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
        title={copy.common.delete}
        description={copy.common.deleteConfirm}
        onConfirm={handleDelete}
        loading={deleteLoading}
        confirmText={copy.common.delete}
        cancelText={copy.common.cancel}
      />
    </DashboardPageFrame>
  );
}
