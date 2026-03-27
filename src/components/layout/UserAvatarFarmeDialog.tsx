"use client";

import { MODAL_IDS } from "@/lib/modal-helpers";
import { useModalStore } from "@/stores/useModalStore";
import { Dialog, DialogContent, DialogHeader } from "../ui/Dialog";
import { useState, useEffect, useRef, useCallback } from "react";
import { DecorationControllerFindAllResponse } from "@/types";
import { decorationControllerFindAll } from "@/api";
import { CheckCircle2Icon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { InfiniteScrollStatus } from "@/components/shared";

function formatExpireTime(timestamp: number | string | undefined): string {
  if (!timestamp) return "";

  const date = new Date(
    typeof timestamp === "string" ? timestamp : timestamp * 1000,
  );
  const now = new Date();
  const diffDays = Math.floor(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return "已过期";
  }

  if (diffDays === 0) {
    return "今天过期";
  }

  if (diffDays <= 30) {
    return `${diffDays}天后过期`;
  }

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

type AvatarFrame = DecorationControllerFindAllResponse["data"]["data"][0];

export function UserAvatarFarmeDialog() {
  const avatarFrameDialogOpen = useModalStore((state) =>
    state.isOpen(MODAL_IDS.AVATAR_FRAME),
  );
  const closeModal = useModalStore((state) => state.closeModal);

  const handleDialogClose = () => {
    closeModal(MODAL_IDS.AVATAR_FRAME);
  };

  const [avatarFrames, setAvatarFrames] = useState<AvatarFrame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedFrame, setSelectedFrame] = useState<AvatarFrame | null>(null);

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

  return (
    <Dialog open={avatarFrameDialogOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl rounded-2xl p-0">
        <DialogHeader className="mb-0 border border-border px-6 py-4 text-sm font-semibold">
          修改头像框
        </DialogHeader>

        <div className="flex h-125">
          <div ref={scrollContainerRef} className="flex-1 overflow-auto px-4">
            {avatarFrames.length === 0 && !isLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                暂无头像框
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
                      <Image
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
              loadingText="加载中..."
              allLoadedText="已加载全部"
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
                  frameUrl={selectedFrame.imageUrl!}
                ></Avatar>

                <p className="mt-4 text-center font-medium">
                  {selectedFrame.name}
                </p>

                <div className="mt-auto flex w-full items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-secondary">
                      使用期限:
                    </p>
                    <span className="text-xs">
                      {selectedFrame.isOwned
                        ? selectedFrame.userIsPermanent
                          ? "永久有效"
                          : formatExpireTime(selectedFrame.userExpiresAt)
                        : selectedFrame.canDirectEquip
                          ? "可直接装备"
                          : "未拥有"}
                    </span>
                  </div>

                  <Button className="min-w-18 rounded-full">
                    {selectedFrame.isUsing
                      ? "取消佩戴"
                      : selectedFrame.isOwned
                        ? "佩戴"
                        : "获取"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                选择左侧头像框预览
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
