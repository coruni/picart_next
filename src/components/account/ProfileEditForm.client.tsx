"use client";

import { uploadControllerUploadFile, userControllerUpdate } from "@/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useRouter } from "@/i18n/routing";
import { buildUploadMetadata } from "@/lib/file-hash";
import type { UserDetail } from "@/types";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import { X } from "lucide-react";

type ProfileEditFormProps = {
  user: UserDetail;
  locale: string;
};

export const ProfileEditForm = ({ user, locale }: ProfileEditFormProps) => {
  const t = useTranslations("profile.edit");
  const router = useRouter();
  const avatarEditorRef = useRef<AvatarEditor>(null);
  const backgroundEditorRef = useRef<AvatarEditor>(null);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nickname: user.nickname || "",
    description: user.description || "",
    gender: user.gender || "male",
  });
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || "");
  const [backgroundUrl, setBackgroundUrl] = useState(user.background || "");

  // Avatar editor states
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [selectedAvatarImage, setSelectedAvatarImage] = useState<File | null>(
    null,
  );
  const [avatarScale, setAvatarScale] = useState(1);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarLastTouchDistance, setAvatarLastTouchDistance] = useState<
    number | null
  >(null);

  // Background editor states
  const [showBackgroundEditor, setShowBackgroundEditor] = useState(false);
  const [selectedBackgroundImage, setSelectedBackgroundImage] =
    useState<File | null>(null);
  const [backgroundScale, setBackgroundScale] = useState(1);
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const [backgroundLastTouchDistance, setBackgroundLastTouchDistance] =
    useState<number | null>(null);

  const saveProfile = async (overrides?: {
    avatar?: string;
    background?: string;
  }) => {
    await userControllerUpdate({
      path: { id: String(user.id) },
      body: {
        nickname: formData.nickname,
        description: formData.description,
        gender: formData.gender as "male" | "female" | "other",
        avatar: overrides?.avatar ?? avatarUrl,
        background: overrides?.background ?? backgroundUrl,
      },
    });
  };

  // Avatar handlers
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedAvatarImage(file);
    setShowAvatarEditor(true);
    setAvatarScale(1);
    e.target.value = "";
  };

  const handleSaveAvatar = async () => {
    if (!avatarEditorRef.current || !selectedAvatarImage) return;

    setAvatarUploading(true);
    try {
      const canvas = avatarEditorRef.current.getImageScaledToCanvas();
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob!);
          },
          "image/jpeg",
          0.95,
        );
      });

      const croppedFile = new File([blob], selectedAvatarImage.name, {
        type: "image/jpeg",
      });

      // 计算裁剪后文件的 hash
      const metadata = await buildUploadMetadata([croppedFile]);

      const { data } = await uploadControllerUploadFile({
        body: {
          file: croppedFile,
          metadata,
        },
      });

      if (data?.data?.[0]) {
        const nextAvatarUrl = data.data[0].url!;
        await saveProfile({ avatar: nextAvatarUrl });
        setAvatarUrl(nextAvatarUrl);
        setShowAvatarEditor(false);
        setSelectedAvatarImage(null);
      }
    } catch (error) {
      // 审核不通过或其他错误时关闭对话框
      setShowAvatarEditor(false);
      setSelectedAvatarImage(null);
      setAvatarScale(1);
      console.error("Failed to upload avatar:", error);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCancelAvatarEdit = () => {
    setShowAvatarEditor(false);
    setSelectedAvatarImage(null);
    setAvatarScale(1);
    setAvatarUploading(false);
    setAvatarLastTouchDistance(null);
  };

  const handleAvatarDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Dialog 关闭时（点击X或遮罩层）重置状态
      setSelectedAvatarImage(null);
      setAvatarScale(1);
      setAvatarUploading(false);
      setAvatarLastTouchDistance(null);
    }
    setShowAvatarEditor(open);
  };

  const handleRemoveAvatarImage = () => {
    setSelectedAvatarImage(null);
    setAvatarScale(1);
  };

  // Background handlers
  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedBackgroundImage(file);
    setShowBackgroundEditor(true);
    setBackgroundScale(1);
    e.target.value = "";
  };

  const handleSaveBackground = async () => {
    if (!backgroundEditorRef.current || !selectedBackgroundImage) return;

    setBackgroundUploading(true);
    try {
      const canvas = backgroundEditorRef.current.getImageScaledToCanvas();
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob!);
          },
          "image/jpeg",
          0.95,
        );
      });

      const croppedFile = new File([blob], selectedBackgroundImage.name, {
        type: "image/jpeg",
      });

      // 计算裁剪后文件的 hash
      const metadata = await buildUploadMetadata([croppedFile]);

      const { data } = await uploadControllerUploadFile({
        body: {
          file: croppedFile,
          metadata,
        },
      });

      if (data?.data?.[0]) {
        setBackgroundUrl(data.data[0].url!);
        setShowBackgroundEditor(false);
        setSelectedBackgroundImage(null);
      }
    } catch (error) {
      // 审核不通过或其他错误时关闭对话框
      setShowBackgroundEditor(false);
      setSelectedBackgroundImage(null);
      setBackgroundScale(1);
      console.error("Failed to upload background:", error);
    } finally {
      setBackgroundUploading(false);
    }
  };

  const handleCancelBackgroundEdit = () => {
    setShowBackgroundEditor(false);
    setSelectedBackgroundImage(null);
    setBackgroundScale(1);
    setBackgroundUploading(false);
    setBackgroundLastTouchDistance(null);
  };

  const handleBackgroundDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Dialog 关闭时（点击X或遮罩层）重置状态
      setSelectedBackgroundImage(null);
      setBackgroundScale(1);
      setBackgroundUploading(false);
      setBackgroundLastTouchDistance(null);
    }
    setShowBackgroundEditor(open);
  };

  const handleRemoveBackgroundImage = () => {
    setSelectedBackgroundImage(null);
    setBackgroundScale(1);
  };

  // Shared zoom handlers
  const getTouchDistance = (touches: React.TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Avatar zoom handlers
  const handleAvatarWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(avatarScale + delta, 1), 3);
    setAvatarScale(newScale);
  };

  const handleAvatarTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      setAvatarLastTouchDistance(distance);
    }
  };

  const handleAvatarTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && avatarLastTouchDistance !== null) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const delta = (distance - avatarLastTouchDistance) * 0.01;
      const newScale = Math.min(Math.max(avatarScale + delta, 1), 3);
      setAvatarScale(newScale);
      setAvatarLastTouchDistance(distance);
    }
  };

  const handleAvatarTouchEnd = () => {
    setAvatarLastTouchDistance(null);
  };

  // Background zoom handlers
  const handleBackgroundWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(backgroundScale + delta, 1), 3);
    setBackgroundScale(newScale);
  };

  const handleBackgroundTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      setBackgroundLastTouchDistance(distance);
    }
  };

  const handleBackgroundTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && backgroundLastTouchDistance !== null) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const delta = (distance - backgroundLastTouchDistance) * 0.01;
      const newScale = Math.min(Math.max(backgroundScale + delta, 1), 3);
      setBackgroundScale(newScale);
      setBackgroundLastTouchDistance(distance);
    }
  };

  const handleBackgroundTouchEnd = () => {
    setBackgroundLastTouchDistance(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await saveProfile();
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
        return;
      }
      router.push(`/account/${user.id}`);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* 头像上传 */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mt-4">
            <Avatar url={avatarUrl} className="mb-4 size-28" />

            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="flex gap-6 mt-2">
            <label
              htmlFor="avatar-upload"
              className="text-sm bg-[#EDF1F7] hover:bg-[#8592A3] text-black/60 hover:text-white leading-7 rounded-full cursor-pointer px-4"
            >
              {t("changeAvatar")}
            </label>
            <label
              htmlFor="background-upload"
              className="text-sm bg-[#EDF1F7] hover:bg-[#8592A3] text-black/60 hover:text-white leading-7 rounded-full cursor-pointer px-4"
            >
              {t("changeAvatarFrame")}
            </label>
            <input
              id="background-upload"
              type="file"
              accept="image/*"
              onChange={handleBackgroundChange}
              className="hidden"
            />
          </div>
        </div>

        {/* 昵称 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-secondary">
            {t("nickname")}
          </label>
          <Input
            value={formData.nickname}
            onChange={(e) =>
              setFormData({ ...formData, nickname: e.target.value })
            }
            placeholder={t("nicknamePlaceholder")}
            maxLength={20}
            fullWidth
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {formData.nickname.length}/20
          </div>
        </div>

        {/* 性别 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-secondary">
            {t("gender")}
          </label>
          <Select
            key="gender"
            value={formData.gender}
            onChange={(value) => setFormData({ ...formData, gender: value })}
            options={[
              { value: "male", label: t("genderMale") },
              { value: "female", label: t("genderFemale") },
              { value: "other", label: t("genderOther") },
            ]}
          />
        </div>

        {/* 个人签名 */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2 text-secondary">
            {t("description")}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder={t("descriptionPlaceholder")}
            maxLength={200}
            rows={4}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors placeholder:text-gray-400  focus:outline-none focus:ring-primary focus:border-primary hover:border-primary"
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {formData.description.length}/200
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-4 justify-center">
          <Button
            type="submit"
            variant="default"
            loading={loading}
            size="lg"
            className="rounded-full h-10 max-w-2xs w-full"
          >
            {t("save")}
          </Button>
        </div>
      </form>

      {/* Avatar Editor Modal */}
      <Dialog open={showAvatarEditor} onOpenChange={handleAvatarDialogOpenChange}>
        <DialogContent className="max-w-sm md:max-w-md lg:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("cropAvatar")}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {selectedAvatarImage ? (
              <>
                {/* Crop area */}
                <div className="relative w-full max-w-sm aspect-square">
                  <button
                    type="button"
                    onClick={handleRemoveAvatarImage}
                    className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-white transition-colors border border-border shadow-sm"
                    title={t("reselectImage")}
                  >
                    <X size={16} />
                  </button>
                  <div
                    className="w-full aspect-square rounded-lg overflow-hidden cursor-move touch-none"
                    onWheel={handleAvatarWheel}
                    onTouchStart={handleAvatarTouchStart}
                    onTouchMove={handleAvatarTouchMove}
                    onTouchEnd={handleAvatarTouchEnd}
                  >
                    <AvatarEditor
                      ref={avatarEditorRef}
                      image={selectedAvatarImage}
                      width={400}
                      height={400}
                      border={0}
                      borderRadius={200}
                      color={[0, 0, 0, 0.6]}
                      scale={avatarScale}
                      rotate={0}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  {t("avatarEditorHint")}
                </p>

                <div className="flex gap-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleCancelAvatarEdit}
                    disabled={avatarUploading}
                    className="flex-1 rounded-full h-9"
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="md"
                    onClick={handleSaveAvatar}
                    loading={avatarUploading}
                    className="flex-1 rounded-full h-9"
                  >
                    {t("confirm")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <input
                  id="avatar-reselect"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <label
                  htmlFor="avatar-reselect"
                  className="cursor-pointer px-6 py-2 bg-primary text-sm text-white rounded-full hover:bg-primary/90 transition-colors"
                >
                  {t("selectImage")}
                </label>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Background Editor Modal */}
      <Dialog
        open={showBackgroundEditor}
        onOpenChange={handleBackgroundDialogOpenChange}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("cropBackground")}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {selectedBackgroundImage ? (
              <>
                {/* Crop area with X button */}
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={handleRemoveBackgroundImage}
                    className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-white transition-colors border border-border shadow-sm"
                    title={t("reselectImage")}
                  >
                    <X size={16} />
                  </button>
                  <div
                    className="w-full h-56 md:h-[300px] rounded-lg overflow-hidden cursor-move touch-none"
                    onWheel={handleBackgroundWheel}
                    onTouchStart={handleBackgroundTouchStart}
                    onTouchMove={handleBackgroundTouchMove}
                    onTouchEnd={handleBackgroundTouchEnd}
                  >
                    <AvatarEditor
                      ref={backgroundEditorRef}
                      image={selectedBackgroundImage}
                      width={700}
                      height={300}
                      border={0}
                      borderRadius={0}
                      color={[0, 0, 0, 0.6]}
                      scale={backgroundScale}
                      rotate={0}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  {t("backgroundEditorHint")}
                </p>

                <div className="flex gap-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleCancelBackgroundEdit}
                    disabled={backgroundUploading}
                    className="flex-1 rounded-full h-9"
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="md"
                    onClick={handleSaveBackground}
                    loading={backgroundUploading}
                    className="flex-1 rounded-full h-9"
                  >
                    {t("confirm")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <input
                  id="background-reselect"
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundChange}
                  className="hidden"
                />
                <label
                  htmlFor="background-reselect"
                  className="cursor-pointer px-6 py-2 bg-primary text-sm text-white rounded-full hover:bg-primary/90 transition-colors"
                >
                  {t("selectImage")}
                </label>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
