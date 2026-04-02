"use client";

import {
  configControllerFindAll,
  configControllerFindByGroup,
  configControllerUpdate,
  uploadControllerUploadFile,
} from "@/api";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn } from "@/lib";
import { ImagePlus, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
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
const IMAGE_KEYWORDS = [
  "logo",
  "image",
  "cover",
  "avatar",
  "background",
  "banner",
  "icon",
  "qrcode",
  "qr_code",
  "qr",
];
const TEXTAREA_KEYWORDS = [
  "description",
  "content",
  "message",
  "keywords",
  "style",
  "script",
  "html",
  "css",
  "notice",
  "announcement",
  "contact",
  "proxy_url",
];
const NUMBER_KEYWORDS = [
  "_count",
  "_limit",
  "_price",
  "_rate",
  "_version",
  "_sort",
  "_level",
  "_minute",
  "_seconds",
  "_days",
  "_hours",
];

function looksLikeNumberValue(value: string) {
  return /^-?\d+(\.\d+)?$/.test(value.trim());
}

function getConfigEditorKind(item: DashboardConfigItem): ConfigEditorKind {
  const key = item.key.toLowerCase();
  const type = item.type.toLowerCase();
  const value = (item.value ?? "").trim().toLowerCase();

  if (value === "true" || value === "false") {
    return "boolean";
  }

  if (
    NUMBER_KEYWORDS.some((keyword) => key.includes(keyword)) ||
    ["number", "int", "integer", "float", "double", "decimal"].some(
      (keyword) => type.includes(keyword),
    ) ||
    looksLikeNumberValue(value)
  ) {
    return "number";
  }

  if (
    IMAGE_KEYWORDS.some((keyword) => key.includes(keyword)) ||
    ["image", "img", "upload", "file", "picture"].some((keyword) =>
      type.includes(keyword),
    )
  ) {
    return "image";
  }

  if (
    TEXTAREA_KEYWORDS.some((keyword) => key.includes(keyword)) ||
    ["textarea", "text", "longtext", "editor", "json", "html", "css"].some(
      (keyword) => type.includes(keyword),
    ) ||
    item.value.length > 120 ||
    item.value.includes("\n")
  ) {
    return "textarea";
  }

  return "input";
}

function createDraftMap(items: DashboardConfigItem[]) {
  return items.reduce<Record<number, string>>((result, item) => {
    result[item.id] = item.value ?? "";
    return result;
  }, {});
}

function getConfigPageText(locale: string) {
  if (locale === "en") {
    return {
      loadFailedTitle: "Failed to load configs",
      loadFailedDescription:
        "The config list could not be fetched from the management API.",
      searchPlaceholder: "Search key or description",
      uploadImage: "Upload image",
      replaceImage: "Replace image",
      removeImage: "Remove image",
      save: "Save",
      saving: "Saving",
      uploadFailed: "Image upload failed",
      saveFailed: "Config update failed",
      emptyGroup: "No configs in this group.",
      selectedGroupCount: "{count} configs",
      typeLabel: "Type",
      updatedLabel: "Updated",
      imagePreviewAlt: "Config image",
    };
  }

  return {
    loadFailedTitle: "配置加载失败",
    loadFailedDescription: "当前配置列表无法从管理接口获取。",
    searchPlaceholder: "搜索配置 key 或描述",
    uploadImage: "上传图片",
    replaceImage: "替换图片",
    removeImage: "移除图片",
    save: "保存",
    saving: "保存中",
    uploadFailed: "图片上传失败",
    saveFailed: "配置更新失败",
    emptyGroup: "当前分组下暂无配置项。",
    selectedGroupCount: "{count} 项配置",
    typeLabel: "类型",
    updatedLabel: "更新时间",
    imagePreviewAlt: "配置图片",
  };
}

type ConfigCardProps = {
  item: DashboardConfigItem;
  draftValue: string;
  saving: boolean;
  uploading: boolean;
  error?: string;
  text: ReturnType<typeof getConfigPageText>;
  onValueChange: (value: string) => void;
  onImageSelect: (file: File) => void;
  onSave: () => void;
};

function ConfigCard({
  item,
  draftValue,
  saving,
  uploading,
  error,
  text,
  onValueChange,
  onImageSelect,
  onSave,
}: ConfigCardProps) {
  const editorKind = getConfigEditorKind(item);
  const dirty = draftValue !== (item.value ?? "");
  const inputId = `dashboard-config-upload-${item.id}`;

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

        <Button
          variant="primary"
          className="h-7 rounded-full px-4"
          onClick={onSave}
          loading={saving}
          disabled={!dirty || uploading}
        >
          {saving ? text.saving : text.save}
        </Button>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {compactText(item.description, 240) || "-"}
      </p>

      <div className="mt-4 space-y-3">
        {editorKind === "boolean" ? (
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-3">
            <div className="text-sm text-muted-foreground">{draftValue}</div>
            <Switch
              checked={draftValue === "true"}
              onCheckedChange={(checked) =>
                onValueChange(checked ? "true" : "false")
              }
            />
          </div>
        ) : null}

        {editorKind === "input" ? (
          <Input
            fullWidth
            value={draftValue}
            onChange={(event) => onValueChange(event.target.value)}
            className="h-10"
          />
        ) : null}

        {editorKind === "number" ? (
          <Input
            fullWidth
            type="number"
            value={draftValue}
            onChange={(event) => onValueChange(event.target.value)}
            className="h-10"
          />
        ) : null}

        {editorKind === "textarea" ? (
          <textarea
            value={draftValue}
            onChange={(event) => onValueChange(event.target.value)}
            className={cn(
              "min-h-32 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors",
              "focus:border-primary hover:border-primary",
            )}
          />
        ) : null}

        {editorKind === "image" ? (
          <div className="space-y-3">
            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";

                if (file) {
                  onImageSelect(file);
                }
              }}
            />

            <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
              <div className="relative aspect-16/7 overflow-hidden">
                {draftValue ? (
                  <ImageWithFallback
                    src={draftValue}
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
                  : draftValue
                    ? text.replaceImage
                    : text.uploadImage}
              </label>

              {draftValue ? (
                <button
                  type="button"
                  className="inline-flex h-7 items-center justify-center rounded-full border border-border/70 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => onValueChange("")}
                >
                  <X className="mr-1 size-3.5" />
                  {text.removeImage}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-500">{error}</p> : null}
      </div>
    </article>
  );
}

export function DashboardConfigsPage() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const text = useMemo(() => getConfigPageText(locale), [locale]);
  const { ready } = useDashboardGuard();
  const [configs, setConfigs] = useState<DashboardConfigItem[]>([]);
  const [allConfigs, setAllConfigs] = useState<DashboardConfigItem[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [keyword, setKeyword] = useState("");
  const [activeGroup, setActiveGroup] = useState(ALL_GROUP_VALUE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});

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
      } catch {
        setError(true);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!ready) {
      return;
    }

    void loadAllConfigs();
  }, [loadAllConfigs, ready]);

  const groups = useMemo(() => {
    const values = Array.from(
      new Set(allConfigs.map((item) => item.group).filter(Boolean)),
    );

    return [{ value: ALL_GROUP_VALUE, label: copy.common.all }, ...values.map((item) => ({
      value: item,
      label: item,
    }))];
  }, [allConfigs, copy.common.all]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let mounted = true;

    async function loadCurrentGroup() {
      if (activeGroup === ALL_GROUP_VALUE) {
        setConfigs(allConfigs);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const response = await configControllerFindByGroup({
          path: {
            group: activeGroup,
          },
        });

        if (!mounted) {
          return;
        }

        const nextConfigs = response?.data?.data?.data || [];
        setConfigs(nextConfigs);
        setDrafts((previous) => ({
          ...createDraftMap(nextConfigs),
          ...previous,
        }));
      } catch {
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCurrentGroup();

    return () => {
      mounted = false;
    };
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

  const handleImageUpload = useCallback(
    async (id: number, file: File) => {
      setUploadingId(id);
      setFieldErrors((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });

      try {
        const { data } = await uploadControllerUploadFile({
          bodySerializer: (body) => {
            const formData = new FormData();
            formData.append("file", body.file);
            return formData;
          },
          headers: {
            "Content-Type": null,
          },
          body: {
            file,
          },
        });

        const uploadedUrl = data?.data?.[0]?.url || "";

        if (!uploadedUrl) {
          throw new Error(text.uploadFailed);
        }

        setDrafts((previous) => ({
          ...previous,
          [id]: uploadedUrl,
        }));
      } catch {
        setFieldErrors((previous) => ({
          ...previous,
          [id]: text.uploadFailed,
        }));
      } finally {
        setUploadingId(null);
      }
    },
    [text.uploadFailed],
  );

  const handleSave = useCallback(
    async (item: DashboardConfigItem) => {
      const nextValue = drafts[item.id] ?? "";
      setSavingId(item.id);
      setFieldErrors((previous) => {
        const next = { ...previous };
        delete next[item.id];
        return next;
      });

      try {
        await configControllerUpdate({
          path: {
            id: item.id,
          },
          body: {
            value: nextValue,
          },
        });

        setConfigs((previous) =>
          previous.map((current) =>
            current.id === item.id
              ? {
                  ...current,
                  value: nextValue,
                  updatedAt: new Date().toISOString(),
                }
              : current,
          ),
        );
        setAllConfigs((previous) =>
          previous.map((current) =>
            current.id === item.id
              ? {
                  ...current,
                  value: nextValue,
                  updatedAt: new Date().toISOString(),
                }
              : current,
          ),
        );
      } catch {
        setFieldErrors((previous) => ({
          ...previous,
          [item.id]: text.saveFailed,
        }));
      } finally {
        setSavingId(null);
      }
    },
    [drafts, text.saveFailed],
  );

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
        contentClassName="flex min-h-0 flex-1 flex-col px-0 py-0"
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
                    String(visibleConfigs.length),
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                className="h-7 rounded-full px-4"
                onClick={() => void loadAllConfigs(false)}
              >
                {copy.common.refresh}
              </Button>
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
                  saving={savingId === item.id}
                  uploading={uploadingId === item.id}
                  error={fieldErrors[item.id]}
                  text={text}
                  onValueChange={(value) =>
                    setDrafts((previous) => ({
                      ...previous,
                      [item.id]: value,
                    }))
                  }
                  onImageSelect={(file) => void handleImageUpload(item.id, file)}
                  onSave={() => void handleSave(item)}
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
