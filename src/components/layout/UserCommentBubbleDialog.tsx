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
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogHeader } from "../ui/Dialog";

type CommentBubble = DecorationControllerFindAllResponse["data"]["data"][0];

export function UserCommentBubbleDialog() {
  const t = useTranslations("commentBubbleDialog");
  const locale = useLocale();
  const commentBubbleDialogOpen = useModalStore((state) =>
    state.isOpen(MODAL_IDS.COMMENT_BUBBLE),
  );
  const closeModal = useModalStore((state) => state.closeModal);
  const getModalData = useModalStore((state) => state.getModalData);
  const modalData = getModalData(MODAL_IDS.COMMENT_BUBBLE);
  const initialBubbleId = modalData?.commentBubbleId;

  const handleDialogClose = () => {
    closeModal(MODAL_IDS.COMMENT_BUBBLE);
  };

  const [commentBubbles, setCommentBubbles] = useState<CommentBubble[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedBubble, setSelectedBubble] = useState<CommentBubble | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const loadCommentBubbles = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const res = await decorationControllerFindAll({
        query: {
          type: "COMMENT_BUBBLE",
          page,
          limit: 20,
        },
      });

      const newBubbles = res?.data?.data?.data || [];
      const meta = res?.data?.data?.meta;

      if (newBubbles.length === 0) {
        setHasMore(false);
      } else {
        setCommentBubbles((prev) => [...prev, ...newBubbles]);
        setPage((prev) => prev + 1);

        const totalLoaded = commentBubbles.length + newBubbles.length;
        if (meta?.total && totalLoaded >= meta.total) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to load comment bubbles:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, commentBubbles.length]);

  // 处理初始选中项
  useEffect(() => {
    if (!initialBubbleId || commentBubbles.length === 0) return;

    const targetBubble = commentBubbles.find((b) => b.id === initialBubbleId);
    if (targetBubble && !selectedBubble) {
      setSelectedBubble(targetBubble);
    }
  }, [commentBubbles, initialBubbleId, selectedBubble]);

  useEffect(() => {
    if (commentBubbleDialogOpen && commentBubbles.length === 0) {
      loadCommentBubbles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentBubbleDialogOpen]);

  useEffect(() => {
    if (!commentBubbleDialogOpen) {
      setCommentBubbles([]);
      setPage(1);
      setHasMore(true);
      setSelectedBubble(null);
    }
  }, [commentBubbleDialogOpen]);

  useInfiniteScrollObserver({
    targetRef: observerRef,
    enabled: hasMore,
    rootRef: scrollContainerRef,
    rootMargin: "50px",
    onIntersect: () => {
      if (!isLoading) {
        loadCommentBubbles();
      }
    },
  });

  const handleUseDecoration = async () => {
    if (!selectedBubble || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (selectedBubble.isUsing) {
        // 卸载装饰品
        await decorationControllerUnuseDecoration({
          path: { decorationId: String(selectedBubble.id) },
        });
      } else {
        // 装备装饰品
        await decorationControllerUseDecoration({
          path: { decorationId: String(selectedBubble.id) },
        });
      }

      // 更新本地状态
      if (!selectedBubble.isUsing) {
        // 装备新装饰品：将选中的设为使用中，其他同类型的设为未使用
        setCommentBubbles((prev) =>
          prev.map((bubble) => ({
            ...bubble,
            isUsing: bubble.id === selectedBubble.id,
          })),
        );
      } else {
        // 卸载当前装饰品：仅将选中的设为未使用
        setCommentBubbles((prev) =>
          prev.map((bubble) => ({
            ...bubble,
            isUsing: bubble.id === selectedBubble.id ? false : bubble.isUsing,
          })),
        );
      }

      setSelectedBubble((prev) =>
        prev ? { ...prev, isUsing: !prev.isUsing } : null,
      );
    } catch (error) {
      console.error("Failed to use/unuse decoration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={commentBubbleDialogOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl rounded-2xl p-0">
        <DialogHeader className="mb-0 border-b border-border px-6 py-4 text-sm font-semibold">
          {t("title")}
        </DialogHeader>

        <div className="flex h-125">
          <div ref={scrollContainerRef} className="flex-1 overflow-auto px-4">
            {commentBubbles.length === 0 && !isLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {t("empty")}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 py-4">
                {commentBubbles.map((bubble) => (
                  <button
                    key={bubble.id}
                    onClick={() => setSelectedBubble(bubble)}
                    className={cn(
                      "relative h-27.5 w-full cursor-pointer rounded-xl transition-all ring-0 outline-0",
                      "bg-border hover:bg-primary/15",
                      selectedBubble?.id === bubble.id &&
                        "ring-2 ring-primary ring-offset-1",
                    )}
                  >
                    {bubble.isUsing && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2Icon size={16} className="text-primary" />
                      </div>
                    )}

                    <div className="flex items-center justify-center h-full p-4 ">
                      <div className="pt-6 w-full relative">
                        <div
                          className="h-11 w-full text-center leading-11 rounded-lg text-sm"
                          style={{ backgroundColor: bubble?.bubbleColor }}
                        >
                          123123
                        </div>
                        {/* 定位图片 */}
                        {bubble.imageUrl && (
                          <div className="w-40 h-10 absolute top-0 overflow-hidden right-0">
                            <Image
                              src={bubble.imageUrl}
                              alt={bubble.name}
                              fill
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <InfiniteScrollStatus
              observerRef={observerRef}
              hasMore={hasMore}
              loading={isLoading}
              isEmpty={commentBubbles.length === 0}
              loadingText={t("loading")}
              allLoadedText={t("allLoaded")}
              containerClassName="py-4"
              loadingClassName="text-secondary"
              endClassName="py-4 text-secondary"
            />
          </div>

          <div className="flex flex-1 flex-col items-center border-l border-border  bg-background">
            {selectedBubble ? (
              <>
                <div className="p-4 w-full flex-1">
                  <div className="bg-card rounded-md p-4 flex space-x-2 items-stretch">
                    <Avatar url={""} className="size-10" />
                    <div className="h-full flex-1">
                      <div className="text-xs">用户名</div>
                      <div className="text-xs text-secondary mb-2">1F</div>
                      <div className="w-full relative p-3 pt-4">
                        <div
                          className="h-11 w-full text-center leading-11 rounded-lg text-sm"
                          style={{
                            backgroundColor: selectedBubble?.bubbleColor,
                          }}
                        >
                          123123
                        </div>
                        {selectedBubble.imageUrl && (
                          <div className="w-32 h-8 absolute top-0 overflow-hidden right-0">
                            <Image
                              src={selectedBubble.imageUrl}
                              alt={selectedBubble.name}
                              fill
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex w-full items-center justify-between p-4 bg-card">
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-secondary">
                      {t("duration")}
                    </p>
                    <span className="text-xs">
                      {selectedBubble.isOwned
                        ? selectedBubble.userIsPermanent
                          ? t("permanent")
                          : formatExpiryTime(
                              selectedBubble.userExpiresAt,
                              t,
                              locale,
                            )
                        : selectedBubble.canDirectEquip
                          ? t("canDirectEquip")
                          : t("notOwned")}
                    </span>
                  </div>

                  <Button
                    className="min-w-18 rounded-full"
                    onClick={handleUseDecoration}
                    loading={isSubmitting}
                    disabled={
                      !selectedBubble.isOwned && !selectedBubble.canDirectEquip
                    }
                  >
                    {selectedBubble.isUsing
                      ? t("unequip")
                      : selectedBubble.isOwned || selectedBubble.canDirectEquip
                        ? t("equip")
                        : t("get")}
                  </Button>
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
