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
import { useUserStore } from "@/stores/useUserStore";
import { DecorationControllerFindAllResponse } from "@/types";
import { CheckCircle2Icon, ChevronLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogHeader } from "../ui/Dialog";

type CommentBubble = DecorationControllerFindAllResponse["data"]["data"][0];

// Type for non-owned decoration details from API
type DecorationDetail = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  bubbleColor: string;
  type: string;
  isPermanent?: boolean;
  expiresAt?: string;
};

// Union type for selected item
type SelectedBubble =
  | ({ isOwned: true } & CommentBubble)
  | ({ isOwned: false; isUsing: false } & DecorationDetail);

export function UserCommentBubbleDialog() {
  const t = useTranslations("commentBubbleDialog");
  const locale = useLocale();
  const user = useUserStore((state) => state.user);
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
  const [selectedBubble, setSelectedBubble] = useState<SelectedBubble | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

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

  // 获取非拥有的装饰品详情
  const fetchDecorationDetail = async (decorationId: number) => {
    try {
      const response = await decorationControllerFindOne({
        path: { id: String(decorationId) },
      });
      const decoration = response?.data?.data;
      if (decoration) {
        setSelectedBubble({
          ...(decoration as DecorationDetail),
          isOwned: false,
          isUsing: false,
        });
        // 移动端有初始数据时直接展示详情
        setShowMobileDetail(true);
      }
    } catch (error) {
      console.error("Failed to fetch decoration detail:", error);
    }
  };

  // 处理初始选中项 - 在列表加载完成后检查
  useEffect(() => {
    if (!commentBubbleDialogOpen || !initialBubbleId) return;

    // 在已拥有的列表中查找
    const targetBubble = commentBubbles.find((b) => b.id === initialBubbleId);
    if (targetBubble) {
      setSelectedBubble({ ...targetBubble, isOwned: true });
      // 移动端有初始数据时直接展示详情
      setShowMobileDetail(true);
    } else if (commentBubbles.length > 0 || !dialogLoading) {
      // 如果列表已加载但未找到，通过API获取
      fetchDecorationDetail(initialBubbleId);
    }
  }, [commentBubbleDialogOpen, initialBubbleId, commentBubbles, dialogLoading]);

  useEffect(() => {
    if (commentBubbleDialogOpen && commentBubbles.length === 0) {
      setDialogLoading(true);
      loadCommentBubbles().then(() => {
        setDialogLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentBubbleDialogOpen]);

  // 处理初始选中项 - 在列表加载完成后检查
  useEffect(() => {
    if (!commentBubbleDialogOpen || !initialBubbleId) return;

    // 在已拥有的列表中查找
    const targetBubble = commentBubbles.find((b) => b.id === initialBubbleId);
    if (targetBubble) {
      setSelectedBubble({ ...targetBubble, isOwned: true });
      // 移动端有初始数据时直接展示详情
      setShowMobileDetail(true);
    } else if (commentBubbles.length > 0 || !dialogLoading) {
      // 如果列表已加载但未找到，通过API获取
      fetchDecorationDetail(initialBubbleId);
    }
  }, [commentBubbleDialogOpen, initialBubbleId, commentBubbles, dialogLoading]);

  useEffect(() => {
    if (!commentBubbleDialogOpen) {
      setCommentBubbles([]);
      setPage(1);
      setHasMore(true);
      setSelectedBubble(null);
      setShowMobileDetail(false);
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
    if (!selectedBubble || isSubmitting || !selectedBubble.isOwned) return;

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

      setSelectedBubble((prev) => {
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

  // Helper functions to safely access bubble properties
  const getBubbleId = (bubble: SelectedBubble | CommentBubble) => {
    if ("isOwned" in bubble && !bubble.isOwned) {
      return (bubble as DecorationDetail).id;
    }
    return (bubble as CommentBubble).id;
  };

  const getBubbleName = (bubble: SelectedBubble | null) => {
    if (!bubble) return "";
    if ("isOwned" in bubble && !bubble.isOwned) {
      return (bubble as DecorationDetail).name;
    }
    return (bubble as CommentBubble).name;
  };

  const getBubbleColor = (bubble: SelectedBubble | null) => {
    if (!bubble) return "";
    if ("isOwned" in bubble && !bubble.isOwned) {
      return (bubble as DecorationDetail).bubbleColor;
    }
    return (bubble as CommentBubble).bubbleColor;
  };

  const getBubbleImageUrl = (bubble: SelectedBubble | null) => {
    if (!bubble) return "";
    if ("isOwned" in bubble && !bubble.isOwned) {
      return (bubble as DecorationDetail).imageUrl;
    }
    return (bubble as CommentBubble).imageUrl;
  };

  const getBubbleIsUsing = (bubble: SelectedBubble | null) => {
    if (!bubble) return false;
    if ("isOwned" in bubble && !bubble.isOwned) {
      return false;
    }
    return (bubble as CommentBubble).isUsing;
  };

  const isBubbleOwned = (bubble: SelectedBubble | null) => {
    if (!bubble) return false;
    return !("isOwned" in bubble) || bubble.isOwned;
  };

  const canBubbleEquip = (bubble: SelectedBubble | null) => {
    if (!bubble) return false;
    if ("isOwned" in bubble && !bubble.isOwned) {
      return false;
    }
    const b = bubble as CommentBubble;
    return b.isOwned || b.canDirectEquip;
  };

  const getBubbleExpiryInfo = (
    bubble: SelectedBubble | null,
  ): { isPermanent?: boolean; userExpiresAt?: string } | null => {
    if (!bubble) return null;
    if ("isOwned" in bubble && !bubble.isOwned) {
      const d = bubble as DecorationDetail;
      return { isPermanent: d.isPermanent, userExpiresAt: d.expiresAt };
    }
    const b = bubble as CommentBubble;
    return { isPermanent: b.userIsPermanent, userExpiresAt: b.userExpiresAt };
  };

  return (
    <Dialog open={commentBubbleDialogOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden h-[80vh] flex flex-col">
        <DialogHeader className="mb-0 border-b border-border px-6 py-4 text-sm flex-row font-semibold flex items-center">
          {/* 移动端返回按钮 */}
          <button
            onClick={() => setShowMobileDetail(false)}
            className={cn(
              "mr-2 -ml-2 p-1 rounded-full hover:bg-muted transition-colors sm:hidden",
              !showMobileDetail && "hidden",
            )}
          >
            <ChevronLeft size={20} />
          </button>
          {t("title")}
        </DialogHeader>

        <div className="flex md:flex-row flex-col flex-1">
          {/* 列表区域 - 移动端根据 showMobileDetail 隐藏/显示 */}
          <div
            ref={scrollContainerRef}
            className={cn(
              "flex-1 overflow-auto px-4",
              "sm:block",
              showMobileDetail ? "hidden" : "block",
            )}
          >
            {commentBubbles.length === 0 && !isLoading && !dialogLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {t("empty")}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 py-4">
                {commentBubbles.map((bubble) => (
                  <button
                    key={bubble.id}
                    onClick={() => {
                      setSelectedBubble({ ...bubble, isOwned: true });
                      setShowMobileDetail(true);
                    }}
                    className={cn(
                      "relative h-27.5 w-full cursor-pointer rounded-xl transition-all ring-0 outline-0",
                      "hover:bg-primary/15",
                      selectedBubble &&
                        getBubbleId(selectedBubble) === bubble.id &&
                        "ring-2 ring-primary ring-offset-1",
                    )}
                  >
                    {bubble.isUsing && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2Icon size={16} className="text-primary" />
                      </div>
                    )}

                    <div className="flex flex-col items-center justify-center h-full p-4 gap-2">
                      <div className="pt-6 w-full relative">
                        <div
                          className="h-11 w-full text-center leading-11 rounded-lg text-xs text-muted-foreground"
                          style={{ backgroundColor: bubble?.bubbleColor }}
                        >
                          <span>Hello~</span>
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
                      <span className="text-xs font-medium text-muted-foreground truncate max-w-full">
                        {bubble.name}
                      </span>
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

          {/* 详情区域 - 移动端根据 showMobileDetail 隐藏/显示 */}
          <div
            className={cn(
              "flex flex-1 flex-col items-center border-l border-border bg-background sm:border-t-0 border-t",
              "sm:flex",
              showMobileDetail ? "flex" : "hidden",
            )}
          >
            {selectedBubble ? (
              <>
                <div className="p-4 w-full flex-1">
                  <div className="bg-card rounded-lg p-4 flex space-x-2 items-stretch">
                    <Avatar url={user?.avatar || ""} className="size-10" />
                    <div className="h-full flex-1">
                      <div className="text-xs">
                        {user?.nickname || user?.username || "用户名"}
                      </div>
                      <div className="text-xs text-secondary mb-2">1F</div>
                      <div className="w-full relative p-3 pt-4">
                        <div
                          className="h-11 w-full text-center leading-11 rounded-lg text-sm text-muted-foreground"
                          style={{
                            backgroundColor: getBubbleColor(selectedBubble),
                          }}
                        >
                          <span>Hello~</span>
                        </div>
                        {getBubbleImageUrl(selectedBubble) && (
                          <div className="w-32 h-8 absolute top-0 overflow-hidden right-0">
                            <Image
                              src={getBubbleImageUrl(selectedBubble)!}
                              alt={getBubbleName(selectedBubble)}
                              fill
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 装饰品名称 */}
                  <div className="mt-4 text-center">
                    <h3 className="text-sm text-secondary text-left">
                      {getBubbleName(selectedBubble)}
                    </h3>
                  </div>
                </div>

                <div className="mt-auto flex w-full items-center justify-between p-4 bg-card">
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-secondary">
                      {t("duration")}
                    </p>
                    <span className="text-xs">
                      {isBubbleOwned(selectedBubble)
                        ? (() => {
                            const expiryInfo =
                              getBubbleExpiryInfo(selectedBubble);
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

                  {isBubbleOwned(selectedBubble) && (
                    <Button
                      className="min-w-18 rounded-full"
                      onClick={handleUseDecoration}
                      loading={isSubmitting}
                      disabled={!canBubbleEquip(selectedBubble)}
                    >
                      {getBubbleIsUsing(selectedBubble)
                        ? t("unequip")
                        : canBubbleEquip(selectedBubble)
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
