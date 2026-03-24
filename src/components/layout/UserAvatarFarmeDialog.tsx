"use client";

import { MODAL_IDS } from "@/lib/modal-helpers";
import { useModalStore } from "@/stores/useModalStore";
import { Dialog, DialogContent, DialogHeader } from "../ui/Dialog";
import { useState, useEffect, useRef, useCallback } from "react";
import { DecorationControllerFindAllResponse } from "@/types";
import { decorationControllerFindAll } from "@/api";
import { CheckCircle2Icon, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";

// 格式化过期时间
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
  } else if (diffDays === 0) {
    return "今天过期";
  } else if (diffDays <= 30) {
    return `${diffDays}天后过期`;
  } else {
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
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
  const observerInstanceRef = useRef<IntersectionObserver | null>(null);

  // Load avatar frames
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

        // Check if all loaded
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

  // Initial load
  useEffect(() => {
    if (avatarFrameDialogOpen && avatarFrames.length === 0) {
      loadAvatarFrames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarFrameDialogOpen]);

  // Reset when dialog closes
  useEffect(() => {
    if (!avatarFrameDialogOpen) {
      setAvatarFrames([]);
      setPage(1);
      setHasMore(true);
      setSelectedFrame(null);
    }
  }, [avatarFrameDialogOpen]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading) {
          loadAvatarFrames();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "50px",
        threshold: 0.1,
      },
    );

    observerInstanceRef.current = observer;
    observer.observe(observerRef.current);

    return () => {
      if (observerInstanceRef.current) {
        observerInstanceRef.current.disconnect();
      }
    };
  }, [loadAvatarFrames, hasMore, isLoading]);

  return (
    <Dialog open={avatarFrameDialogOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl rounded-2xl p-0">
        <DialogHeader className="text-sm font-semibold px-6 py-4 border-border border mb-0">
          修改头像框
        </DialogHeader>
        <div className="flex h-125">
          {/* Left: Avatar frame list with infinite scroll */}
          <div ref={scrollContainerRef} className="flex-1 px-4 overflow-auto">
            {avatarFrames.length === 0 && !isLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                暂无头像框
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4">
                {avatarFrames.map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame)}
                    className={cn(
                      "relative aspect-square rounded-xl transition-all cursor-pointer",
                      "bg-border hover:bg-primary/20",
                      selectedFrame?.id === frame.id &&
                        "ring-2 ring-primary ring-offset-1",
                    )}
                  >
                    {/* 使用中标识 - 参考装饰页面样式 */}
                    {frame.isUsing && (
                      <div className=" absolute top-2 right-2">
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

            {/* Loading indicator and observer target */}
            {hasMore && (
              <div
                ref={observerRef}
                className="flex items-center justify-center py-4"
              >
                {isLoading && (
                  <div className="flex items-center gap-2 text-secondary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">加载中...</span>
                  </div>
                )}
              </div>
            )}

            {/* End of list */}
            {!hasMore && avatarFrames.length > 0 && (
              <div className="flex items-center justify-center py-4 text-secondary text-sm">
                已加载全部
              </div>
            )}
          </div>

          {/* Right: Preview area */}
          <div className="flex-1 border-l border-border p-4 flex flex-col items-center">
            {selectedFrame ? (
              <>
                <Avatar
                  className="size-20"
                  frameUrl={selectedFrame.imageUrl!}
                ></Avatar>
                <p className="mt-4 text-center font-medium">
                  {selectedFrame.name}
                </p>
                <div className="mt-auto flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <p className="text-secondary text-xs font-semibold">
                      使用期限：
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
                  <Button className="rounded-full min-w-18">
                    {selectedFrame.isUsing
                      ? "取消佩戴"
                      : selectedFrame.isOwned
                        ? "佩戴"
                        : "获取"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-sm">
                选择左侧头像框预览
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
