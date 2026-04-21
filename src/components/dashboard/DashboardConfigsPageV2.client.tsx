"use client";

import {
  configControllerFindAll,
  configControllerUpdateAll,
  uploadControllerUploadFile,
} from "@/api";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useImageCompression } from "@/hooks/useImageCompression";
import { cn } from "@/lib";
import { buildUploadMetadata } from "@/lib/file-hash";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Save,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConfigItem, ConfigSchema, ConfigValueType } from "./config-schema";
import {
  getConfigDefaultValue,
  getConfigSchemaByKey,
  validateConfigValue,
} from "./config-schema";
import { getDashboardCopy } from "./copy";
import {
  DashboardErrorView,
  DashboardLoadingView,
} from "./DashboardFeedback";
import { DashboardPageFrame } from "./DashboardPageFrame";
import { DashboardPanel } from "./DashboardPanel";
import { useDashboardGuard } from "./useDashboardGuard";

type ConfigEditorProps = {
  schema: ConfigSchema;
  value: string;
  error?: string;
  uploading?: boolean;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => void;
};

// 字符串输入编辑器
function StringEditor({ schema, value, onChange, error }: ConfigEditorProps) {
  const ui = schema.ui;
  return (
    <div className="space-y-2">
      <Input
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ui?.placeholder}
        disabled={ui?.disabled}
        readOnly={ui?.readOnly}
        className={cn("h-10", ui?.className)}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// URL 编辑器
function UrlEditor({ schema, value, onChange, error }: ConfigEditorProps) {
  return (
    <div className="space-y-2">
      <Input
        fullWidth
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={schema.ui?.placeholder || "https://..."}
        className="h-10"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// 邮箱编辑器
function EmailEditor({ schema, value, onChange, error }: ConfigEditorProps) {
  return (
    <div className="space-y-2">
      <Input
        fullWidth
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={schema.ui?.placeholder || "example@email.com"}
        className="h-10"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// 密码编辑器
function PasswordEditor({ schema, value, onChange, error }: ConfigEditorProps) {
  return (
    <div className="space-y-2">
      <Input
        fullWidth
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={schema.ui?.placeholder}
        className="h-10"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// 数字编辑器
function NumberEditor({ schema, value, onChange, error }: ConfigEditorProps) {
  const ui = schema.ui;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === "" || /^-?\d*\.?\d*$/.test(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          fullWidth
          type="number"
          value={value}
          onChange={handleChange}
          placeholder={ui?.placeholder}
          min={ui?.min}
          max={ui?.max}
          step={ui?.step}
          className="h-10"
        />
        {ui?.suffix && (
          <span className="text-sm text-muted-foreground">{ui.suffix}</span>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// 布尔值编辑器
function BooleanEditor({ schema, value, onChange }: ConfigEditorProps) {
  const boolValue = value === "true";
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3">
      <span className="text-sm text-muted-foreground">
        {boolValue ? "已开启" : "已关闭"}
      </span>
      <Switch
        checked={boolValue}
        onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
      />
    </div>
  );
}

// 长文本编辑器
function TextEditor({ schema, value, onChange, error }: ConfigEditorProps) {
  const ui = schema.ui;
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ui?.placeholder}
        rows={ui?.rows || 4}
        className={cn(
          "min-h-[100px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors",
          "focus:border-primary hover:border-primary",
          ui?.className
        )}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// JSON 编辑器
function JsonEditor({ schema, value, onChange, error }: ConfigEditorProps) {
  const [isValid, setIsValid] = useState(true);

  const formatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(value || "{}")
      onChange(JSON.stringify(parsed, null, 2));
      setIsValid(true);
    } catch {
      setIsValid(false);
    }
  }, [value, onChange]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange(newValue);
            try {
              JSON.parse(newValue || "{}");
              setIsValid(true);
            } catch {
              setIsValid(false);
            }
          }}
          placeholder={schema.ui?.placeholder || '{"key": "value"}'}
          rows={schema.ui?.rows || 8}
          className={cn(
            "min-h-[150px] w-full rounded-xl border bg-card px-3 py-2 font-mono text-xs text-foreground outline-none transition-colors",
            isValid
              ? "border-border focus:border-primary hover:border-primary"
              : "border-red-500 focus:border-red-500"
          )}
        />
        <button
          type="button"
          onClick={formatJson}
          className="absolute right-2 top-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80"
        >
          格式化
        </button>
      </div>
      {!isValid && (
        <p className="text-sm text-red-500">JSON 格式不正确</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// 单选下拉编辑器
function SelectEditor({ schema, value, onChange, error }: ConfigEditorProps) {
  const options = schema.ui?.options || [];

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder={schema.ui?.placeholder || "请选择..."}
        className="h-10"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// 多选编辑器
function MultiSelectEditor({ schema, value, onChange, error }: ConfigEditorProps) {
  const options = schema.ui?.options || [];
  const selectedValues = value ? value.split(",") : [];

  const toggleValue = (val: string) => {
    const newValues = selectedValues.includes(val)
      ? selectedValues.filter((v) => v !== val)
      : [...selectedValues, val];
    onChange(newValues.join(","));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleValue(option.value)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              {isSelected && <Check className="size-3.5" />}
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// 颜色选择器编辑器
function ColorEditor({ value, onChange, error }: ConfigEditorProps) {
  const colorValue = value || "#000000";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={colorValue}
            onChange={(e) => onChange(e.target.value)}
            className="size-10 cursor-pointer rounded-lg border border-border bg-transparent"
          />
        </div>
        <Input
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          className="h-10 w-32"
        />
        <div
          className="size-10 rounded-lg border border-border"
          style={{ backgroundColor: colorValue }}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// 图片上传编辑器
function ImageEditor({
  schema,
  value,
  onChange,
  uploading,
  onImageUpload,
}: ConfigEditorProps) {
  const upload = schema.ui?.upload;
  const inputId = `image-upload-${schema.key}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  return (
    <div className="space-y-3">
      <input
        id={inputId}
        type="file"
        accept={upload?.accept || "image/*"}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="relative aspect-video overflow-hidden">
          {value ? (
            <ImageWithFallback
              src={value}
              alt={schema.label}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImagePlus className="size-8" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label
          htmlFor={inputId}
          className={cn(
            "inline-flex h-8 cursor-pointer items-center justify-center rounded-full border-2 border-primary px-4 text-sm font-medium text-primary transition-colors",
            "hover:bg-primary hover:text-white",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          {uploading ? "上传中..." : value ? "替换图片" : "上传图片"}
        </label>

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex h-8 items-center justify-center rounded-full border border-border/70 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="mr-1 size-3.5" />
            移除
          </button>
        )}
      </div>

      {upload?.maxSize && (
        <p className="text-xs text-muted-foreground">
          最大文件大小: {upload.maxSize}MB
        </p>
      )}
    </div>
  );
}

// 日期选择器编辑器
function DateEditor({ value, onChange, error }: ConfigEditorProps) {
  return (
    <div className="space-y-2">
      <Input
        fullWidth
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// 编辑器组件映射
const EDITOR_COMPONENTS: Record<ConfigValueType, React.FC<ConfigEditorProps>> =
  {
    string: StringEditor,
    number: NumberEditor,
    boolean: BooleanEditor,
    text: TextEditor,
    json: JsonEditor,
    select: SelectEditor,
    multiselect: MultiSelectEditor,
    image: ImageEditor,
    file: ImageEditor, // 复用图片编辑器
    color: ColorEditor,
    date: DateEditor,
    datetime: DateEditor,
    time: DateEditor,
    url: UrlEditor,
    email: EmailEditor,
    password: PasswordEditor,
    jsonArray: JsonEditor,
  };

// 配置卡片组件
function ConfigCard({
  schema,
  value,
  modified,
  error,
  uploading,
  onChange,
  onImageUpload,
}: {
  schema: ConfigSchema;
  value: string;
  modified: boolean;
  error?: string;
  uploading?: boolean;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => void;
}) {
  const Editor = EDITOR_COMPONENTS[schema.type];
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors",
        modified ? "border-primary/50" : "border-border/70",
        error && "border-red-500"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {schema.label}
            </h3>
            {schema.public && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                公开
              </span>
            )}
            {modified && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                已修改
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {schema.description || "暂无描述"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 border-t border-border/70 pt-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Key:</span> {schema.key}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Type:</span> {schema.type}
          </p>
          {schema.defaultValue && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Default:</span> {schema.defaultValue}
            </p>
          )}
        </div>
      )}

      <div className="mt-4">
        <Editor
          schema={schema}
          value={value}
          error={error}
          uploading={uploading}
          onChange={onChange}
          onImageUpload={onImageUpload}
        />
      </div>
    </div>
  );
}

// 分组 Tab 组件
function GroupTabs({
  groups,
  activeGroup,
  onChange,
  counts,
}: {
  groups: string[];
  activeGroup: string;
  onChange: (group: string) => void;
  counts: Record<string, number>;
}) {
  return (
    <Tabs value={activeGroup} onValueChange={onChange}>
      <TabsList className="min-w-max gap-2">
        <TabsTrigger value="__all__">
          全部 ({counts["__all__"] || 0})
        </TabsTrigger>
        {groups.map((group) => (
          <TabsTrigger key={group} value={group}>
            {group} ({counts[group] || 0})
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

// ==================== 主页面组件 ====================

type DashboardCopy = ReturnType<typeof getDashboardCopy>;

export function DashboardConfigsPageV2() {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const text = copy.pages.configs;
  const { ready } = useDashboardGuard();
  const { compressImage } = useImageCompression();

  // 状态
  const [schemas, setSchemas] = useState<ConfigSchema[]>([]);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [activeGroup, setActiveGroup] = useState("__all__");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // 从 API 加载现有配置值
  const loadConfigs = useCallback(async () => {
    try {
      const response = await configControllerFindAll();
      const items = (response?.data?.data?.data || []) as ConfigItem[];

      // 过滤掉 telegram 相关的配置
      const filteredItems = items.filter((item) =>
        !item.key.toLowerCase().includes('telegram')
      );

      // 使用映射表转换配置
      const mappedSchemas = filteredItems.map((item) => getConfigSchemaByKey(item));

      setSchemas(mappedSchemas);
      setConfigs(filteredItems);

      // 初始化 drafts
      const initialDrafts: Record<string, string> = {};
      filteredItems.forEach((item) => {
        initialDrafts[item.key] = item.value ?? "";
      });
      setDrafts(initialDrafts);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) {
      void loadConfigs();
    }
  }, [ready, loadConfigs]);

  // 获取所有分组
  const groups = useMemo(() => {
    const groupSet = new Set<string>();
    schemas.forEach((schema) => groupSet.add(schema.group));
    return Array.from(groupSet).sort();
  }, [schemas]);

  // 过滤可见的配置
  const visibleSchemas = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return schemas.filter((schema) => {
      // 关键词过滤
      const matchesKeyword =
        !normalizedKeyword ||
        schema.key.toLowerCase().includes(normalizedKeyword) ||
        schema.label.toLowerCase().includes(normalizedKeyword) ||
        schema.description?.toLowerCase().includes(normalizedKeyword);

      // 分组过滤
      const matchesGroup =
        activeGroup === "__all__" || schema.group === activeGroup;

      // 注意：管理后台显示所有配置，不应用 when 条件过滤
      // when 条件仅用于前端展示控制，不用于管理后台

      return matchesKeyword && matchesGroup;
    });
  }, [schemas, keyword, activeGroup]);

  // 统计数量
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { __all__: schemas.length };
    groups.forEach((group) => {
      counts[group] = schemas.filter((s) => s.group === group).length;
    });
    return counts;
  }, [schemas, groups]);

  // 获取修改过的配置
  const modifiedSchemas = useMemo(() => {
    return visibleSchemas.filter((schema) => {
      const currentValue = drafts[schema.key] ?? "";
      const config = configs.find((c) => c.key === schema.key);
      const originalValue = config?.value ?? getConfigDefaultValue(schema);
      return currentValue !== originalValue;
    });
  }, [visibleSchemas, drafts, configs]);

  // 是否有未保存的更改
  const hasUnsavedChanges = modifiedSchemas.length > 0;

  // 处理值变更
  const handleValueChange = useCallback((key: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));

    // 清除该字段的错误
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // 处理图片上传
  const handleImageUpload = useCallback(
    async (key: string, file: File) => {
      setUploadingKey(key);
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      try {
        const originalFile = file;
        const compressedResult = await compressImage(file);
        const metadata = await buildUploadMetadata([originalFile]);

        const { data } = await uploadControllerUploadFile({
          body: { file: compressedResult.file, metadata },
        });

        const uploadedUrl = data?.data?.[0]?.url || "";
        if (!uploadedUrl) {
          throw new Error("上传失败");
        }

        setDrafts((prev) => ({ ...prev, [key]: uploadedUrl }));
      } catch {
        setErrors((prev) => ({ ...prev, [key]: "图片上传失败" }));
      } finally {
        setUploadingKey(null);
      }
    },
    [compressImage]
  );

  // 批量保存
  const handleBatchSave = useCallback(async () => {
    if (modifiedSchemas.length === 0) return;

    // 验证所有修改的配置
    const newErrors: Record<string, string> = {};
    let hasError = false;

    for (const schema of modifiedSchemas) {
      const value = drafts[schema.key] ?? "";
      const result = validateConfigValue(value, schema);
      if (!result.valid) {
        newErrors[schema.key] = result.message || "验证失败";
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);

    try {
      // 构建更新数据
      const configsToUpdate = modifiedSchemas
        .map((schema) => {
          const config = configs.find((c) => c.key === schema.key);
          if (!config) return null;
          return {
            id: config.id,
            key: schema.key,
            value: drafts[schema.key] ?? "",
          };
        })
        .filter(Boolean);

      await configControllerUpdateAll({
        body: configsToUpdate as { id: number; key: string; value: string }[],
      });

      // 更新本地状态
      await loadConfigs();
      setErrors({});
    } catch {
      alert(text.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }, [modifiedSchemas, drafts, configs, text.saveFailed, loadConfigs]);

  if (!ready || loading) {
    return <DashboardLoadingView text={copy.common.loading} />;
  }

  if (error) {
    return (
      <DashboardErrorView
        title={text.loadFailedTitle}
        description={text.loadFailedDescription}
        retryLabel={copy.common.retry}
        onRetry={() => void loadConfigs()}
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
            {/* 头部工具栏 */}
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {text.title}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  共 {visibleSchemas.length} 项配置
                  {hasUnsavedChanges && (
                    <span className="ml-2 text-primary">
                      · {modifiedSchemas.length} 项未保存
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-8 rounded-full px-4"
                  onClick={() => void loadConfigs()}
                >
                  {copy.common.refresh}
                </Button>
                {hasUnsavedChanges && (
                  <Button
                    variant="primary"
                    className="h-8 rounded-full px-4"
                    onClick={handleBatchSave}
                    loading={isSaving}
                  >
                    <Save className="mr-1 size-4" />
                    {copy.common.save} ({modifiedSchemas.length})
                  </Button>
                )}
              </div>
            </div>

            {/* 搜索栏 */}
            <div className="border-b border-border/70 px-4 py-3">
              <Input
                fullWidth
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={text.searchPlaceholder}
                className="h-10"
              />
            </div>

            {/* 分组 Tab */}
            <div className="overflow-x-auto border-b border-border/70 px-4 py-3">
              <GroupTabs
                groups={groups}
                activeGroup={activeGroup}
                onChange={setActiveGroup}
                counts={groupCounts}
              />
            </div>
          </div>
        }
      >
        {/* 配置列表 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {visibleSchemas.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {visibleSchemas.map((schema) => (
                <ConfigCard
                  key={schema.key}
                  schema={schema}
                  value={drafts[schema.key] ?? getConfigDefaultValue(schema)}
                  modified={modifiedSchemas.some((s) => s.key === schema.key)}
                  error={errors[schema.key]}
                  uploading={uploadingKey === schema.key}
                  onChange={(value) => handleValueChange(schema.key, value)}
                  onImageUpload={(file) => handleImageUpload(schema.key, file)}
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
