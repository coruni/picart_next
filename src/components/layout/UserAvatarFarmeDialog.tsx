"use client";

import {
  decorationControllerFindAll,
  decorationControllerFindOne,
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
import { ImageWithFallback } from "../shared/ImageWithFallback";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogHeader } from "../ui/Dialog";

type AvatarFrame = DecorationControllerFindAllResponse["data"]["data"][0];

// Type for non-owned decoration details from API
type DecorationDetail = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  type: string;
  isPermanent?: boolean;
  expiresAt?: string;
};

// Union type for selected item
 type SelectedFrame =
  | ({ isOwned: true } & AvatarFrame)
  | ({ isOwned: false; isUsing: false } & DecorationDetail);

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
  const [selectedFrame, setSelectedFrame] = useState<SelectedFrame | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

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

  // 获取非拥有的装饰品详情
  const fetchDecorationDetail = async (decorationId: number) => {
    try {
      const response = await decorationControllerFindOne({
        path: { id: String(decorationId) },
      });
      const decoration = response?.data?.data;
      if (decoration) {
        setSelectedFrame({
          ...decoration as DecorationDetail,
          isOwned: false,
          isUsing: false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch decoration detail:", error);
    }
  };

  useEffect(() => {
    if (avatarFrameDialogOpen && avatarFrames.length === 0) {
      setDialogLoading(true);
      loadAvatarFrames().then(() => {
        setDialogLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarFrameDialogOpen]);

  // 处理初始选中项 - 在列表加载完成后检查
  useEffect(() => {
    if (!avatarFrameDialogOpen || !initialFrameId) return;

    // 在已拥有的列表中查找
    const targetFrame = avatarFrames.find((f) => f.id === initialFrameId);
    if (targetFrame) {
      setSelectedFrame({ ...targetFrame, isOwned: true });
    } else if (avatarFrames.length > 0 || !dialogLoading) {
      // 如果列表已加载但未找到，通过API获取
      fetchDecorationDetail(initialFrameId);
    }
  }, [avatarFrameDialogOpen, initialFrameId, avatarFrames, dialogLoading]);

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
    if (!selectedFrame || isSubmitting || !selectedFrame.isOwned) return;

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
          })),
        );
      } else {
        // 卸载当前装饰品：仅将选中的设为未使用
        setAvatarFrames((prev) =>
          prev.map((frame) => ({
            ...frame,
            isUsing: frame.id === selectedFrame.id ? false : frame.isUsing,
          })),
        );
      }

      setSelectedFrame((prev) => {
        if (!prev) return null;
        if (prev.isOwned) {
          return { ...prev, isUsing: !prev.isUsing };
        }
        return prev;
      });
    } catch (error) {
      console.error("Failed to use/unuse decoration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions to safely access frame properties
  const getFrameId = (frame: SelectedFrame | AvatarFrame) => {
    if ('isOwned' in frame && !frame.isOwned) {
      return (frame as DecorationDetail).id;
    }
    return (frame as AvatarFrame).id;
  };

  const getFrameName = (frame: SelectedFrame | null) => {
    if (!frame) return "";
    if ('isOwned' in frame && !frame.isOwned) {
      return (frame as DecorationDetail).name;
    }
    return (frame as AvatarFrame).name;
  };

  const getFrameImageUrl = (frame: SelectedFrame | null) => {
    if (!frame) return "";
    if ('isOwned' in frame && !frame.isOwned) {
      return (frame as DecorationDetail).imageUrl;
    }
    return (frame as AvatarFrame).imageUrl;
  };

  const getFrameIsUsing = (frame: SelectedFrame | null) => {
    if (!frame) return false;
    if ('isOwned' in frame && !frame.isOwned) {
      return false;
    }
    return (frame as AvatarFrame).isUsing;
  };

  const isFrameOwned = (frame: SelectedFrame | null) => {
    if (!frame) return false;
    return !('isOwned' in frame) || frame.isOwned;
  };

  const canFrameEquip = (frame: SelectedFrame | null) => {
    if (!frame) return false;
    if ('isOwned' in frame && !frame.isOwned) {
      return false;
    }
    const f = frame as AvatarFrame;
    return f.isOwned || f.canDirectEquip;
  };

  const getFrameExpiryInfo = (frame: SelectedFrame | null): { isPermanent?: boolean; userExpiresAt?: string } | null => {
    if (!frame) return null;
    if ('isOwned' in frame && !frame.isOwned) {
      const d = frame as DecorationDetail;
      return { isPermanent: d.isPermanent, userExpiresAt: d.expiresAt };
    }
    const f = frame as AvatarFrame;
    return { isPermanent: f.userIsPermanent, userExpiresAt: f.userExpiresAt };
  };

  return (
    <Dialog open={avatarFrameDialogOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl rounded-2xl p-0">
        <DialogHeader className="mb-0 border-b border-border px-6 py-4 text-sm font-semibold">
          {t("title")}
        </DialogHeader>

        <div className="flex h-125">
          <div ref={scrollContainerRef} className="flex-1 overflow-auto px-4">
            {avatarFrames.length === 0 && !isLoading && !dialogLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {t("empty")}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-3">
                {avatarFrames.map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame({ ...frame, isOwned: true })}
                    className={cn(
                      "relative aspect-square cursor-pointer rounded-xl transition-all ring-0 outline-0",
                      "bg-border hover:bg-primary/15",
                      selectedFrame && getFrameId(selectedFrame) === frame.id &&
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
                <Avatar
                  className="size-20"
                  frameUrl={getFrameImageUrl(selectedFrame)!}
                ></Avatar>

                <p className="mt-4 text-center font-medium">
                  {getFrameName(selectedFrame)}
                </p>

                <div className="mt-auto flex w-full items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-secondary">
                      {t("duration")}
                    </p>
                    <span className="text-xs">
                      {isFrameOwned(selectedFrame)
                        ? (() => {
                            const expiryInfo = getFrameExpiryInfo(selectedFrame);
                            if (expiryInfo?.isPermanent) {
                              return t("permanent");
                            }
                            return formatExpiryTime(
                              expiryInfo?.userExpiresAt,
                              t,
                              locale,
                            );
                          })()
                        : t("notOwned")}
                    </span>
                  </div>

                  {isFrameOwned(selectedFrame) && (
                    <Button
                      className="min-w-18 rounded-full"
                      onClick={handleUseDecoration}
                      loading={isSubmitting}
                      disabled={!canFrameEquip(selectedFrame)}
                    >
                      {getFrameIsUsing(selectedFrame)
                        ? t("unequip")
                        : canFrameEquip(selectedFrame)
                          ? t("equip")
                          : t("get")}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                {t("selectHint")}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
