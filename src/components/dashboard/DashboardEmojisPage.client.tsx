"use client";

import {
  emojiControllerFindAll,
  emojiControllerRemove,
  emojiControllerUpdate,
} from "@/api";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { DropdownMenu, type MenuItem } from "@/components/shared";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useLocale, useTranslations } from "next-intl";
import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { getDashboardCopy } from "./copy";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { DashboardLoadingView } from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardProTable } from "./DashboardProTable.client";
import type { DashboardTableColumn } from "./DashboardTable";
import { useDashboardGuard } from "./useDashboardGuard";
import { formatDashboardDate } from "./utils";

type EmojiItem = {
  id: number;
  name: string;
  url: string;
  code?: string;
  type: "system" | "user";
  category?: string;
  tags?: string;
  isPublic: boolean;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
  useCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export function DashboardEmojisPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const t = useTranslations("dashboard");
  const { ready } = useDashboardGuard();
  const [editingItem, setEditingItem] = useState<EmojiItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<EmojiItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const columns = useMemo<DashboardTableColumn<EmojiItem>[]>(
    () => [
      {
        key: "name",
        header: copy.columns.name,
        dataIndex: "keyword",
        searchPlaceholder: copy.filters.emojiPlaceholder,
        render: (item) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.url ? (
                <ImageWithFallback
                  src={item.url}
                  alt={item.name}
                  fill
                  className="object-contain p-1"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {item.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.code || "-"}
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
          <div className="text-sm text-foreground">
            {item.type === "system" ? "系统" : "用户"}
          </div>
        ),
      },
      {
        key: "category",
        header: copy.columns.categoryLabel,
        hideInSearch: true,
        render: (item) => (
          <div className="text-sm text-muted-foreground">
            {item.category || "-"}
          </div>
        ),
      },
      {
        key: "stats",
        header: copy.columns.count,
        hideInSearch: true,
        render: (item) => (
          <div className="text-sm text-muted-foreground">
            {item.useCount || 0}
          </div>
        ),
      },
      {
        key: "isPublic",
        header: copy.columns.status,
        hideInSearch: true,
        render: (item) => (
          <div className="text-sm text-foreground">
            {item.isPublic ? "公开" : "私有"}
          </div>
        ),
      },
      {
        key: "updatedAt",
        header: copy.columns.updatedAt,
        hideInSearch: true,
        render: (item) => (
          <span className="text-sm text-muted-foreground">
            {formatDashboardDate(item.updatedAt)}
          </span>
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
    [copy],
  );

  const handleDelete = async () => {
    if (!deletingItem?.id) return;

    setDeleteLoading(true);
    try {
      await emojiControllerRemove({
        path: { id: String(deletingItem.id) },
      });
      setDeletingItem(null);
      setRefreshKey((current) => current + 1);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (values: Partial<EmojiItem>) => {
    if (!editingItem?.id) return;

    setSubmitting(true);
    try {
      await emojiControllerUpdate({
        path: { id: String(editingItem.id) },
        body: {
          name: values.name,
          code: values.code,
          category: values.category,
          tags: values.tags,
          isPublic: values.isPublic,
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
        title={copy.pages.emojis.title}
        columns={columns}
        request={async ({ current, pageSize, keyword }) => {
          const response = await emojiControllerFindAll({
            query: {
              page: current,
              limit: pageSize,
              keyword: typeof keyword === "string" && keyword ? keyword : undefined,
              grouped: false,
            },
          });

          const data = response?.data?.data;
          const items = data?.groups?.flatMap((g) => g.items || []) || (data as unknown as EmojiItem[]) || [];

          return {
            data: items as EmojiItem[],
            total: data?.total || 0,
            totalPages: Math.ceil((data?.total || 0) / pageSize) || 1,
          };
        }}
        getRowKey={(item) => item.id}
        emptyText={copy.empty.emojis}
        className="h-full"
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
      <EmojiEditDialog
        open={Boolean(editingItem)}
        item={editingItem}
        onOpenChange={setEditingItem}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </DashboardPageFrame>
  );
}

function EmojiEditDialog({
  open,
  item,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  item: EmojiItem | null;
  onOpenChange: (item: EmojiItem | null) => void;
  onSubmit: (values: Partial<EmojiItem>) => Promise<void>;
  loading: boolean;
}) {
  const t = useTranslations("dashboard");
  const copy = getDashboardCopy("zh");
  const [name, setName] = useState(item?.name || "");
  const [code, setCode] = useState(item?.code || "");
  const [category, setCategory] = useState(item?.category || "");
  const [tags, setTags] = useState(item?.tags || "");
  const [isPublic, setIsPublic] = useState(item?.isPublic ?? true);

  const handleSubmit = useCallback(() => {
    onSubmit({
      name,
      code,
      category,
      tags,
      isPublic,
    });
  }, [name, code, category, tags, isPublic, onSubmit]);

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange(null)}>
      <DialogContent className="max-w-md p-0!">
        <DialogHeader>
          <DialogTitle>{copy.common.edit}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 py-4">
          {item?.url && (
            <div className="flex items-center justify-center">
              <div className="relative size-20 overflow-hidden rounded-lg bg-muted">
                <ImageWithFallback
                  src={item.url}
                  alt={item.name}
                  fill
                  className="object-contain p-2"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">名称</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="表情名称"
              fullWidth
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">代码</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="表情代码"
              fullWidth
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">分类</label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="分类"
              fullWidth
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">标签</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="标签（逗号分隔）"
              fullWidth
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">公开</label>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>
        <DialogFooter className="px-6 pb-4 gap-4!">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(null)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            variant="primary"
            className="rounded-full"
            onClick={handleSubmit}
            loading={loading}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
