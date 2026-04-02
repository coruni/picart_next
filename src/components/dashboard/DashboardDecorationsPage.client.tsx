"use client";

import { decorationControllerFindAll, decorationControllerUpdate } from "@/api";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DashboardEditDialog, type DashboardEditField } from "./DashboardEditDialog.client";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardTableColumn } from "./DashboardTable";
import type { DashboardDecorationItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardDate } from "./utils";

export function DashboardDecorationsPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { ready } = useDashboardGuard();
  const [editingItem, setEditingItem] = useState<DashboardDecorationItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const editFields = useMemo<DashboardEditField[]>(
    () => [
      { name: "name", label: copy.columns.name },
      { name: "type", label: copy.columns.type, type: "select", options: [
        { value: "AVATAR_FRAME", label: "AVATAR_FRAME" },
        { value: "COMMENT_BUBBLE", label: "COMMENT_BUBBLE" },
      ] },
      { name: "description", label: copy.columns.description, type: "textarea" },
      { name: "imageUrl", label: "Image URL" },
      { name: "previewUrl", label: "Preview URL" },
      { name: "rarity", label: copy.columns.rarity, type: "select", options: [
        { value: "COMMON", label: "COMMON" },
        { value: "RARE", label: "RARE" },
        { value: "EPIC", label: "EPIC" },
        { value: "LEGENDARY", label: "LEGENDARY" },
      ] },
      { name: "obtainMethod", label: copy.columns.type, type: "select", options: [
        { value: "PURCHASE", label: "PURCHASE" },
        { value: "ACTIVITY", label: "ACTIVITY" },
        { value: "GIFT", label: "GIFT" },
        { value: "ACHIEVEMENT", label: "ACHIEVEMENT" },
        { value: "DEFAULT", label: "DEFAULT" },
      ] },
      { name: "isPurchasable", label: "Purchasable", type: "switch" },
      { name: "price", label: copy.columns.price, type: "number", step: 1 },
      { name: "isPermanent", label: "Permanent", type: "switch" },
      { name: "validDays", label: "Valid Days", type: "number", step: 1 },
      { name: "sort", label: copy.columns.sort, type: "number", step: 1 },
      { name: "requiredLikes", label: "Required Likes", type: "number", step: 1 },
      { name: "requiredComments", label: "Required Comments", type: "number", step: 1 },
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
        render: (item) => (
          <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
            {copy.common.edit}
          </Button>
        ),
      },
    ],
    [copy],
  );

  if (!ready) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardProTable
        key={refreshKey}
        title={copy.pages.decorations.title}
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

          setSubmitting(true);

          try {
            await decorationControllerUpdate({
              path: { id: String(editingItem.id) },
              body: {
                name: values.name as string | undefined,
                type: values.type as "AVATAR_FRAME" | "COMMENT_BUBBLE" | undefined,
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
