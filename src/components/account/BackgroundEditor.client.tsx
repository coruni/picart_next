"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import AvatarEditor from "react-avatar-editor";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { userControllerUpdate, uploadControllerUploadFile } from "@/api";
import type { UserDetail } from "@/types";
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
  const [backgroundUrl, setBackgroundUrl] = useState(user.background || "");

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

      const { data } = await uploadControllerUploadFile({
        body: {
          file: croppedFile,
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
      console.error("Failed to upload background:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedImage(null);
    setScale(1);
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

  const handleTouchEnd = () => {
    setLastTouchDistance(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0! border-0">
        <DialogHeader className="mb-0">
          <div
            style={{ backgroundImage: `url(${user?.background})` }}
            className="h-46 bg-center bg-no-repeat bg-cover relative" 
          >
            <div className="pl-6 bg-linear-to-b from-black/60 to-transparent">
              <h2 className="leading-12 text-white text-sm font-semibold">
                修改背景图
              </h2>
            </div>
            <div className="absolute bottom-0 left-0 w-full">
              <div className="bg-card h-9 px-6 w-full relative flex items-end">
                {" "}
                {/* 使用 flex 对齐 */}
                <Avatar
                  url={user?.avatar}
                  
                  className="absolute bottom-0 size-40"
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
                className="w-full aspect-21/9 rounded-lg overflow-hidden cursor-move touch-none"
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <AvatarEditor
                  ref={editorRef}
                  image={selectedImage}
                  width={1050}
                  height={450}
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
