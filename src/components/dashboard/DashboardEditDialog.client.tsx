"use client";

import { uploadControllerUploadFile } from "@/api";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Form, FormField } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib";
import { ImagePlus } from "lucide-react";
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
  | "image";

export type DashboardEditField = {
  name: string;
  label: string;
  type?: DashboardEditFieldType;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  step?: number;
};

type ImageEditorMode = "avatar" | "background" | "raw";

type DashboardEditDialogProps = {
  open: boolean;
  title: string;
  fields: DashboardEditField[];
  initialValues: Record<string, string | number | boolean | null | undefined>;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Record<string, string | number | boolean | undefined>) => Promise<void> | void;
};

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
  const editorRef = useRef<AvatarEditor>(null);
  const [values, setValues] = useState<Record<
    string,
    string | number | boolean | null | undefined
  >>({});
  const [editingImageField, setEditingImageField] = useState<DashboardEditField | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [uploadingImage, setUploadingImage] = useState(false);

  const normalizedInitialValues = useMemo(() => {
    return fields.reduce<Record<string, string | number | boolean | null | undefined>>(
      (result, field) => {
        result[field.name] = initialValues[field.name] ?? (field.type === "switch" ? false : "");
        return result;
      },
      {},
    );
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

  const handleImageSelect =
    (field: DashboardEditField) => async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      const mode = getImageEditorMode(field);

      if (mode === "raw") {
        setUploadingImage(true);

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
          file: croppedFile,
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
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="flex max-h-[88vh] max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 mb-2!">
          <DialogTitle className="text-sm font-semibold ">{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <Form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit(
                fields.reduce<Record<string, string | number | boolean | undefined>>(
                  (result, field) => {
                    result[field.name] = normalizeSubmitValue(field);
                    return result;
                  },
                  {},
                ),
              );
            }}
          >
            {fields.map((field) => {
              const type = field.type || "text";
              const value = values[field.name];

              return (
                <FormField key={field.name} name={field.name} label={field.label}>
                  {type === "textarea" ? (
                    <textarea
                      value={typeof value === "string" ? value : value == null ? "" : String(value)}
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
                  ) : null}
                  {type === "image" ? (
                    <div className="space-y-3">
                      {typeof value === "string" && value ? (
                        <div className="relative h-36 overflow-hidden rounded-xl border border-border/70 bg-card">
                          <ImageWithFallback
                            src={value}
                            alt={field.label}
                            fill
                            className={cn(
                              "object-cover",
                              getImageEditorMode(field) === "avatar" &&
                                "object-contain p-4",
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
                          {typeof value === "string" && value ? "Replace" : "Upload"}
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
                </FormField>
              );
            })}
          </Form>
        </div>
        <DialogFooter className="shrink-0 mt-2! border-t border-border px-5 py-4 gap-4!">
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
                fields.reduce<Record<string, string | number | boolean | undefined>>(
                  (result, field) => {
                    result[field.name] = normalizeSubmitValue(field);
                    return result;
                  },
                  {},
                ),
              );
            }}
          >
            {copy.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
      {editingImageField && selectedImage ? (
        <Dialog open onOpenChange={(nextOpen) => !nextOpen && setEditingImageField(null)}>
          <DialogContent className="max-w-2xl">
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
                  width={getImageEditorMode(editingImageField) === "avatar" ? 400 : 1050}
                  height={getImageEditorMode(editingImageField) === "avatar" ? 400 : 450}
                  border={0}
                  borderRadius={getImageEditorMode(editingImageField) === "avatar" ? 200 : 0}
                  color={[0, 0, 0, 0.6]}
                  scale={imageScale}
                  rotate={0}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              <div className="flex justify-end gap-3">
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
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </Dialog>
  );
}
