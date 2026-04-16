"use client";

import {
  decorationControllerCreate,
  decorationControllerFindAll,
  decorationControllerRemove,
  decorationControllerUpdate,
} from "@/api";
import { DropdownMenu, type MenuItem } from "@/components/shared";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { MoreHorizontal, PencilLine, Plus, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardEditDialog, type DashboardEditField } from "./DashboardEditDialog.client";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { DashboardDecorationItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardDate } from "./utils";

export function DashboardDecorationsPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [creating, setCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<DashboardDecorationItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<DashboardDecorationItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const editFields = useMemo<DashboardEditField[]>(
    () => [
      { name: "name", label: copy.columns.name },
      { name: "type", label: copy.columns.type, type: "select", options: [
        { value: "AVATAR_FRAME", label: copy.options.decorationType.AVATAR_FRAME },
        { value: "COMMENT_BUBBLE", label: copy.options.decorationType.COMMENT_BUBBLE },
        { value: "ACHIEVEMENT_BADGE", label: copy.options.decorationType.ACHIEVEMENT_BADGE },
      ] },
      { name: "description", label: copy.columns.description, type: "textarea" },
      {
        name: "imageUrl",
        label: copy.fields.image,
        type: "image",
        imagePreviewClassName: "aspect-square h-auto w-full max-w-52",
        imageObjectFit: "contain",
      },
      {
        name: "previewUrl",
        label: copy.fields.preview,
        type: "image",
        imagePreviewClassName: "aspect-square h-auto w-full max-w-52",
        imageObjectFit: "contain",
      },
      { name: "rarity", label: copy.columns.rarity, type: "select", options: [
        { value: "COMMON", label: copy.options.rarity.COMMON },
        { value: "RARE", label: copy.options.rarity.RARE },
        { value: "EPIC", label: copy.options.rarity.EPIC },
        { value: "LEGENDARY", label: copy.options.rarity.LEGENDARY },
      ] },
      { name: "obtainMethod", label: copy.columns.type, type: "select", options: [
        { value: "PURCHASE", label: copy.options.obtainMethod.PURCHASE },
        { value: "ACTIVITY", label: copy.options.obtainMethod.ACTIVITY },
        { value: "GIFT", label: copy.options.obtainMethod.GIFT },
        { value: "ACHIEVEMENT", label: copy.options.obtainMethod.ACHIEVEMENT },
        { value: "DEFAULT", label: copy.options.obtainMethod.DEFAULT },
      ] },
      { name: "isPurchasable", label: copy.fields.isPurchasable, type: "switch" },
      { name: "price", label: copy.columns.price, type: "number", step: 1 },
      { name: "isPermanent", label: copy.fields.isPermanent, type: "switch" },
      { name: "validDays", label: copy.fields.validDays, type: "number", step: 1 },
      { name: "sort", label: copy.columns.sort, type: "number", step: 1 },
      { name: "requiredLikes", label: copy.fields.requiredLikes, type: "number", step: 1 },
      { name: "requiredComments", label: copy.fields.requiredComments, type: "number", step: 1 },
    ],
    [copy],
  );

  const columns = useMemo<DashboardTableColumn<DashboardDecorationItem>[]>(
    () => [
      {
        key: "name",
        header: copy.columns.name,
        dataIndex: "keyword",
        searchPlaceholder: copy.filters.decorationPlaceholder,
        render: (item) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border/70">
              {item.imageUrl ? (
                <ImageWithFallback
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {item.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDashboardDate(item.updatedAt)}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "type",
        header: copy.columns.type,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>{item.type || "-"}</div>
            <div className="text-muted-foreground">{item.obtainMethod || "-"}</div>
          </div>
        ),
      },
      {
        key: "rarity",
        header: copy.columns.rarity,
        hideInSearch: true,
        render: (item) => (
          <div className="space-y-1 text-sm text-foreground">
            <div>{item.rarity || "-"}</div>
            <div className="text-muted-foreground">
              {copy.columns.price}: {item.price || "-"}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: copy.columns.status,
        dataIndex: "status",
        valueType: "select",
        valueEnum: {
          "": { text: copy.common.all },
          ACTIVE: { text: copy.status.active },
          INACTIVE: { text: copy.status.inactive },
        },
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
    [copy],
  );

  const handleDelete = async () => {
    if (!deletingItem?.id) return;

    setDeleteLoading(true);
    try {
      await decorationControllerRemove({
        path: { id: String(deletingItem.id) },
      });
      setDeletingItem(null);
      setRefreshKey((current) => current + 1);
    } finally {
      setDeleteLoading(false);
    }
  };

  const buildDecorationPayload = (values: Record<string, unknown>) => ({
    name: values.name as string | undefined,
    type: values.type as "AVATAR_FRAME" | "COMMENT_BUBBLE" | "ACHIEVEMENT_BADGE" | undefined,
    description: values.description as string | undefined,
    imageUrl: values.imageUrl as string | undefined,
    previewUrl: values.previewUrl as string | undefined,
    rarity: values.rarity as
      | "COMMON"
      | "RARE"
      | "EPIC"
      | "LEGENDARY"
      | undefined,
    obtainMethod: values.obtainMethod as
      | "PURCHASE"
      | "ACTIVITY"
      | "GIFT"
      | "ACHIEVEMENT"
      | "DEFAULT"
      | undefined,
    isPurchasable: values.isPurchasable as boolean | undefined,
    price: values.price as number | undefined,
    isPermanent: values.isPermanent as boolean | undefined,
    validDays: values.validDays as number | undefined,
    sort: values.sort as number | undefined,
    requiredLikes: values.requiredLikes as number | undefined,
    requiredComments: values.requiredComments as number | undefined,
  });

  const handleCreate = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      await decorationControllerCreate({
        body: {
          name: (values.name as string) || "",
          type:
            (values.type as "AVATAR_FRAME" | "COMMENT_BUBBLE" | "ACHIEVEMENT_BADGE") ||
            "AVATAR_FRAME",
          description: values.description as string | undefined,
          imageUrl: (values.imageUrl as string) || "",
          previewUrl: values.previewUrl as string | undefined,
          rarity: values.rarity as
            | "COMMON"
            | "RARE"
            | "EPIC"
            | "LEGENDARY"
            | undefined,
          obtainMethod:
            (values.obtainMethod as
              | "PURCHASE"
              | "ACTIVITY"
              | "GIFT"
              | "ACHIEVEMENT"
              | "DEFAULT") || "DEFAULT",
          isPurchasable: values.isPurchasable as boolean | undefined,
          price: values.price as number | undefined,
          isPermanent: values.isPermanent as boolean | undefined,
          validDays: values.validDays as number | undefined,
          sort: values.sort as number | undefined,
          requiredLikes: values.requiredLikes as number | undefined,
          requiredComments: values.requiredComments as number | undefined,
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
      await decorationControllerUpdate({
        path: { id: String(editingItem.id) },
        body: buildDecorationPayload(values),
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
        title={copy.pages.decorations.title}
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
        request={async ({ current, pageSize, keyword, status }) => {
          const response = await decorationControllerFindAll({
            query: {
              page: current,
              limit: pageSize,
              keyword: typeof keyword === "string" && keyword ? keyword : undefined,
              status: typeof status === "string" && status ? status : undefined,
            },
          });

          return {
            data: response?.data?.data?.data || [],
            total: response?.data?.data?.meta?.total || 0,
            totalPages: response?.data?.data?.meta?.totalPages || 1,
          };
        }}
        getRowKey={(item) => item.id}
        emptyText={copy.empty.decorations}
        className="h-full"
      />
      <DashboardEditDialog
        open={creating}
        title={`${copy.common.create} · ${copy.pages.decorations.title}`}
        fields={editFields}
        initialValues={{
          name: "",
          type: "AVATAR_FRAME",
          description: "",
          imageUrl: "",
          previewUrl: "",
          rarity: "COMMON",
          obtainMethod: "DEFAULT",
          isPurchasable: false,
          price: 0,
          isPermanent: true,
          validDays: 999,
          sort: 0,
          requiredLikes: 0,
          requiredComments: 0,
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
        title={`${copy.common.edit} · ${copy.pages.decorations.title}`}
        fields={editFields}
        initialValues={{
          name: editingItem?.name,
          type: editingItem?.type,
          description: editingItem?.description,
          imageUrl: editingItem?.imageUrl,
          previewUrl: editingItem?.previewUrl,
          rarity: editingItem?.rarity,
          obtainMethod: editingItem?.obtainMethod,
          isPurchasable: editingItem?.isPurchasable,
          price: editingItem?.price ? Number(editingItem.price) : undefined,
          isPermanent: editingItem?.isPermanent,
          validDays: editingItem?.validDays,
          sort: editingItem?.sort,
          requiredLikes: editingItem?.requiredLikes,
          requiredComments: editingItem?.requiredComments,
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
          await handleUpdate(values);
        }}
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
