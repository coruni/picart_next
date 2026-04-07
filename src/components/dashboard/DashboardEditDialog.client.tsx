"use client";

import { uploadControllerUploadFile } from "@/api";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Form, FormField } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { TimePicker } from "@/components/ui/TimePicker";
import { useClickOutside } from "@/hooks";
import { useImageCompression } from "@/hooks/useImageCompression";
import { cn } from "@/lib";
import { ChevronDown, ImagePlus, Loader2, Search, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import { getDashboardCopy } from "./copy";

type DashboardEditFieldType =
  | "text"
  | "textarea"
  | "number"
  | "switch"
  | "select"
  | "categorySelect"
  | "image"
  | "date"
  | "time";

export type DashboardEditField = {
  name: string;
  label: string;
  type?: DashboardEditFieldType;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  searchable?: boolean;
  searchPlaceholder?: string;
  loadOptions?: (
    keyword: string,
  ) => Promise<Array<{ value: string; label: string }>>;
  min?: number;
  step?: number;
  imagePreviewClassName?: string;
  imageObjectFit?: "cover" | "contain";
};

type ImageEditorMode = "avatar" | "background" | "raw";

type DashboardEditDialogProps = {
  open: boolean;
  title: string;
  fields: DashboardEditField[];
  initialValues: Record<string, string | number | boolean | null | undefined>;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    values: Record<string, string | number | boolean | undefined>,
  ) => Promise<void> | void;
};

function DashboardSearchSelectField({
  field,
  value,
  onChange,
}: {
  field: DashboardEditField;
  value: string;
  onChange: (value: string) => void;
}) {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [asyncOptions, setAsyncOptions] = useState<
    Array<{ value: string; label: string }>
  >(field.options || []);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  useClickOutside(containerRef, () => setIsOpen(false));

  useEffect(() => {
    setAsyncOptions(field.options || []);
  }, [field.options]);

  useEffect(() => {
    if (!field.searchable || !field.loadOptions || !isOpen) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    const timer = setTimeout(() => {
      void field
        .loadOptions?.(keyword.trim())
        .then((nextOptions) => {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }

          setAsyncOptions(nextOptions);
        })
        .finally(() => {
          if (requestIdRef.current === currentRequestId) {
            setLoading(false);
          }
        });
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [field, isOpen, keyword]);

  const resolvedOptions = asyncOptions;
  const selectedOption = resolvedOptions.find(
    (option) => option.value === value,
  );

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "relative min-h-10 h-full min-w-0 rounded-lg border border-border bg-card px-3 py-2",
          "flex items-center justify-between gap-2 overflow-hidden",
          "focus-within:border-primary focus-within:ring-primary",
          "hover:border-primary transition-colors",
        )}
        onClick={() => setIsOpen(true)}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            !selectedOption && "text-gray-400",
          )}
        >
          {selectedOption?.label ||
            field.placeholder ||
            copy.common.selectPlaceholder}
        </span>
        {value ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onChange("");
              setKeyword("");
            }}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={14} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsOpen((previous) => !previous);
          }}
          className="flex size-5 shrink-0 items-center justify-center"
        >
          <ChevronDown
            className={cn(
              "size-4 text-gray-500 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      <div
        className={cn(
          "absolute z-30 mt-1 left-0 right-0 min-w-0 origin-top overflow-hidden rounded-lg border border-border bg-card shadow-lg transition-[opacity,transform] duration-160 ease-out",
          isOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        <div className="border-b border-border/70 px-2 py-2">
          <div
            className={cn(
              "relative min-h-10 h-full min-w-0 rounded-lg border border-border bg-card px-3 py-2",
              "flex items-center justify-between gap-2 overflow-hidden",
              "focus-within:border-primary focus-within:ring-primary",
              "hover:border-primary transition-colors",
            )}
          >
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={field.searchPlaceholder || field.placeholder}
              className="min-w-10 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            <div className="flex items-center">
              <div className="flex size-6 shrink-0 items-center justify-center">
                {loading ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : keyword ? (
                  <button
                    type="button"
                    onClick={() => setKeyword("")}
                    className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="max-h-64 overflow-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>{copy.common.loading}</span>
            </div>
          ) : resolvedOptions.length ? (
            resolvedOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  setKeyword("");
                }}
                className={cn(
                  "mb-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-primary/10",
                  option.value === value && "bg-primary/10 text-primary",
                )}
              >
                <span className="truncate">{option.label}</span>
              </button>
            ))
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              -
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardEditDialog({
  open,
  title,
  fields,
  initialValues,
  loading = false,
  onOpenChange,
  onSubmit,
}: DashboardEditDialogProps) {
  const locale = useLocale();
  const copy = getDashboardCopy(locale);
  const { compressImage } = useImageCompression();
  const editorRef = useRef<AvatarEditor>(null);
  const [values, setValues] = useState<
    Record<string, string | number | boolean | null | undefined>
  >({});
  const [editingImageField, setEditingImageField] =
    useState<DashboardEditField | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [uploadingImage, setUploadingImage] = useState(false);

  const normalizedInitialValues = useMemo(() => {
    return fields.reduce<
      Record<string, string | number | boolean | null | undefined>
    >((result, field) => {
      result[field.name] =
        initialValues[field.name] ?? (field.type === "switch" ? false : "");
      return result;
    }, {});
  }, [fields, initialValues]);

  useEffect(() => {
    if (open) {
      setValues(normalizedInitialValues);
      setEditingImageField(null);
      setSelectedImage(null);
      setImageScale(1);
    }
  }, [normalizedInitialValues, open]);

  const getImageEditorMode = (field: DashboardEditField): ImageEditorMode => {
    const key = field.name.toLowerCase();

    if (key.includes("avatar")) {
      return "avatar";
    }

    if (key.includes("cover") || key.includes("background")) {
      return "background";
    }

    return "raw";
  };

  const getImagePreviewClassName = (field: DashboardEditField) => {
    if (field.imagePreviewClassName) {
      return field.imagePreviewClassName;
    }

    return getImageEditorMode(field) === "avatar"
      ? "aspect-square h-auto w-full max-w-52"
      : "h-36";
  };

  const getImagePreviewObjectClassName = (field: DashboardEditField) => {
    if (field.imageObjectFit === "contain") {
      return "object-contain";
    }

    if (field.imageObjectFit === "cover") {
      return "object-cover";
    }

    return getImageEditorMode(field) === "avatar"
      ? "object-contain"
      : "object-cover";
  };

  const handleImageSelect =
    (field: DashboardEditField) =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      const mode = getImageEditorMode(field);

      if (mode === "raw") {
        setUploadingImage(true);

        try {
          // 压缩图片
          const compressedResult = await compressImage(file);
          const compressedFile = compressedResult.file;

          const { data } = await uploadControllerUploadFile({
            body: {
              file: compressedFile,
            },
          });

          const uploadedUrl = data?.data?.[0]?.url;
          if (uploadedUrl) {
            setValues((previous) => ({
              ...previous,
              [field.name]: uploadedUrl,
            }));
          }
        } finally {
          setUploadingImage(false);
        }

        return;
      }

      setSelectedImage(file);
      setEditingImageField(field);
      setImageScale(1);
    };

  const handleSaveEditedImage = async () => {
    if (!editingImageField || !selectedImage || !editorRef.current) {
      return;
    }

    setUploadingImage(true);

    try {
      const canvas = editorRef.current.getImageScaledToCanvas();
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (nextBlob) => {
            resolve(nextBlob!);
          },
          "image/jpeg",
          0.95,
        );
      });

      const croppedFile = new File([blob], selectedImage.name, {
        type: "image/jpeg",
      });

      // 压缩裁剪后的图片
      const compressedResult = await compressImage(croppedFile);
      const compressedFile = compressedResult.file;

      const { data } = await uploadControllerUploadFile({
        body: {
          file: compressedFile,
        },
      });

      const uploadedUrl = data?.data?.[0]?.url;
      if (uploadedUrl) {
        setValues((previous) => ({
          ...previous,
          [editingImageField.name]: uploadedUrl,
        }));
      }

      setEditingImageField(null);
      setSelectedImage(null);
      setImageScale(1);
    } finally {
      setUploadingImage(false);
    }
  };

  const normalizeSubmitValue = (field: DashboardEditField) => {
    const value = values[field.name];

    if (field.type === "switch") {
      return Boolean(value);
    }

    if (field.type === "number") {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }

      const nextValue = Number(value);
      return Number.isNaN(nextValue) ? undefined : nextValue;
    }

    if (value === null || value === undefined) {
      return undefined;
    }

    return String(value).trim();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}
    >
      <DialogContent className="flex max-h-[88vh] max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 mb-0!">
          <DialogTitle className="text-sm font-semibold ">{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <Form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit(
                fields.reduce<
                  Record<string, string | number | boolean | undefined>
                >((result, field) => {
                  result[field.name] = normalizeSubmitValue(field);
                  return result;
                }, {}),
              );
            }}
          >
            {fields.map((field) => {
              const type = field.type || "text";
              const value = values[field.name];

              return (
                <FormField
                  key={field.name}
                  name={field.name}
                  label={field.label}
                >
                  {type === "textarea" ? (
                    <textarea
                      value={
                        typeof value === "string"
                          ? value
                          : value == null
                            ? ""
                            : String(value)
                      }
                      onChange={(event) =>
                        setValues((previous) => ({
                          ...previous,
                          [field.name]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className={cn(
                        "flex min-h-28 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition-colors",
                        "placeholder:text-gray-400 focus:border-primary focus:ring-primary hover:border-primary",
                      )}
                    />
                  ) : null}
                  {type === "number" ? (
                    <Input
                      fullWidth
                      type="number"
                      value={
                        typeof value === "number" || typeof value === "string"
                          ? value
                          : ""
                      }
                      min={field.min}
                      step={field.step}
                      placeholder={field.placeholder}
                      onChange={(event) =>
                        setValues((previous) => ({
                          ...previous,
                          [field.name]: event.target.value,
                        }))
                      }
                    />
                  ) : null}
                  {type === "switch" ? (
                    <div className="flex h-10 items-center">
                      <Switch
                        checked={Boolean(value)}
                        onCheckedChange={(nextValue) =>
                          setValues((previous) => ({
                            ...previous,
                            [field.name]: nextValue,
                          }))
                        }
                      />
                    </div>
                  ) : null}
                  {type === "select" ? (
                    field.searchable && field.loadOptions ? (
                      <DashboardSearchSelectField
                        field={field}
                        value={typeof value === "string" ? value : ""}
                        onChange={(nextValue) =>
                          setValues((previous) => ({
                            ...previous,
                            [field.name]: nextValue,
                          }))
                        }
                      />
                    ) : (
                      <Select
                        value={typeof value === "string" ? value : ""}
                        onChange={(nextValue) =>
                          setValues((previous) => ({
                            ...previous,
                            [field.name]: nextValue,
                          }))
                        }
                        options={field.options || []}
                        placeholder={field.placeholder}
                      />
                    )
                  ) : null}
                  {type === "categorySelect" ? (
                    <CategorySelect
                      value={typeof value === "string" ? value : ""}
                      onChange={(nextValue) =>
                        setValues((previous) => ({
                          ...previous,
                          [field.name]: nextValue,
                        }))
                      }
                      placeholder={field.placeholder}
                    />
                  ) : null}
                  {type === "image" ? (
                    <div className="space-y-3">
                      {typeof value === "string" && value ? (
                        <div
                          className={cn(
                            "relative h-36 overflow-hidden rounded-xl border border-border bg-card",
                            getImagePreviewClassName(field),
                          )}
                        >
                          <ImageWithFallback
                            src={value}
                            alt={field.label}
                            fill
                            className={cn(
                              field.imageObjectFit === "contain"
                                ? "object-contain"
                                : "object-cover",
                              getImageEditorMode(field) === "avatar" &&
                                "object-cover rounded-full p-4",
                            )}
                          />
                        </div>
                      ) : null}
                      <div className="flex items-center gap-3">
                        <input
                          id={`dashboard-upload-${field.name}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageSelect(field)}
                        />
                        <label
                          htmlFor={`dashboard-upload-${field.name}`}
                          className={cn(
                            "inline-flex h-7 cursor-pointer items-center justify-center gap-2 rounded-full border border-border/70 px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                            uploadingImage && "pointer-events-none opacity-50",
                          )}
                        >
                          <ImagePlus className="size-4" />
                          {typeof value === "string" && value
                            ? copy.common.replace
                            : copy.common.upload}
                        </label>
                      </div>
                    </div>
                  ) : null}
                  {type === "text" ? (
                    <Input
                      fullWidth
                      value={
                        typeof value === "string" || typeof value === "number"
                          ? value
                          : ""
                      }
                      placeholder={field.placeholder}
                      onChange={(event) =>
                        setValues((previous) => ({
                          ...previous,
                          [field.name]: event.target.value,
                        }))
                      }
                    />
                  ) : null}
                  {type === "date" ? (
                    <DatePicker
                      value={
                        typeof value === "string"
                          ? value
                          : value == null
                            ? ""
                            : String(value)
                      }
                      placeholder={field.placeholder}
                      onChange={(newValue) =>
                        setValues((previous) => ({
                          ...previous,
                          [field.name]: newValue,
                        }))
                      }
                    />
                  ) : null}
                  {type === "time" ? (
                    <TimePicker
                      value={typeof value === "string" ? value : ""}
                      onChange={(nextValue) =>
                        setValues((previous) => ({
                          ...previous,
                          [field.name]: nextValue,
                        }))
                      }
                      placeholder={field.placeholder}
                    />
                  ) : null}
                </FormField>
              );
            })}
          </Form>
        </div>
        <DialogFooter className="shrink-0 mt-0! border-t border-border px-6 py-4 gap-4!">
          <Button
            variant="outline"
            className="h-7 rounded-full px-4"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {copy.common.cancel}
          </Button>
          <Button
            variant="primary"
            className="h-7 rounded-full px-4"
            loading={loading}
            onClick={() => {
              void onSubmit(
                fields.reduce<
                  Record<string, string | number | boolean | undefined>
                >((result, field) => {
                  result[field.name] = normalizeSubmitValue(field);
                  return result;
                }, {}),
              );
            }}
          >
            {copy.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
      {editingImageField && selectedImage ? (
        <Dialog
          open
          onOpenChange={(nextOpen) => !nextOpen && setEditingImageField(null)}
        >
          <DialogOverlay className="z-101" />
          <DialogContent className="max-w-md p-0!">
            <DialogHeader>
              <DialogTitle>{editingImageField.label}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div
                className={cn(
                  "overflow-hidden rounded-xl",
                  getImageEditorMode(editingImageField) === "avatar"
                    ? "mx-auto aspect-square w-full max-w-sm"
                    : "aspect-21/9 w-full",
                )}
                onWheel={(event) => {
                  event.preventDefault();
                  const delta = event.deltaY * -0.001;
                  setImageScale((previous) =>
                    Math.min(Math.max(previous + delta, 1), 3),
                  );
                }}
              >
                <AvatarEditor
                  ref={editorRef}
                  image={selectedImage}
                  width={
                    getImageEditorMode(editingImageField) === "avatar"
                      ? 400
                      : 1050
                  }
                  height={
                    getImageEditorMode(editingImageField) === "avatar"
                      ? 400
                      : 450
                  }
                  border={0}
                  borderRadius={
                    getImageEditorMode(editingImageField) === "avatar" ? 200 : 0
                  }
                  color={[0, 0, 0, 0.6]}
                  scale={imageScale}
                  rotate={0}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
            <DialogFooter className="gap-4! pb-4! px-6">
              <Button
                variant="ghost"
                className="h-7 rounded-full px-4"
                onClick={() => {
                  setEditingImageField(null);
                  setSelectedImage(null);
                  setImageScale(1);
                }}
                disabled={uploadingImage}
              >
                {copy.common.cancel}
              </Button>
              <Button
                variant="primary"
                className="h-7 rounded-full px-4"
                loading={uploadingImage}
                onClick={() => void handleSaveEditedImage()}
              >
                {copy.common.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </Dialog>
  );
}
