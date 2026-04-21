"use client";

import {
  configControllerFindAll,
  configControllerUpdateAll,
  uploadControllerUploadFile,
} from "@/api";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useImageCompression } from "@/hooks/useImageCompression";
import { cn } from "@/lib";
import { buildUploadMetadata } from "@/lib/file-hash";
import { ImagePlus, Save, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDashboardCopy } from "./copy";
import {
  DashboardErrorView,
  DashboardLoadingView,
} from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardPanel } from "./DashboardPanel";
import { DashboardStatusBadge } from "./DashboardStatusBadge";
import type { DashboardConfigItem } from "./types";
import { useDashboardGuard } from "./useDashboardGuard";
import { compactText, formatDashboardDate } from "./utils";

type ConfigEditorKind = "input" | "textarea" | "image" | "boolean" | "number";

const ALL_GROUP_VALUE = "__all__";

const CONFIG_TYPES = [
  { value: "string", label: "字符串 (string)" },
  { value: "number", label: "数字 (number)" },
  { value: "boolean", label: "布尔值 (boolean)" },
  { value: "json", label: "JSON" },
  { value: "text", label: "长文本 (text)" },
];

function getConfigEditorKind(item: DashboardConfigItem): ConfigEditorKind {
  // 直接使用 API 返回的 type，不再根据关键词推断
  const type = item.type.toLowerCase();
  const value = (item.value ?? "").trim().toLowerCase();

  // 布尔值判断（根据值内容）
  if (value === "true" || value === "false") {
    return "boolean";
  }

  // 根据 type 字段直接映射
  if (["number", "int", "integer", "float", "double", "decimal"].includes(type)) {
    return "number";
  }

  if (["image", "img", "upload", "file", "picture"].includes(type)) {
    return "image";
  }

  if (["textarea", "text", "longtext", "editor", "json", "html", "css"].includes(type)) {
    return "textarea";
  }

  // 默认为 input
  return "input";
}

function createDraftMap(items: DashboardConfigItem[]) {
  return items.reduce<Record<number, string>>((result, item) => {
    result[item.id] = item.value ?? "";
    return result;
  }, {});
}

type DashboardCopy = ReturnType<typeof getDashboardCopy>;

// 纯编辑器组件，无状态管理
function ConfigEditor({
  kind,
  value,
  inputId,
  uploading,
  text,
  onChange,
  onImageSelect,
}: {
  kind: ConfigEditorKind;
  value: string;
  inputId: string;
  uploading: boolean;
  text: DashboardCopy["pages"]["configs"];
  onChange: (value: string) => void;
  onImageSelect: (file: File) => void;
}) {
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) {
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );

  switch (kind) {
    case "boolean":
      return (
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-3">
          <div className="text-sm text-muted-foreground">{value}</div>
          <Switch
            checked={value === "true"}
            onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
          />
        </div>
      );

    case "input":
      return (
        <Input
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10"
        />
      );

    case "number":
      return (
        <Input
          fullWidth
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10"
        />
      );

    case "textarea":
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "min-h-32 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors",
            "focus:border-primary hover:border-primary",
          )}
        />
      );

    case "image":
      return (
        <div className="space-y-3">
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
            <div className="relative aspect-16/7 overflow-hidden">
              {value ? (
                <ImageWithFallback
                  src={value}
                  alt={text.imagePreviewAlt}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ImagePlus className="size-6" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={inputId}
              className={cn(
                "inline-flex h-7 cursor-pointer items-center justify-center rounded-full border-2 border-primary px-4 text-sm font-medium text-primary transition-colors",
                "hover:bg-primary hover:text-white",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              {uploading
                ? text.saving
                : value
                  ? text.replaceImage
                  : text.uploadImage}
            </label>

            {value ? (
              <button
                type="button"
                className="inline-flex h-7 items-center justify-center rounded-full border border-border/70 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => onChange("")}
              >
                <X className="mr-1 size-3.5" />
                {text.removeImage}
              </button>
            ) : null}
          </div>
        </div>
      );

    default:
      return null;
  }
}

// 简化的 ConfigCard，使用 memo 优化
const ConfigCard = React.memo(function ConfigCard({
  item,
  draftValue,
  uploading,
  error,
  text,
  onValueChange,
  onImageSelect,
}: {
  item: DashboardConfigItem;
  draftValue: string;
  uploading: boolean;
  error?: string;
  text: DashboardCopy["pages"]["configs"];
  onValueChange: (id: number, value: string) => void;
  onImageSelect: (id: number, file: File) => void;
}) {
  const editorKind = useMemo(() => getConfigEditorKind(item), [item]);
  const inputId = `dashboard-config-upload-${item.id}`;

  const handleChange = useCallback(
    (value: string) => onValueChange(item.id, value),
    [item.id, onValueChange]
  );

  const handleImageSelect = useCallback(
    (file: File) => onImageSelect(item.id, file),
    [item.id, onImageSelect]
  );

  return (
    <article className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-all text-sm font-semibold text-foreground">
              {item.key}
            </h3>
            <DashboardStatusBadge value={item.public} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              {text.typeLabel}: {item.type || "-"}
            </span>
            <span>
              {text.updatedLabel}: {formatDashboardDate(item.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {compactText(item.description, 240) || "-"}
      </p>

      <div className="mt-4 space-y-3">
        <ConfigEditor
          kind={editorKind}
          value={draftValue}
          inputId={inputId}
          uploading={uploading}
          text={text}
          onChange={handleChange}
          onImageSelect={handleImageSelect}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
      </div>
    </article>
  );
});

// 导入 React
import React from "react";

export function DashboardConfigsPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const text = copy.pages.configs;
  const { ready } = useDashboardGuard();
  const { compressImage } = useImageCompression();
  const [configs, setConfigs] = useState<DashboardConfigItem[]>([]);
  const [allConfigs, setAllConfigs] = useState<DashboardConfigItem[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [keyword, setKeyword] = useState("");
  const [activeGroup, setActiveGroup] = useState(ALL_GROUP_VALUE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // 使用 ref 来跟踪是否有未保存的更改
  const hasChangesRef = useRef(false);

  const loadAllConfigs = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }
      setError(false);

      try {
        const response = await configControllerFindAll();
        const nextConfigs = response?.data?.data?.data || [];
        setAllConfigs(nextConfigs);
        setDrafts(createDraftMap(nextConfigs));
        setFieldErrors({});
        hasChangesRef.current = false;
      } catch {
        setError(true);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!ready) return;
    void loadAllConfigs();
  }, [loadAllConfigs, ready]);

  const groups = useMemo(() => {
    const values = Array.from(
      new Set(allConfigs.map((item) => item.group).filter(Boolean))
    );
    return [
      { value: ALL_GROUP_VALUE, label: copy.common.all },
      ...values.map((item) => ({ value: item, label: item })),
    ];
  }, [allConfigs, copy.common.all]);

  const existingGroups = useMemo(() => {
    return Array.from(
      new Set(allConfigs.map((item) => item.group).filter(Boolean))
    );
  }, [allConfigs]);

  // 使用 allConfigs 在客户端过滤，避免切换 tab 时的 API 请求和 loading 闪烁
  useEffect(() => {
    if (!ready) return;

    if (activeGroup === ALL_GROUP_VALUE) {
      setConfigs(allConfigs);
    } else {
      // 客户端过滤，无延迟、无 loading 闪烁
      const filteredConfigs = allConfigs.filter(
        (item) => item.group === activeGroup
      );
      setConfigs(filteredConfigs);
    }
  }, [activeGroup, allConfigs, ready]);

  useEffect(() => {
    if (!groups.some((item) => item.value === activeGroup)) {
      setActiveGroup(groups[0]?.value || ALL_GROUP_VALUE);
    }
  }, [activeGroup, groups]);

  const visibleConfigs = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return configs.filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        item.key.toLowerCase().includes(normalizedKeyword) ||
        item.description?.toLowerCase().includes(normalizedKeyword);
      return matchesKeyword;
    });
  }, [configs, keyword]);

  // 计算是否有未保存的更改
  const hasUnsavedChanges = useMemo(() => {
    return visibleConfigs.some((item) => {
      const draftValue = drafts[item.id];
      return draftValue !== undefined && draftValue !== (item.value ?? "");
    });
  }, [visibleConfigs, drafts]);

  // 获取已修改的配置项
  const modifiedConfigs = useMemo(() => {
    return visibleConfigs.filter((item) => {
      const draftValue = drafts[item.id];
      return draftValue !== undefined && draftValue !== (item.value ?? "");
    });
  }, [visibleConfigs, drafts]);

  const handleImageUpload = useCallback(
    async (id: number, file: File) => {
      setUploadingId(id);
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      try {
        // 保存原始文件引用用于计算 hash
        const originalFile = file;
        const compressedResult = await compressImage(file);
        const compressedFile = compressedResult.file;

        // 计算原始文件的 hash
        const metadata = await buildUploadMetadata([originalFile]);

        const { data } = await uploadControllerUploadFile({
          body: { file: compressedFile, metadata },
        });
        const uploadedUrl = data?.data?.[0]?.url || "";
        if (!uploadedUrl) {
          throw new Error(text.uploadFailed);
        }
        setDrafts((prev) => ({ ...prev, [id]: uploadedUrl }));
        hasChangesRef.current = true;
      } catch {
        setFieldErrors((prev) => ({ ...prev, [id]: text.uploadFailed }));
      } finally {
        setUploadingId(null);
      }
    },
    [text.uploadFailed, compressImage]
  );

  const handleValueChange = useCallback((id: number, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: value }));
    hasChangesRef.current = true;
  }, []);

  // 批量保存所有修改
  const handleBatchSave = useCallback(async () => {
    if (modifiedConfigs.length === 0) return;

    setIsSaving(true);
    setFieldErrors({});

    try {
      // 准备包含 id、key、value 的更新数据
      const configsToUpdate = modifiedConfigs.map((item) => ({
        id: item.id,
        key: item.key,
        value: drafts[item.id] ?? "",
      }));

      await configControllerUpdateAll({
        body: configsToUpdate,
      });

      // 更新本地状态
      setConfigs((prev) =>
        prev.map((item) => {
          const draftValue = drafts[item.id];
          if (draftValue !== undefined && draftValue !== (item.value ?? "")) {
            return {
              ...item,
              value: draftValue,
              updatedAt: new Date().toISOString(),
            };
          }
          return item;
        })
      );

      setAllConfigs((prev) =>
        prev.map((item) => {
          const draftValue = drafts[item.id];
          if (draftValue !== undefined && draftValue !== (item.value ?? "")) {
            return {
              ...item,
              value: draftValue,
              updatedAt: new Date().toISOString(),
            };
          }
          return item;
        })
      );

      hasChangesRef.current = false;
    } catch {
      setFieldErrors(
        modifiedConfigs.reduce((acc, item) => {
          acc[item.id] = text.saveFailed;
          return acc;
        }, {} as Record<number, string>)
      );
      alert(text.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }, [modifiedConfigs, drafts, text.saveFailed]);

  if (!ready || loading) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  if (error) {
    return (
      <DashboardErrorView
        title={text.loadFailedTitle}
        description={text.loadFailedDescription}
        retryLabel={copy.common.retry}
        onRetry={() => void loadAllConfigs()}
      />
    );
  }

  return (
    <DashboardPageFrame className="flex h-full min-h-0 flex-col">
      <DashboardPanel
        title=""
        action={null}
        className="flex min-h-0 flex-1 flex-col"
        headerClassName="sticky top-0 z-20"
        contentClassName="flex min-h-0 flex-1 flex-col px-0 py-0 flex-1"
        headerExtra={
          <div className="bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-3 py-3">
              <div>
                <h2 className="text-sm font-semibold tracking-[0.01em] text-foreground md:text-base">
                  {copy.pages.configs.title}
                </h2>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {text.selectedGroupCount.replace(
                    "{count}",
                    String(visibleConfigs.length)
                  )}
                  {hasUnsavedChanges && (
                    <span className="ml-2 text-primary">
                      · {modifiedConfigs.length} 项未保存
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-7 rounded-full px-2"
                  onClick={() => void loadAllConfigs(false)}
                >
                  {copy.common.refresh}
                </Button>
                {hasUnsavedChanges && (
                  <Button
                    variant="primary"
                    className="h-7 rounded-full px-2"
                    onClick={handleBatchSave}
                    loading={isSaving}
                  >
                    <Save className="mr-1 size-4" />
                    {copy.common.save} ({modifiedConfigs.length})
                  </Button>
                )}
              </div>
            </div>

            <div className="border-b border-border/70 px-3 py-3">
              <Input
                fullWidth
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder={text.searchPlaceholder}
                className="h-10"
              />
            </div>

            <div className="overflow-x-auto px-3 py-3">
              <Tabs value={activeGroup} onValueChange={setActiveGroup}>
                <TabsList className="min-w-max gap-4">
                  {groups.map((group) => (
                    <TabsTrigger key={group.value} value={group.value}>
                      {group.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        }
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {visibleConfigs.length > 0 ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {visibleConfigs.map((item) => (
                <ConfigCard
                  key={item.id}
                  item={item}
                  draftValue={drafts[item.id] ?? ""}
                  uploading={uploadingId === item.id}
                  error={fieldErrors[item.id]}
                  text={text}
                  onValueChange={handleValueChange}
                  onImageSelect={handleImageUpload}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-border/70 bg-card px-4 text-sm text-muted-foreground">
              {text.emptyGroup}
            </div>
          )}
        </div>
      </DashboardPanel>
    </DashboardPageFrame>
  );
}
