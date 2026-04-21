"use client";

import {
  decorationControllerFindAll,
  decorationControllerUnuseDecoration,
  decorationControllerUseDecoration,
} from "@/api";
import { InfiniteScrollStatus } from "@/components/shared";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { cn, formatExpiryTime } from "@/lib";
import { MODAL_IDS } from "@/lib/modal-helpers";
import { useModalStore } from "@/stores/useModalStore";
import { DecorationControllerFindAllResponse } from "@/types";
import { CheckCircle2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogHeader } from "../ui/Dialog";
import { ImageWithFallback } from "../shared/ImageWithFallback";

type AvatarFrame = DecorationControllerFindAllResponse["data"]["data"][0];

export function UserAvatarFarmeDialog() {
  const t = useTranslations("avatarFrameDialog");
  const locale = useLocale();
  const avatarFrameDialogOpen = useModalStore((state) =>
    state.isOpen(MODAL_IDS.AVATAR_FRAME),
  );
  const closeModal = useModalStore((state) => state.closeModal);
  const getModalData = useModalStore((state) => state.getModalData);
  const modalData = getModalData(MODAL_IDS.AVATAR_FRAME);
  const initialFrameId = modalData?.avatarFrameId;

  const handleDialogClose = () => {
    closeModal(MODAL_IDS.AVATAR_FRAME);
  };

  const [avatarFrames, setAvatarFrames] = useState<AvatarFrame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedFrame, setSelectedFrame] = useState<AvatarFrame | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const loadAvatarFrames = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const res = await decorationControllerFindAll({
        query: {
          type: "AVATAR_FRAME",
          page,
          limit: 20,
        },
      });

      const newFrames = res?.data?.data?.data || [];
      const meta = res?.data?.data?.meta;

      if (newFrames.length === 0) {
        setHasMore(false);
      } else {
        setAvatarFrames((prev) => [...prev, ...newFrames]);
        setPage((prev) => prev + 1);

        const totalLoaded = avatarFrames.length + newFrames.length;
        if (meta?.total && totalLoaded >= meta.total) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to load avatar frames:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, avatarFrames.length]);

  // 处理初始选中项
  useEffect(() => {
    if (!initialFrameId || avatarFrames.length === 0) return;

    const targetFrame = avatarFrames.find((f) => f.id === initialFrameId);
    if (targetFrame && !selectedFrame) {
      setSelectedFrame(targetFrame);
    }
  }, [avatarFrames, initialFrameId, selectedFrame]);

  useEffect(() => {
    if (avatarFrameDialogOpen && avatarFrames.length === 0) {
      loadAvatarFrames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarFrameDialogOpen]);

  useEffect(() => {
    if (!avatarFrameDialogOpen) {
      setAvatarFrames([]);
      setPage(1);
      setHasMore(true);
      setSelectedFrame(null);
    }
  }, [avatarFrameDialogOpen]);

  useInfiniteScrollObserver({
    targetRef: observerRef,
    enabled: hasMore,
    rootRef: scrollContainerRef,
    rootMargin: "50px",
    onIntersect: () => {
      if (!isLoading) {
        loadAvatarFrames();
      }
    },
  });

  const handleUseDecoration = async () => {
    if (!selectedFrame || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (selectedFrame.isUsing) {
        // 卸载装饰品
        await decorationControllerUnuseDecoration({
          path: { decorationId: String(selectedFrame.id) },
        });
      } else {
        // 装备装饰品
        await decorationControllerUseDecoration({
          path: { decorationId: String(selectedFrame.id) },
        });
      }

      // 更新本地状态
      if (!selectedFrame.isUsing) {
        // 装备新装饰品：将选中的设为使用中，其他同类型的设为未使用
        setAvatarFrames((prev) =>
          prev.map((frame) => ({
            ...frame,
            isUsing: frame.id === selectedFrame.id,
          }))
        );
      } else {
        // 卸载当前装饰品：仅将选中的设为未使用
        setAvatarFrames((prev) =>
          prev.map((frame) => ({
            ...frame,
            isUsing: frame.id === selectedFrame.id ? false : frame.isUsing,
          }))
        );
      }

      setSelectedFrame((prev) =>
        prev ? { ...prev, isUsing: !prev.isUsing } : null
      );
    } catch (error) {
      console.error("Failed to use/unuse decoration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={avatarFrameDialogOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl rounded-2xl p-0">
        <DialogHeader className="mb-0 border-b border-border px-6 py-4 text-sm font-semibold">
          {t("title")}
        </DialogHeader>

        <div className="flex h-125">
          <div ref={scrollContainerRef} className="flex-1 overflow-auto px-4">
            {avatarFrames.length === 0 && !isLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {t("empty")}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-3">
                {avatarFrames.map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame)}
                    className={cn(
                      "relative aspect-square cursor-pointer rounded-xl transition-all",
                      "bg-border hover:bg-primary/20",
                      selectedFrame?.id === frame.id &&
                        "ring-2 ring-primary ring-offset-1",
                    )}
                  >
                    {frame.isUsing && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2Icon size={16} className="text-primary" />
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      <ImageWithFallback
                        src={frame.imageUrl!}
                        alt={frame.name!}
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}

            <InfiniteScrollStatus
              observerRef={observerRef}
              hasMore={hasMore}
              loading={isLoading}
              isEmpty={avatarFrames.length === 0}
              loadingText={t("loading")}
              allLoadedText={t("allLoaded")}
              containerClassName="py-4"
              loadingClassName="text-secondary"
              endClassName="py-4 text-secondary"
            />
          </div>

          <div className="flex flex-1 flex-col items-center border-l border-border p-4">
            {selectedFrame ? (
              <>
                <Avatar className="size-20" frameUrl={selectedFrame.imageUrl!}></Avatar>

                <p className="mt-4 text-center font-medium">{selectedFrame.name}</p>

                <div className="mt-auto flex w-full items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-secondary">{t("duration")}</p>
                    <span className="text-xs">
                      {selectedFrame.isOwned
                        ? selectedFrame.userIsPermanent
                          ? t("permanent")
                            : formatExpiryTime(selectedFrame.userExpiresAt, t, locale)
                        : selectedFrame.canDirectEquip
                          ? t("canDirectEquip")
                          : t("notOwned")}
                    </span>
                  </div>

                  <Button
                    className="min-w-18 rounded-full"
                    onClick={handleUseDecoration}
                    loading={isSubmitting}
                    disabled={!selectedFrame.isOwned && !selectedFrame.canDirectEquip}
                  >
                    {selectedFrame.isUsing
                      ? t("unequip")
                      : selectedFrame.isOwned || selectedFrame.canDirectEquip
                        ? t("equip")
                        : t("get")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">{t("selectHint")}</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
