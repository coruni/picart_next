"use client";

import {
    pointsControllerCreateActivity,
    pointsControllerFindAllActivities,
    pointsControllerRemoveActivity,
    pointsControllerUpdateActivity,
} from "@/api";
import { DropdownMenu, type MenuItem } from "@/components/shared";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
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
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn, DashboardValueEnum } from "./DashboardTable";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { DashboardPointsActivityItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardDate } from "./utils";

const ACTIVITY_TYPE_OPTIONS = [
  { value: "INSTANT", label: "INSTANT" },
  { value: "DAILY", label: "DAILY" },
  { value: "WEEKLY", label: "WEEKLY" },
  { value: "MONTHLY", label: "MONTHLY" },
  { value: "ONCE", label: "ONCE" },
] as const;

const ACTIVITY_CODE_OPTIONS = [
  { value: "PUBLISH_ARTICLE", copyKey: "PUBLISH_ARTICLE" },
  { value: "LIKE_ARTICLE", copyKey: "LIKE_ARTICLE" },
  { value: "PUBLISH_COMMENT", copyKey: "PUBLISH_COMMENT" },
  { value: "LIKE_COMMENT", copyKey: "LIKE_COMMENT" },
  { value: "DAILY_LOGIN", copyKey: "DAILY_LOGIN" },
  { value: "ARTICLE_RECEIVED_LIKE", copyKey: "ARTICLE_RECEIVED_LIKE" },
  { value: "COMMENT_RECEIVED_LIKE", copyKey: "COMMENT_RECEIVED_LIKE" },
  { value: "ARTICLE_RECEIVED_COMMENT", copyKey: "ARTICLE_RECEIVED_COMMENT" },
] as const;

function sortActivities(items: DashboardPointsActivityItem[]) {
  return [...items].sort((left, right) => {
    const sortDiff = (left.sort ?? 0) - (right.sort ?? 0);
    if (sortDiff !== 0) {
      return sortDiff;
    }

    return (right.id ?? 0) - (left.id ?? 0);
  });
}

export function DashboardPointsPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [creating, setCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<DashboardPointsActivityItem | null>(
    null,
  );
  const [deletingItem, setDeletingItem] = useState<DashboardPointsActivityItem | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const activityCodeOptions = useMemo(
    () =>
      ACTIVITY_CODE_OPTIONS.map((option) => ({
        value: option.value,
        label: copy.pages.points.activityCodes[option.copyKey],
      })),
    [copy],
  );

  const editFields = useMemo<DashboardEditField[]>(
    () => [
      {
        name: "code",
        label: copy.columns.code,
        type: "select",
        options: (() => {
          if (!editingItem?.code) {
            return activityCodeOptions;
          }

          return activityCodeOptions.some(
            (option) => option.value === editingItem.code,
          )
            ? activityCodeOptions
            : [
                { value: editingItem.code, label: editingItem.code },
                ...activityCodeOptions,
              ];
        })(),
      },
      { name: "name", label: copy.columns.name },
      {
        name: "description",
        label: copy.columns.description,
        type: "textarea",
      },
      {
        name: "type",
        label: copy.columns.type,
        type: "select",
        options: [
          { value: "INSTANT", label: copy.options.activityType.INSTANT },
          { value: "DAILY", label: copy.options.activityType.DAILY },
          { value: "WEEKLY", label: copy.options.activityType.WEEKLY },
          { value: "MONTHLY", label: copy.options.activityType.MONTHLY },
          { value: "ONCE", label: copy.options.activityType.ONCE },
        ],
      },
      {
        name: "rewardPoints",
        label: copy.columns.rewardPoints,
        type: "number",
        min: 0,
        step: 1,
      },
      {
        name: "targetCount",
        label: copy.columns.targetCount,
        type: "number",
        min: 0,
        step: 1,
      },
      {
        name: "dailyLimit",
        label: copy.columns.dailyLimit,
        type: "number",
        min: 0,
        step: 1,
      },
      {
        name: "totalLimit",
        label: copy.columns.totalLimit,
        type: "number",
        min: 0,
        step: 1,
      },
      {
        name: "validDays",
        label: copy.columns.validDays,
        type: "number",
        min: 0,
        step: 1,
      },
      {
        name: "icon",
        label: copy.fields.icon,
        type: "image",
        imagePreviewClassName: "aspect-square h-auto w-full max-w-52",
        imageObjectFit: "contain",
      },
      { name: "link", label: copy.columns.link },
      { name: "isActive", label: copy.columns.enabled, type: "switch" },
      { name: "sort", label: copy.columns.sort, type: "number", step: 1 },
    ],
    [activityCodeOptions, copy, editingItem?.code],
  );

  const typeValueEnum: DashboardValueEnum = {
    "": { text: copy.common.all },
    INSTANT: { text: copy.options.activityType.INSTANT },
    DAILY: { text: copy.options.activityType.DAILY },
    WEEKLY: { text: copy.options.activityType.WEEKLY },
    MONTHLY: { text: copy.options.activityType.MONTHLY },
    ONCE: { text: copy.options.activityType.ONCE },
  };

  const activeValueEnum: DashboardValueEnum = {
    "": { text: copy.common.all },
    true: { text: copy.status.active },
    false: { text: copy.status.inactive },
  };

  const columns = useMemo<DashboardTableColumn<DashboardPointsActivityItem>[]>(
    () => [
      {
        key: "name",
        header: copy.columns.name,
        dataIndex: "keyword",
        searchPlaceholder: copy.filters.pointsPlaceholder,
        render: (item) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-card">
              {item.icon ? (
                <ImageWithFallback
                  src={item.icon}
                  alt={item.name || "points"}
                  fill
                  className="object-contain p-2"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {item.name || "-"}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {item.code || "-"}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "type",
        header: copy.columns.type,
        dataIndex: "type",
        valueType: "select",
        valueEnum: typeValueEnum,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>{item.type || "-"}</div>
            <div className="truncate text-xs text-muted-foreground">
              {item.description || "-"}
            </div>
          </div>
        ),
      },
      {
        key: "reward",
        header: copy.columns.rewardPoints,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>
              {copy.columns.rewardPoints}: {item.rewardPoints ?? 0}
            </div>
            <div className="text-muted-foreground">
              {copy.columns.targetCount}: {item.targetCount ?? 0}
            </div>
          </div>
        ),
      },
      {
        key: "limit",
        header: copy.columns.count,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>
              {copy.columns.dailyLimit}: {item.dailyLimit ?? 0}
            </div>
            <div className="text-muted-foreground">
              {copy.columns.totalLimit}: {item.totalLimit ?? 0}
            </div>
            <div className="text-muted-foreground">
              {copy.columns.validDays}: {item.validDays ?? 0}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: copy.columns.status,
        dataIndex: "isActive",
        valueType: "select",
        valueEnum: activeValueEnum,
        render: (item) => (
          <div className="space-y-1">
            <DashboardStatusBadge value={item.isActive ? "active" : "inactive"} />
            <div className="text-xs text-muted-foreground">
              {formatDashboardDate(item.updatedAt)}
            </div>
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
    [activeValueEnum, copy, typeValueEnum],
  );

  const handleCreate = async (values: Record<string, unknown>) => {
    setSubmitting(true);

    try {
      await pointsControllerCreateActivity({
        body: {
          code: values.code as string,
          name: values.name as string,
          description: values.description as string | undefined,
          type: values.type as "INSTANT" | "DAILY" | "WEEKLY" | "MONTHLY" | "ONCE",
          rewardPoints: (values.rewardPoints as number | undefined) ?? 0,
          targetCount: values.targetCount as number | undefined,
          dailyLimit: values.dailyLimit as number | undefined,
          totalLimit: values.totalLimit as number | undefined,
          validDays: values.validDays as number | undefined,
          icon: values.icon as string | undefined,
          link: values.link as string | undefined,
          isActive: values.isActive as boolean | undefined,
          sort: values.sort as number | undefined,
        },
      });
      setCreating(false);
      setRefreshKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values: Record<string, unknown>) => {
    if (!editingItem?.id) {
      return;
    }

    setSubmitting(true);

    try {
      await pointsControllerUpdateActivity({
        path: { id: String(editingItem.id) },
        body: {
          code: values.code as string | undefined,
          name: values.name as string | undefined,
          description: values.description as string | undefined,
          type: values.type as
            | "INSTANT"
            | "DAILY"
            | "WEEKLY"
            | "MONTHLY"
            | "ONCE"
            | undefined,
          rewardPoints: values.rewardPoints as number | undefined,
          targetCount: values.targetCount as number | undefined,
          dailyLimit: values.dailyLimit as number | undefined,
          totalLimit: values.totalLimit as number | undefined,
          validDays: values.validDays as number | undefined,
          icon: values.icon as string | undefined,
          link: values.link as string | undefined,
          isActive: values.isActive as boolean | undefined,
          sort: values.sort as number | undefined,
        },
      });
      setEditingItem(null);
      setRefreshKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem?.id) {
      return;
    }

    setDeleteLoading(true);

    try {
      await pointsControllerRemoveActivity({
        path: { id: String(deletingItem.id) },
      });
      setDeletingItem(null);
      setRefreshKey((current) => current + 1);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        key={refreshKey}
        title={copy.pages.points.title}
        action={
          <Button
            variant="primary"
            className="h-7 rounded-full px-2"
            onClick={() => setCreating(true)}
          >
            <Plus className="mr-2 size-4" />
            {copy.common.create}
          </Button>
        }
        columns={columns}
        request={async ({ current, pageSize, keyword, type, isActive }) => {
          const response = await pointsControllerFindAllActivities({
            query: {
              keyword: typeof keyword === "string" ? keyword : "",
              type: typeof type === "string" ? type : "",
            },
          });

          const rows = sortActivities(response?.data?.data || []).filter((item) => {
            if (isActive === "true") {
              return item.isActive;
            }

            if (isActive === "false") {
              return !item.isActive;
            }

            return true;
          });
          const start = (current - 1) * pageSize;

          return {
            data: rows.slice(start, start + pageSize),
            total: rows.length,
            totalPages: Math.max(1, Math.ceil(rows.length / pageSize)),
          };
        }}
        getRowKey={(item) => item.id}
        emptyText={copy.common.noData}
        className="h-full"
      />

      <DashboardEditDialog
        open={creating}
        title={`${copy.common.create} · ${copy.pages.points.title}`}
        fields={editFields}
        initialValues={{
          code: "PUBLISH_ARTICLE",
          name: "",
          description: "",
          type: "DAILY",
          rewardPoints: 0,
          targetCount: 1,
          dailyLimit: 1,
          totalLimit: 0,
          validDays: 0,
          icon: "",
          link: "",
          isActive: true,
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

      <DashboardEditDialog
        open={Boolean(editingItem)}
        title={`${copy.common.edit} · ${copy.pages.points.title}`}
        fields={editFields}
        initialValues={{
          code: editingItem?.code,
          name: editingItem?.name,
          description: editingItem?.description,
          type: editingItem?.type,
          rewardPoints: editingItem?.rewardPoints,
          targetCount: editingItem?.targetCount,
          dailyLimit: editingItem?.dailyLimit,
          totalLimit: editingItem?.totalLimit,
          validDays: editingItem?.validDays,
          icon: editingItem?.icon,
          link: editingItem?.link || "",
          isActive: editingItem?.isActive,
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
          if (!open) {
            setDeletingItem(null);
          }
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
