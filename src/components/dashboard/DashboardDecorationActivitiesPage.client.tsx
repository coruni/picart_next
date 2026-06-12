"use client";

import {
  decorationControllerCreateActivity,
  decorationControllerFindAll,
  decorationControllerFindAllActivities,
  decorationControllerFindOneActivity,
  decorationControllerRemoveActivity,
  decorationControllerUpdateActivity,
} from "@/api";
import { DropdownMenu, type MenuItem } from "@/components/shared";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { getErrorMessage, showToast } from "@/lib";
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
import type { DashboardDecorationActivityItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardDate } from "./utils";

const ACTIVITY_TYPE_OPTIONS = [
  { value: "LIKE", label: "LIKE" },
  { value: "COMMENT", label: "COMMENT" },
  { value: "SHARE", label: "SHARE" },
  { value: "RECHARGE", label: "RECHARGE" },
  { value: "SIGN_IN", label: "SIGN_IN" },
  { value: "CUSTOM", label: "CUSTOM" },
] as const;

function sortActivities(items: DashboardDecorationActivityItem[]) {
  return [...items].sort((left, right) => {
    const leftStart = left.startTime ? new Date(left.startTime).getTime() : 0;
    const rightStart = right.startTime ? new Date(right.startTime).getTime() : 0;

    if (rightStart !== leftStart) {
      return rightStart - leftStart;
    }

    return (right.id ?? 0) - (left.id ?? 0);
  });
}

function toNumberOrUndefined(value: unknown) {
  if (typeof value === "number") {
    return Number.isNaN(value) ? undefined : value;
  }

  if (typeof value === "string" && value.trim()) {
    const nextValue = Number(value);
    return Number.isNaN(nextValue) ? undefined : nextValue;
  }

  return undefined;
}

export function DashboardDecorationActivitiesPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [creating, setCreating] = useState(false);
  const [editingItem, setEditingItem] =
    useState<DashboardDecorationActivityItem | null>(null);
  const [deletingItem, setDeletingItem] =
    useState<DashboardDecorationActivityItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const activityTypeOptions = useMemo(
    () =>
      ACTIVITY_TYPE_OPTIONS.map((option) => ({
        value: option.value,
        label: copy.options.decorationActivityType[option.value],
      })),
    [copy],
  );

  const editFields = useMemo<DashboardEditField[]>(
    () => [
      { name: "name", label: copy.columns.name, required: true },
      {
        name: "description",
        label: copy.columns.description,
        type: "textarea",
      },
      {
        name: "type",
        label: copy.columns.type,
        type: "select",
        required: true,
        options: activityTypeOptions,
      },
      {
        name: "decorationId",
        label: copy.pages.decorationActivities.fields.rewardDecorationId,
        type: "select",
        required: true,
        searchable: true,
        searchPlaceholder: copy.filters.decorationPlaceholder,
        options:
          editingItem?.decorationId == null
            ? [{ value: "", label: "-" }]
            : [
                {
                  value: String(editingItem.decorationId),
                  label:
                    editingItem.decoration?.name ||
                    String(editingItem.decorationId),
                },
              ],
        loadOptions: async (keyword) => {
          const response = await decorationControllerFindAll({
            query: {
              page: 1,
              limit: 100,
              keyword: keyword || undefined,
            },
          });

          const rows = response?.data?.data?.data || [];

          return [
            { value: "", label: "-" },
            ...rows
              .filter((item) => item.id != null)
              .map((item) => ({
                value: String(item.id),
                label: item.name || String(item.id),
              })),
          ];
        },
      },
      {
        name: "articleId",
        label: copy.pages.decorationActivities.fields.articleId,
        type: "number",
        min: 1,
        step: 1,
      },
      {
        name: "requiredLikes",
        label: copy.fields.requiredLikes,
        type: "number",
        min: 0,
        step: 1,
      },
      {
        name: "requiredComments",
        label: copy.fields.requiredComments,
        type: "number",
        min: 0,
        step: 1,
      },
      {
        name: "requiredShares",
        label: copy.pages.decorationActivities.fields.requiredShares,
        type: "number",
        min: 0,
        step: 1,
      },
      {
        name: "requiredRecharge",
        label: copy.pages.decorationActivities.fields.requiredRecharge,
        type: "number",
        min: 0,
        step: 0.01,
      },
      {
        name: "requiredSignInDays",
        label: copy.pages.decorationActivities.fields.requiredSignInDays,
        type: "number",
        min: 0,
        step: 1,
      },
      {
        name: "isPermanent",
        label: copy.fields.isPermanent,
        type: "switch",
      },
      {
        name: "validDays",
        label: copy.fields.validDays,
        type: "number",
        min: 0,
        step: 1,
      },
      {
        name: "startTime",
        label: copy.pages.decorationActivities.fields.startTime,
        type: "date",
        required: true,
      },
      {
        name: "endTime",
        label: copy.pages.decorationActivities.fields.endTime,
        type: "date",
        required: true,
      },
    ],
    [activityTypeOptions, copy, editingItem],
  );

  const typeValueEnum: DashboardValueEnum = useMemo(
    () => ({
      "": { text: copy.common.all },
      LIKE: { text: copy.options.decorationActivityType.LIKE },
      COMMENT: { text: copy.options.decorationActivityType.COMMENT },
      SHARE: { text: copy.options.decorationActivityType.SHARE },
      RECHARGE: { text: copy.options.decorationActivityType.RECHARGE },
      SIGN_IN: { text: copy.options.decorationActivityType.SIGN_IN },
      CUSTOM: { text: copy.options.decorationActivityType.CUSTOM },
    }),
    [copy],
  );

  const statusValueEnum: DashboardValueEnum = useMemo(
    () => ({
      "": { text: copy.common.all },
      ACTIVE: { text: copy.status.active },
      INACTIVE: { text: copy.status.inactive },
    }),
    [copy],
  );

  const columns = useMemo<DashboardTableColumn<DashboardDecorationActivityItem>[]>(
    () => [
      {
        key: "name",
        header: copy.columns.name,
        dataIndex: "name",
        searchPlaceholder: copy.filters.decorationActivityPlaceholder,
        render: (item) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-card">
              {item.decoration?.imageUrl ? (
                <ImageWithFallback
                  src={item.decoration.imageUrl}
                  alt={item.decoration.name || item.name || "decoration"}
                  fill
                  className="object-contain p-1"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {item.name || "-"}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {item.decoration?.name || `#${item.decorationId ?? "-"}`}
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
        key: "requirement",
        header: copy.pages.decorationActivities.columns.requirement,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>{copy.fields.requiredLikes}: {item.requiredLikes ?? 0}</div>
            <div className="text-muted-foreground">
              {copy.fields.requiredComments}: {item.requiredComments ?? 0}
            </div>
            <div className="text-muted-foreground">
              {copy.pages.decorationActivities.fields.requiredShares}: {item.requiredShares ?? 0}
            </div>
            <div className="text-muted-foreground">
              {copy.pages.decorationActivities.fields.requiredSignInDays}: {item.requiredSignInDays ?? 0}
            </div>
          </div>
        ),
      },
      {
        key: "period",
        header: copy.pages.decorationActivities.columns.period,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>
              {formatDashboardDate(item.startTime)} - {formatDashboardDate(item.endTime)}
            </div>
            <div className="text-muted-foreground">
              {item.isPermanent
                ? copy.fields.isPermanent
                : `${copy.fields.validDays}: ${item.validDays ?? 0}`}
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
        render: (item) => (
          <div className="space-y-1">
            <DashboardStatusBadge value={item.status} />
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
              onClick: async () => {
                if (!item.id) {
                  return;
                }

                setDetailLoading(true);

                try {
                  await decorationControllerFindOneActivity({
                    path: { id: String(item.id) },
                  });
                } catch (error) {
                  showToast(getErrorMessage(error, copy.common.noPermission));
                  return;
                } finally {
                  setDetailLoading(false);
                }

                setEditingItem(item);
              },
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
    [copy, statusValueEnum, typeValueEnum],
  );

  const buildPayload = (values: Record<string, unknown>) => ({
    name: values.name as string | undefined,
    description: values.description as string | undefined,
    type: values.type as
      | "LIKE"
      | "COMMENT"
      | "SHARE"
      | "RECHARGE"
      | "SIGN_IN"
      | "CUSTOM"
      | undefined,
    decorationId: toNumberOrUndefined(values.decorationId),
    articleId: toNumberOrUndefined(values.articleId),
    requiredLikes: toNumberOrUndefined(values.requiredLikes),
    requiredComments: toNumberOrUndefined(values.requiredComments),
    requiredShares: toNumberOrUndefined(values.requiredShares),
    requiredRecharge: toNumberOrUndefined(values.requiredRecharge),
    requiredSignInDays: toNumberOrUndefined(values.requiredSignInDays),
    isPermanent: values.isPermanent as boolean | undefined,
    validDays: toNumberOrUndefined(values.validDays),
    startTime: values.startTime as string | undefined,
    endTime: values.endTime as string | undefined,
  });

  const handleCreate = async (values: Record<string, unknown>) => {
    setSubmitting(true);

    try {
      await decorationControllerCreateActivity({
        body: {
          name: (values.name as string) || "",
          description: values.description as string | undefined,
          type:
            (values.type as
              | "LIKE"
              | "COMMENT"
              | "SHARE"
              | "RECHARGE"
              | "SIGN_IN"
              | "CUSTOM") || "CUSTOM",
          decorationId: toNumberOrUndefined(values.decorationId) ?? 0,
          articleId: toNumberOrUndefined(values.articleId),
          requiredLikes: toNumberOrUndefined(values.requiredLikes),
          requiredComments: toNumberOrUndefined(values.requiredComments),
          requiredShares: toNumberOrUndefined(values.requiredShares),
          requiredRecharge: toNumberOrUndefined(values.requiredRecharge),
          requiredSignInDays: toNumberOrUndefined(values.requiredSignInDays),
          isPermanent: (values.isPermanent as boolean | undefined) ?? false,
          validDays: toNumberOrUndefined(values.validDays),
          startTime: (values.startTime as string) || "",
          endTime: (values.endTime as string) || "",
        },
      });
      setCreating(false);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      showToast(getErrorMessage(error, "创建活动失败"));
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
      await decorationControllerUpdateActivity({
        path: { id: String(editingItem.id) },
        body: buildPayload(values),
      });
      setEditingItem(null);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      showToast(getErrorMessage(error, "更新活动失败"));
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
      await decorationControllerRemoveActivity({
        path: { id: String(deletingItem.id) },
      });
      setDeletingItem(null);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      showToast(getErrorMessage(error, "删除活动失败"));
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
        title={copy.pages.decorationActivities.title}
        action={
          <Button
            variant="primary"
            className="h-7 rounded-full px-2"
            onClick={() => setCreating(true)}
            disabled={detailLoading}
          >
            <Plus className="mr-2 size-4" />
            {copy.common.create}
          </Button>
        }
        columns={columns}
        request={async ({ current, pageSize, type, status }) => {
          const response = await decorationControllerFindAllActivities({
            query: {
              page: current,
              limit: pageSize,
              type: typeof type === "string" && type ? type : undefined,
              status: typeof status === "string" && status ? status : undefined,
            },
          });

          const payload = response?.data?.data;
          const rows = sortActivities(payload?.data || []);

          return {
            data: rows,
            total: payload?.meta?.total || rows.length,
            totalPages: payload?.meta?.totalPages || 1,
          };
        }}
        getRowKey={(item) => item.id || `${item.name}-${item.startTime}`}
        emptyText={copy.empty.decorationActivities}
        className="h-full"
      />

      <DashboardEditDialog
        open={creating}
        title={`${copy.common.create} · ${copy.pages.decorationActivities.title}`}
        fields={editFields}
        initialValues={{
          name: "",
          description: "",
          type: "CUSTOM",
          decorationId: "",
          articleId: "",
          requiredLikes: 0,
          requiredComments: 0,
          requiredShares: 0,
          requiredRecharge: 0,
          requiredSignInDays: 0,
          isPermanent: false,
          validDays: 30,
          startTime: "",
          endTime: "",
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
        title={`${copy.common.edit} · ${copy.pages.decorationActivities.title}`}
        fields={editFields}
        initialValues={{
          name: editingItem?.name,
          description: editingItem?.description,
          type: editingItem?.type,
          decorationId:
            editingItem?.decorationId == null ? "" : String(editingItem.decorationId),
          articleId: editingItem?.articleId ?? "",
          requiredLikes: editingItem?.requiredLikes,
          requiredComments: editingItem?.requiredComments,
          requiredShares: editingItem?.requiredShares,
          requiredRecharge:
            editingItem?.requiredRecharge == null
              ? ""
              : Number(editingItem.requiredRecharge),
          requiredSignInDays: editingItem?.requiredSignInDays,
          isPermanent: editingItem?.isPermanent,
          validDays: editingItem?.validDays,
          startTime: editingItem?.startTime,
          endTime: editingItem?.endTime,
        }}
        loading={submitting || detailLoading}
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
