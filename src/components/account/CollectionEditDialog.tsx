"use client";

import { uploadControllerUploadFile } from "@/api";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Form, FormDescription, FormField } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib";
import { ImagePlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import AvatarEditor from "react-avatar-editor";

type CollectionEditDialogMode = "create" | "edit";
type EditorMode = "avatar" | "cover" | null;

type CollectionEditDialogValues = {
  name: string;
  description?: string;
  isPublic?: boolean;
  avatar?: string;
  cover?: string;
};

type CollectionEditDialogProps = {
  open: boolean;
  mode?: CollectionEditDialogMode;
  loading?: boolean;
  error?: string | null;
  initialValues?: CollectionEditDialogValues;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    values: Required<CollectionEditDialogValues>,
  ) => Promise<void> | void;
};

const DEFAULT_VALUES: Required<CollectionEditDialogValues> = {
  name: "",
  description: "",
  isPublic: true,
  avatar: "",
  cover: "",
};

export function CollectionEditDialog({
  open,
  mode = "create",
  loading = false,
  error,
  initialValues,
  onOpenChange,
  onSubmit,
}: CollectionEditDialogProps) {
  const t = useTranslations("accountCollectionList.dialog");
  const editorRef = useRef<AvatarEditor>(null);
  const [name, setName] = useState(DEFAULT_VALUES.name);
  const [description, setDescription] = useState(DEFAULT_VALUES.description);
  const [isPublic, setIsPublic] = useState(DEFAULT_VALUES.isPublic);
  const [avatar, setAvatar] = useState(DEFAULT_VALUES.avatar);
  const [cover, setCover] = useState(DEFAULT_VALUES.cover);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [editorScale, setEditorScale] = useState(1);
  const [editorUploading, setEditorUploading] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(
    null,
  );

  const values = useMemo(
    () => ({
      name: initialValues?.name ?? DEFAULT_VALUES.name,
      description: initialValues?.description ?? DEFAULT_VALUES.description,
      isPublic: initialValues?.isPublic ?? DEFAULT_VALUES.isPublic,
      avatar: initialValues?.avatar ?? DEFAULT_VALUES.avatar,
      cover: initialValues?.cover ?? DEFAULT_VALUES.cover,
    }),
    [initialValues],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(values.name);
    setDescription(values.description);
    setIsPublic(values.isPublic);
    setAvatar(values.avatar);
    setCover(values.cover);
    setErrors({});
    setTouched({});
    setEditorMode(null);
    setSelectedImage(null);
    setEditorScale(1);
    setLastTouchDistance(null);
  }, [open, values]);

  const handleSelectImage =
    (modeValue: Exclude<EditorMode, null>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      setSelectedImage(file);
      setEditorMode(modeValue);
      setEditorScale(1);
      setLastTouchDistance(null);
    };

  const handleSaveEditor = async () => {
    if (!editorRef.current || !selectedImage || !editorMode) {
      return;
    }

    setEditorUploading(true);

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

      const uploadedUrl = data?.data?.[0]?.url || "";
      if (!uploadedUrl) {
        return;
      }

      if (editorMode === "avatar") {
        setAvatar(uploadedUrl);
      } else {
        setCover(uploadedUrl);
      }

      setEditorMode(null);
      setSelectedImage(null);
      setEditorScale(1);
      setLastTouchDistance(null);
    } catch (uploadError) {
      console.error(`Failed to upload collection ${editorMode}:`, uploadError);
    } finally {
      setEditorUploading(false);
    }
  };

  const handleCancelEditor = () => {
    setEditorMode(null);
    setSelectedImage(null);
    setEditorScale(1);
    setLastTouchDistance(null);
  };

  const handleEditorWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY * -0.001;
    setEditorScale((prev) => Math.min(Math.max(prev + delta, 1), 3));
  };

  const getTouchDistance = (touches: React.TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleEditorTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      setLastTouchDistance(getTouchDistance(event.touches));
    }
  };

  const handleEditorTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length === 2 && lastTouchDistance !== null) {
      event.preventDefault();
      const distance = getTouchDistance(event.touches);
      const delta = (distance - lastTouchDistance) * 0.01;
      setEditorScale((prev) => Math.min(Math.max(prev + delta, 1), 3));
      setLastTouchDistance(distance);
    }
  };

  const handleEditorTouchEnd = () => {
    setLastTouchDistance(null);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setErrors({ name: t("fields.nameRequired") });
      setTouched({ name: true });
      return;
    }

    setErrors({});
    await onSubmit({
      name: trimmedName,
      description: trimmedDescription,
      isPublic,
      avatar,
      cover,
    });
  };

  const isEditingAvatar = editorMode === "avatar";
  const editorTitle = isEditingAvatar
    ? t("fields.avatarEditorTitle")
    : t("fields.coverEditorTitle");
  const editorHint = isEditingAvatar
    ? t("fields.avatarEditorHint")
    : t("fields.coverEditorHint");
  const editorFrameClassName = isEditingAvatar
    ? "aspect-square max-w-xs self-center"
    : "aspect-21/8";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading && !editorUploading) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="flex max-h-[85vh] max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card p-5">
        <DialogHeader className="mb-0 shrink-0 space-y-1">
          <DialogTitle className="font-semibold">
            {editorMode ? editorTitle : t(`${mode}.title`)}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
          {editorMode && selectedImage ? (
            <div className="flex flex-col gap-4 py-2">
              {!isEditingAvatar ? (
                <div className="overflow-hidden rounded-xl border border-border bg-background">
                  <div className="relative aspect-21/8 overflow-hidden bg-muted">
                    {cover ? (
                      <ImageWithFallback
                        src={cover}
                        alt={t("fields.coverPreviewAlt")}
                        fill
                        className="object-cover opacity-60"
                      />
                    ) : null}
                    <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/45 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <Avatar
                        url={avatar || cover}
                        className="size-16 border-3 border-card"
                        alt={t("fields.avatarPreviewAlt")}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div
                className={cn(
                  "w-full overflow-hidden rounded-xl border border-border bg-muted touch-none",
                  editorFrameClassName,
                )}
                onWheel={handleEditorWheel}
                onTouchStart={handleEditorTouchStart}
                onTouchMove={handleEditorTouchMove}
                onTouchEnd={handleEditorTouchEnd}
              >
                <AvatarEditor
                  ref={editorRef}
                  image={selectedImage}
                  width={isEditingAvatar ? 400 : 1050}
                  height={isEditingAvatar ? 400 : 450}
                  border={0}
                  borderRadius={isEditingAvatar ? 200 : 0}
                  color={[0, 0, 0, 0.6]}
                  scale={editorScale}
                  rotate={0}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>

              <p className="text-center text-xs text-secondary">{editorHint}</p>

              <DialogFooter className="mt-2 flex justify-end gap-4!">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={handleCancelEditor}
                  disabled={editorUploading}
                >
                  {t("actions.cancel")}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="rounded-full"
                  onClick={() => void handleSaveEditor()}
                  loading={editorUploading}
                >
                  {t("actions.confirm")}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <Form
              className="space-y-4"
              errors={errors}
              touched={touched}
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <FormField name="cover" label={t("fields.coverLabel")}>
                <div className="space-y-3">
                  <input
                    id="collection-cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSelectImage("cover")}
                  />
                  <input
                    id="collection-avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSelectImage("avatar")}
                  />

                  <div className="overflow-hidden rounded-xl border border-border bg-background">
                    <div className="relative aspect-21/8 overflow-hidden bg-muted">
                      {cover ? (
                        <ImageWithFallback
                          src={cover}
                          alt={t("fields.coverPreviewAlt")}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-secondary">
                          <ImagePlus className="size-6" />
                        </div>
                      )}

                      <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/45 to-transparent" />

                      <div className="absolute bottom-3 left-3">
                        <label
                          htmlFor="collection-avatar-upload"
                          className="relative block cursor-pointer"
                        >
                          <Avatar
                            url={avatar || cover}
                            className="size-16 border-3 border-card transition-opacity hover:opacity-90"
                            alt={t("fields.avatarPreviewAlt")}
                          />
                        </label>
                      </div>

                      {cover ? (
                        <button
                          type="button"
                          onClick={() => setCover("")}
                          className="absolute right-3 top-3 rounded-full bg-background/85 p-1.5 text-foreground transition-colors hover:bg-background"
                          aria-label={t("fields.removeCover")}
                        >
                          <X className="size-4" />
                        </button>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-3 px-3 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {t("fields.coverLabel")}
                        </div>
                        <FormDescription className="mt-1 text-xs text-secondary">
                          {t("fields.coverHint")}
                        </FormDescription>
                      </div>

                      <label
                        htmlFor="collection-cover-upload"
                        className={cn(
                          "inline-flex h-7 cursor-pointer truncate items-center justify-center rounded-full border-2 border-primary px-4 text-sm font-medium text-primary transition-all duration-200",
                          "hover:bg-primary hover:text-white",
                        )}
                      >
                        {cover
                          ? t("fields.replaceCover")
                          : t("fields.uploadCover")}
                      </label>
                    </div>
                  </div>
                </div>
              </FormField>

              <FormField name="name" label={t("fields.nameLabel")} required>
                <Input
                  name="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (errors.name) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  onBlur={() =>
                    setTouched((prev) => ({
                      ...prev,
                      name: true,
                    }))
                  }
                  placeholder={t("fields.namePlaceholder")}
                  maxLength={50}
                  fullWidth
                  showMaxLength
                  error={Boolean(touched.name && errors.name)}
                  className="h-11 rounded-xl"
                />
              </FormField>

              <FormField name="description" label={t("fields.descriptionLabel")}>
                <div className="space-y-2">
                  <textarea
                    id="collection-description"
                    name="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={t("fields.descriptionPlaceholder")}
                    maxLength={200}
                    className="min-h-28 w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary hover:border-primary"
                  />
                  <FormDescription className="text-right text-xs text-secondary">
                    {description.length}/200
                  </FormDescription>
                </div>
              </FormField>

              <FormField name="isPublic" label={t("fields.publicLabel")}>
                <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background px-3 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {t("fields.publicLabel")}
                    </div>
                    <FormDescription className="mt-1 text-xs leading-5 text-secondary">
                      {t("fields.publicHint")}
                    </FormDescription>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    className="mt-0.5 shrink-0"
                  />
                </div>
              </FormField>

              {error ? <p className="text-sm text-red-500">{error}</p> : null}

              <DialogFooter className="mt-6 flex justify-end gap-4!">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  {t("actions.cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="rounded-full"
                  loading={loading}
                  disabled={!name.trim()}
                >
                  {t(`actions.${mode}`)}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
