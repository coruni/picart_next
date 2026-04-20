"use client";

import { uploadControllerUploadFile, userControllerUpdate } from "@/api";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/Dialog";
import { useRouter } from "@/i18n/routing";
import { showToast, getErrorMessage } from "@/lib";
import { buildUploadMetadata } from "@/lib/file-hash";
import type { UserDetail } from "@/types";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import { Avatar } from "../ui/Avatar";
type BackgroundEditorProps = {
  user: UserDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const BackgroundEditor = ({
  user,
  open,
  onOpenChange,
}: BackgroundEditorProps) => {
  const t = useTranslations("profile.edit");
  const router = useRouter();
  const editorRef = useRef<AvatarEditor>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [scale, setScale] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(
    null,
  );
  const [_backgroundUrl, _setBackgroundUrl] = useState(user.background || "");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setScale(1);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!editorRef.current || !selectedImage) return;

    setUploading(true);
    try {
      const canvas = editorRef.current.getImageScaledToCanvas();
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob!);
          },
          "image/jpeg",
          0.95,
        );
      });

      const croppedFile = new File([blob], selectedImage.name, {
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
        const newBackgroundUrl = data.data[0].url!;

        await userControllerUpdate({
          path: { id: String(user.id) },
          body: {
            background: newBackgroundUrl,
          },
        });

        onOpenChange(false);
        setSelectedImage(null);
        router.refresh();
      }
    } catch (error) {
      // 审核不通过或其他错误时关闭对话框
      onOpenChange(false);
      setSelectedImage(null);
      setScale(1);
      setUploading(false);
      setLastTouchDistance(null);
      console.error("Failed to upload background:", error);
      showToast(getErrorMessage(error, "背景图上传失败"));
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedImage(null);
    setScale(1);
    setUploading(false);
    setLastTouchDistance(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(scale + delta, 1), 3);
    setScale(newScale);
  };

  const getTouchDistance = (touches: React.TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance !== null) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const delta = (distance - lastTouchDistance) * 0.01;
      const newScale = Math.min(Math.max(scale + delta, 1), 3);
      setScale(newScale);
      setLastTouchDistance(distance);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Dialog 关闭时（点击X或遮罩层）重置状态
      setSelectedImage(null);
      setScale(1);
      setUploading(false);
      setLastTouchDistance(null);
    }
    onOpenChange(open);
  };

  const handleTouchEnd = () => {
    setLastTouchDistance(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0! border-0 overflow-hidden">
        <DialogHeader className="mb-0 p-0">
          <div
            style={{ backgroundImage: `url(${user?.background})` }}
            className="h-46 bg-center bg-no-repeat bg-cover relative"
          >
            <div className="pl-6 bg-linear-to-b from-black/60 to-transparent">
              <h2 className="leading-12 text-white text-sm font-semibold">
                {t("cropBackground")}
              </h2>
            </div>
            <div className="absolute bottom-0 left-0 w-full">
              <div className="bg-card h-9 px-6 w-full relative flex items-end">
                {" "}
                {/* 浣跨敤 flex 瀵归綈 */}
                <Avatar
                  url={user?.avatar}
                  className="absolute bottom-0 size-20"
                />
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="bg-background h-2" id="split-line"></div>

        <div className="flex flex-col gap-4 py-4 px-6">
          {selectedImage ? (
            <>
              {/* Crop area */}
              <div
                className="w-full h-56 md:h-[300px] rounded-lg overflow-hidden cursor-move touch-none"
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <AvatarEditor
                  ref={editorRef}
                  image={selectedImage}
                  width={700}
                  height={300}
                  border={0}
                  borderRadius={0}
                  color={[0, 0, 0, 0.6]}
                  scale={scale}
                  rotate={0}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>

              <p className="text-xs text-gray-500 text-center">
                {t("backgroundEditorHint")}
              </p>

              <div className="flex gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleCancel}
                  disabled={uploading}
                  className="flex-1 rounded-full h-9"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="md"
                  onClick={handleSave}
                  loading={uploading}
                  className="flex-1 rounded-full h-9"
                >
                  {t("confirm")}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <input
                id="background-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="background-file-input"
                className="cursor-pointer px-6 py-2  bg-primary text-sm text-white rounded-full hover:bg-primary/90 transition-colors"
              >
                {t("selectImage")}
              </label>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
