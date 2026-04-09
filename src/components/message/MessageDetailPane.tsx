"use client";
/* eslint-disable @next/next/no-img-element */

import { ImageViewer } from "@/components/article/ImageViewer";
import {
  createDefaultReportReasons,
  DropdownMenu,
  ReportDialog,
  type MenuItem,
} from "@/components/shared";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn, formatRelativeTime, formatShortDate } from "@/lib";
import {
  ArrowLeft,
  Ban,
  ChevronDown,
  LoaderCircle,
  MessageCircleMore,
  MoreVertical,
  Paperclip,
  SendHorizontal,
  ShieldAlert,
  Undo2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  MessageDetailPaneProps,
  PrivateMessagePayload,
} from "./MessageCenter.types";
import { formatMessageClock } from "./MessageCenter.utils";

function resolveMessageImageUrl(
  payload?: PrivateMessagePayload,
): string | null {
  if (
    Array.isArray(payload?.urls) &&
    payload.urls.length > 0 &&
    typeof payload.urls[0] === "string" &&
    payload.urls[0].trim()
  ) {
    return payload.urls[0];
  }

  if (!payload) {
    return null;
  }

  if (typeof payload.imageUrl === "string" && payload.imageUrl.trim()) {
    return payload.imageUrl;
  }

  if (typeof payload.url === "string" && payload.url.trim()) {
    return payload.url;
  }

  return null;
}

function resolveMessageImageUrls(payload?: PrivateMessagePayload): string[] {
  if (Array.isArray(payload?.urls)) {
    return payload.urls.filter(
      (url): url is string => typeof url === "string" && Boolean(url.trim()),
    );
  }

  const singleUrl = resolveMessageImageUrl(payload);
  return singleUrl ? [singleUrl] : [];
}

export function MessageDetailPane({
  blockSubmitting,
  composerValue,
  composerImages,
  copy,
  detailLoading,
  hasMoreHistory,
  isMobileDetailOpen,
  groupedPrivateHistory,
  handleRecallPrivateMessage,
  handleSendPrivateMessage,
  isLoadingOlderHistory,
  isSending,
  isUploadingImages,
  locale,
  markAllAsRead,
  onBlockSelectedUser,
  onLoadOlderHistory,
  onPickComposerImages,
  onRemoveComposerImage,
  onReportSelectedUser,
  onBackToList,
  reportSubmitting,
  selectedItem,
  selectedUserStatus,
  selectedTab,
  setComposerValue,
  tCommon,
  tMsg,
  tTime,
  unreadCount,
  userId,
}: MessageDetailPaneProps) {
  const tMenu = useTranslations("articleMenu");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const messageContentRef = useRef<HTMLDivElement | null>(null);
  const topLoadTriggerRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const messageMenuRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const scheduledStickTimerRef = useRef<number | null>(null);
  const scheduledStickFrameRef = useRef<number | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const previousSelectedItemIdRef = useRef<number | null>(null);
  const prependScrollHeightRef = useRef<number | null>(null);
  const needsInitialScrollToBottomRef = useRef(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [pendingMessageCount, setPendingMessageCount] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [messageMenu, setMessageMenu] = useState<{
    messageId: number;
    x: number;
    y: number;
  } | null>(null);
  // ImageViewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  const typeLabel =
    selectedItem?.type === "notification"
      ? tMsg("tabs.notification")
      : selectedItem?.type === "private"
        ? tMsg("tabs.private")
        : selectedItem?.type === "system"
          ? tMsg("tabs.system")
          : "";
  const statusLabel =
    selectedItem?.type !== "private"
      ? copy.notificationHeader
      : selectedUserStatus?.isOnline
        ? copy.online
        : selectedUserStatus?.lastSeenAt
          ? tMsg("center.lastSeenAt", {
              time: formatRelativeTime(
                selectedUserStatus.lastSeenAt,
                tTime,
                locale,
              ),
            })
          : copy.lastSeenRecently;
  const reportReasons = createDefaultReportReasons(tMenu);
  const userMenuItems: MenuItem[] =
    selectedItem?.type === "private"
      ? [
          {
            label: tMenu("reportUser"),
            icon: <ShieldAlert size={18} />,
            onClick: () => setShowReportDialog(true),
            className: "text-red-400",
            disabled: reportSubmitting,
          },
          {
            label: tMenu("blockUser"),
            icon: <Ban size={18} />,
            onClick: () => void onBlockSelectedUser(),
            disabled: blockSubmitting,
          },
        ]
      : [];

  const stickToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const viewport = scrollViewportRef.current;
    if (!viewport) {
      return;
    }

    if (behavior === "smooth") {
      bottomAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    } else {
      viewport.scrollTop = viewport.scrollHeight;
      bottomAnchorRef.current?.scrollIntoView({ block: "end" });
    }

    shouldStickToBottomRef.current = true;
    setShowJumpToBottom(false);
    setPendingMessageCount(0);
  }, []);

  const cancelScheduledStickToBottom = useCallback(() => {
    if (scheduledStickTimerRef.current != null) {
      window.clearTimeout(scheduledStickTimerRef.current);
      scheduledStickTimerRef.current = null;
    }

    if (scheduledStickFrameRef.current != null) {
      window.cancelAnimationFrame(scheduledStickFrameRef.current);
      scheduledStickFrameRef.current = null;
    }
  }, []);

  const scheduleStickToBottomAfterRender = useCallback((
    behavior: ScrollBehavior = "auto",
    delayMs = 96,
  ) => {
    cancelScheduledStickToBottom();

    scheduledStickTimerRef.current = window.setTimeout(() => {
      scheduledStickFrameRef.current = window.requestAnimationFrame(() => {
        scheduledStickFrameRef.current = window.requestAnimationFrame(() => {
          stickToBottom(behavior);
          needsInitialScrollToBottomRef.current = false;
          scheduledStickFrameRef.current = null;
        });
      });
      scheduledStickTimerRef.current = null;
    }, delayMs);
  }, [cancelScheduledStickToBottom, stickToBottom]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "24px";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 24), 144)}px`;
  }, [composerValue]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const handleViewportChange = () => {
      if (document.activeElement !== textareaRef.current) {
        return;
      }

      requestAnimationFrame(() => {
        scheduleStickToBottomAfterRender();
      });
    };

    viewport.addEventListener("resize", handleViewportChange);
    viewport.addEventListener("scroll", handleViewportChange);

    return () => {
      viewport.removeEventListener("resize", handleViewportChange);
      viewport.removeEventListener("scroll", handleViewportChange);
    };
  }, [scheduleStickToBottomAfterRender]);

  useEffect(() => {
    if (selectedItem?.type !== "private" || !messageContentRef.current) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (
        !needsInitialScrollToBottomRef.current &&
        !shouldStickToBottomRef.current
      ) {
        return;
      }

      scheduleStickToBottomAfterRender();
    });

    observer.observe(messageContentRef.current);

    return () => {
      observer.disconnect();
    };
  }, [scheduleStickToBottomAfterRender, selectedItem?.id, selectedItem?.type]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) {
      return;
    }

    const updateStickyState = () => {
      const distanceToBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      shouldStickToBottomRef.current = distanceToBottom <= 48;
      setShowJumpToBottom(!shouldStickToBottomRef.current);

      if (shouldStickToBottomRef.current) {
        setPendingMessageCount(0);
      }

      if (
        selectedItem?.type === "private" &&
        viewport.scrollTop <= 32 &&
        hasMoreHistory &&
        !isLoadingOlderHistory &&
        prependScrollHeightRef.current == null
      ) {
        prependScrollHeightRef.current = viewport.scrollHeight;
        void onLoadOlderHistory();
      }
    };

    updateStickyState();
    viewport.addEventListener("scroll", updateStickyState, { passive: true });

    return () => {
      viewport.removeEventListener("scroll", updateStickyState);
    };
  }, [
    hasMoreHistory,
    isLoadingOlderHistory,
    onLoadOlderHistory,
    selectedItem?.id,
    selectedItem?.type,
  ]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    const trigger = topLoadTriggerRef.current;

    if (
      !viewport ||
      !trigger ||
      selectedItem?.type !== "private" ||
      !hasMoreHistory
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (
          !entry?.isIntersecting ||
          isLoadingOlderHistory ||
          prependScrollHeightRef.current != null
        ) {
          return;
        }

        prependScrollHeightRef.current = viewport.scrollHeight;
        void onLoadOlderHistory();
      },
      {
        root: viewport,
        rootMargin: "80px 0px 0px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [
    groupedPrivateHistory.length,
    hasMoreHistory,
    isLoadingOlderHistory,
    onLoadOlderHistory,
    selectedItem?.id,
    selectedItem?.type,
  ]);

  useLayoutEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport || selectedItem?.type !== "private") {
      previousMessageCountRef.current = groupedPrivateHistory.length;
      previousSelectedItemIdRef.current = selectedItem?.id ?? null;
      return;
    }

    if (prependScrollHeightRef.current != null && !isLoadingOlderHistory) {
      const scrollDelta =
        viewport.scrollHeight - prependScrollHeightRef.current;
      viewport.scrollTop = scrollDelta;
      prependScrollHeightRef.current = null;
    }

    const previousSelectedId = previousSelectedItemIdRef.current;
    const messageCountIncreased =
      groupedPrivateHistory.length > previousMessageCountRef.current;
    const switchedConversation =
      previousSelectedId == null || previousSelectedId !== selectedItem.id;

    if (switchedConversation) {
      needsInitialScrollToBottomRef.current = true;
      shouldStickToBottomRef.current = true;
      setShowJumpToBottom(false);
      setPendingMessageCount(0);
    } else if (messageCountIncreased && shouldStickToBottomRef.current) {
      scheduleStickToBottomAfterRender();
    } else if (messageCountIncreased) {
      setPendingMessageCount((prev) => {
        return (
          prev +
          (groupedPrivateHistory.length - previousMessageCountRef.current)
        );
      });
      setShowJumpToBottom(true);
    }

    previousMessageCountRef.current = groupedPrivateHistory.length;
    previousSelectedItemIdRef.current = selectedItem.id;
  }, [
    groupedPrivateHistory.length,
    isLoadingOlderHistory,
    scheduleStickToBottomAfterRender,
    selectedItem?.id,
    selectedItem?.type,
  ]);

  useEffect(() => {
    if (
      !needsInitialScrollToBottomRef.current ||
      detailLoading ||
      selectedItem?.type !== "private"
    ) {
      return;
    }

    const viewport = scrollViewportRef.current;
    if (!viewport) {
      return;
    }

    scheduleStickToBottomAfterRender();

    return () => {
      cancelScheduledStickToBottom();
    };
  }, [
    detailLoading,
    groupedPrivateHistory.length,
    scheduleStickToBottomAfterRender,
    selectedItem?.id,
    selectedItem?.type,
    cancelScheduledStickToBottom,
  ]);

  useEffect(() => {
    setPendingMessageCount(0);
    setShowJumpToBottom(false);
    needsInitialScrollToBottomRef.current = true;
    setMessageMenu(null);
    setShowReportDialog(false);
  }, [selectedItem?.id]);

  useEffect(() => {
    return () => {
      cancelScheduledStickToBottom();
    };
  }, [cancelScheduledStickToBottom]);

  useEffect(() => {
    if (!messageMenu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (messageMenuRef.current?.contains(target)) {
        return;
      }

      setMessageMenu(null);
    };

    const handleCloseMenu = () => {
      setMessageMenu(null);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", handleCloseMenu);
    window.addEventListener("scroll", handleCloseMenu, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleCloseMenu);
      window.removeEventListener("scroll", handleCloseMenu, true);
    };
  }, [messageMenu]);

  const handleJumpToBottom = () => {
    stickToBottom("smooth");
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openMessageMenu = (messageId: number, x: number, y: number) => {
    const menuWidth = 176;
    const menuHeight = 56;
    const padding = 12;

    setMessageMenu({
      messageId,
      x: Math.min(
        Math.max(x, padding),
        window.innerWidth - menuWidth - padding,
      ),
      y: Math.min(
        Math.max(y, padding),
        window.innerHeight - menuHeight - padding,
      ),
    });
  };

  if (!selectedItem) {
    return (
      <section className="hidden min-h-0 min-w-0 flex-1 bg-background md:flex md:flex-col">
        <div className="flex min-h-0 flex-1 items-center justify-center px-10">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-5 flex size-18 items-center justify-center rounded-full border border-border bg-muted/60 text-primary">
              <MessageCircleMore className="size-8" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              {copy.chatList}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {copy.detailPlaceholder}
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {unreadCount} {copy.unreadSuffix}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col bg-background md:flex",
          isMobileDetailOpen ? "flex" : "hidden",
        )}
      >
        <div className="flex min-w-0 shrink-0 items-center justify-between border-b border-card md:pl-4 pt-4 pb-1 md:pr-1 bg-card">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full p-2 md:hidden"
              onClick={onBackToList}
              aria-label={copy.chatList}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Avatar
              url={selectedItem.avatarUrl}
              className="size-9"
              alt={selectedItem.title}
            />
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-foreground">
                {selectedItem.title || tMsg("untitled")}
              </h2>
              <p className="text-xs text-muted-foreground">{statusLabel}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            {selectedItem.type === "private" ? (
              <DropdownMenu
                title={tMenu("moreActions")}
                className="mr-2"
                items={userMenuItems}
                trigger={({ isOpen }) => (
                  <Button
                    size="sm"
                    className={cn(
                      "rounded-full p-1!",
                      isOpen && "bg-muted text-primary",
                    )}
                    disabled={blockSubmitting || reportSubmitting}
                  >
                    <span className="sr-only">{tMenu("moreActions")}</span>
                    <MoreVertical size={16} />
                  </Button>
                )}
              />
            ) : null}
            <Button
              className="hidden rounded-full md:inline-flex"
              onClick={() => void markAllAsRead(selectedTab)}
            >
              {copy.markAll}
            </Button>
          </div>
        </div>

        {selectedItem.type === "private" ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="relative min-h-0 min-w-0 flex-1 ">
              <div
                ref={scrollViewportRef}
                className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto py-4 md:border-r md:border-border md:pl-4 md:py-4 pb-0! md:pr-1"
                style={{ scrollbarWidth: "none" }}
              >
                {detailLoading ? (
                  <div className="text-sm text-muted-foreground">
                    {tCommon("loading")}
                  </div>
                ) : groupedPrivateHistory.length > 0 ? (
                  <div ref={messageContentRef} className="flex flex-col gap-3">
                    <div
                      ref={topLoadTriggerRef}
                      className="h-px w-full shrink-0"
                    />
                    {isLoadingOlderHistory ? (
                      <div className="flex justify-center py-1 text-xs text-muted-foreground">
                        {tCommon("loading")}
                      </div>
                    ) : null}

                    {groupedPrivateHistory.map(
                      ({ item, showDayDivider, dayLabel }) => {
                        const isOwn =
                          Number(item.senderId || 0) === Number(userId || 0);
                        const canRecall =
                          isOwn && !item.isRecalled && !item.pending;
                        const imageUrls = resolveMessageImageUrls(item.payload);
                        const hasText = Boolean(item.content?.trim());
                        const isRecalled = Boolean(item.isRecalled);

                        return (
                          <div key={item.id}>
                            {showDayDivider && dayLabel ? (
                              <div className="mb-3 flex justify-center">
                                <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/70 backdrop-blur-sm">
                                  {dayLabel}
                                </span>
                              </div>
                            ) : null}

                            <div
                              className={cn(
                                "flex min-w-0 items-end gap-2",
                                isOwn ? "justify-end" : "justify-start",
                              )}
                            >
                              {isOwn && item.pending ? (
                                <LoaderCircle className="mb-2 size-4 shrink-0 animate-spin text-muted-foreground" />
                              ) : null}
                              <div
                                role={canRecall ? "button" : undefined}
                                tabIndex={canRecall ? 0 : undefined}
                                onContextMenu={(event) => {
                                  if (!canRecall) {
                                    return;
                                  }

                                  event.preventDefault();
                                  openMessageMenu(
                                    item.id,
                                    event.clientX,
                                    event.clientY,
                                  );
                                }}
                                onTouchStart={(event) => {
                                  if (!canRecall) {
                                    return;
                                  }

                                  const touch = event.touches[0];
                                  if (!touch) {
                                    return;
                                  }

                                  clearLongPressTimer();
                                  longPressTimerRef.current = window.setTimeout(
                                    () => {
                                      openMessageMenu(
                                        item.id,
                                        touch.clientX,
                                        touch.clientY,
                                      );
                                    },
                                    420,
                                  );
                                }}
                                onTouchEnd={clearLongPressTimer}
                                onTouchMove={clearLongPressTimer}
                                onTouchCancel={clearLongPressTimer}
                                onKeyDown={(event) => {
                                  if (!canRecall) {
                                    return;
                                  }

                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();
                                    const rect =
                                      event.currentTarget.getBoundingClientRect();
                                    openMessageMenu(
                                      item.id,
                                      rect.right - 16,
                                      rect.top + 12,
                                    );
                                  }
                                }}
                                className={cn(
                                  "min-w-0 max-w-[82%] rounded-2xl p-2 md:max-w-[78%]",
                                  canRecall &&
                                    "cursor-context-menu outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                                  isOwn
                                    ? "rounded-br-md bg-primary/90 text-white/90 dark:bg-card"
                                    : "rounded-bl-md bg-white dark:bg-card",
                                )}
                              >
                                {!isRecalled && imageUrls.length > 0 ? (
                                  <div
                                    className={cn(
                                      "grid gap-1.5 overflow-hidden rounded-xl",
                                      imageUrls.length === 1
                                        ? "grid-cols-1"
                                        : "grid-cols-2",
                                    )}
                                  >
                                    {imageUrls.map((url, index) => (
                                      <img
                                        key={`${item.id}-${url}-${index}`}
                                        src={url}
                                        alt={copy.imageMessage}
                                        onLoad={() => {
                                          if (
                                            needsInitialScrollToBottomRef.current
                                          ) {
                                            scheduleStickToBottomAfterRender();
                                          }
                                        }}
                                        onClick={() => {
                                          setImageViewerImages(imageUrls);
                                          setImageViewerIndex(index);
                                          setImageViewerOpen(true);
                                        }}
                                        className={cn(
                                          "block w-full rounded-xl object-cover cursor-pointer",
                                          imageUrls.length === 1
                                            ? "max-h-80"
                                            : "aspect-square max-h-44",
                                        )}
                                      />
                                    ))}
                                  </div>
                                ) : null}

                                {isRecalled ? (
                                  <div className="relative min-w-0 pr-8">
                                    <p
                                      className={cn(
                                        "whitespace-pre-wrap text-sm italic leading-6",
                                        isOwn
                                          ? "text-white/75"
                                          : "text-muted-foreground",
                                      )}
                                    >
                                      {isOwn
                                        ? copy.recalledMessage
                                        : copy.recalledMessageByOther}
                                    </p>
                                    <div
                                      className={cn(
                                        "pointer-events-none absolute bottom-0 right-0 flex items-center justify-end gap-1 text-[10px] dark:text-secondary",
                                        isOwn
                                          ? "text-white/80"
                                          : "text-secondary",
                                      )}
                                    >
                                      <span>
                                        {formatMessageClock(item.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                ) : hasText ? (
                                  <div
                                    className={cn(
                                      "relative min-w-0 pr-8",
                                      imageUrls.length > 0 ? "mt-2" : "",
                                    )}
                                  >
                                    <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">
                                      {item.content}
                                    </p>
                                    <div
                                      className={cn(
                                        "pointer-events-none absolute bottom-0 right-0 flex items-center justify-end gap-1 text-[10px] dark:text-secondary",
                                        isOwn
                                          ? "text-white/80"
                                          : "text-secondary",
                                      )}
                                    >
                                      <span>
                                        {formatMessageClock(item.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className={cn(
                                      "mt-1 flex justify-end text-[10px] dark:text-secondary",
                                      isOwn
                                        ? "text-white/80"
                                        : "text-secondary",
                                    )}
                                  >
                                    <span>
                                      {formatMessageClock(item.createdAt)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                    <div
                      ref={bottomAnchorRef}
                      className="h-px w-full shrink-0"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {copy.privatePlaceholder}
                  </div>
                )}
              </div>

              {showJumpToBottom ? (
                <button
                  type="button"
                  onClick={handleJumpToBottom}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/96 px-3 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:bg-background"
                >
                  <ChevronDown className="size-4" />
                  <span>
                    {pendingMessageCount > 0
                      ? `${pendingMessageCount} ${copy.newMessagesSuffix}`
                      : copy.jumpToLatest}
                  </span>
                </button>
              ) : null}

              {messageMenu ? (
                <div
                  ref={messageMenuRef}
                  className="fixed z-50 min-w-44 overflow-hidden rounded-2xl border border-border/70 bg-background/98 p-1.5 shadow-[0_18px_48px_rgba(15,23,42,0.18)] backdrop-blur-sm"
                  style={{
                    left: `${messageMenu.x}px`,
                    top: `${messageMenu.y}px`,
                  }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-1 text-left text-sm text-foreground transition-colors hover:bg-muted"
                    onClick={() => {
                      setMessageMenu(null);
                      void handleRecallPrivateMessage(messageMenu.messageId);
                    }}
                  >
                    <Undo2 className="size-4 text-muted-foreground" />
                    <span>{copy.recall}</span>
                  </button>
                </div>
              ) : null}
            </div>

            <div className="min-w-0 border-t border-border bg-background/92 md:px-3 py-3 backdrop-blur">
              {composerImages.length > 0 ? (
                <div
                  className="mb-3 flex gap-2 overflow-x-auto"
                  style={{ scrollbarWidth: "none" }}
                >
                  {composerImages.map((item) => (
                    <div
                      key={item.id}
                      className="relative shrink-0 overflow-hidden rounded-2xl border border-border bg-card"
                    >
                      <img
                        src={item.previewUrl}
                        alt={item.fileName || copy.imageMessage}
                        className="size-20 object-cover"
                      />
                      {item.uploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-[11px] text-foreground">
                          {copy.uploadingImage}
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onRemoveComposerImage(item.id)}
                        className="absolute right-1 top-1 rounded-full bg-background/85 p-1 text-foreground transition-colors hover:bg-background"
                        aria-label={copy.removeImage}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex min-w-0 items-end gap-3 rounded-xl border border-border/70 bg-card px-3 py-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    onPickComposerImages(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />

                <div className="flex h-full shrink-0 items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full p-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                    aria-label={copy.uploadImage}
                  >
                    <Paperclip size={16} />
                  </Button>
                </div>

                <div className="flex min-h-9 min-w-0 flex-1 items-center overflow-hidden">
                  <textarea
                    style={{ scrollbarWidth: "none" }}
                    ref={textareaRef}
                    rows={1}
                    value={composerValue}
                    onChange={(event) => setComposerValue(event.target.value)}
                    onFocus={() => {
                      requestAnimationFrame(() => {
                        stickToBottom();
                      });
                    }}
                    onPaste={(event) => {
                      const files = event.clipboardData?.files;
                      if (!files?.length) {
                        return;
                      }

                      const hasImage = Array.from(files).some((file) =>
                        file.type.startsWith("image/"),
                      );
                      if (!hasImage) {
                        return;
                      }

                      event.preventDefault();
                      onPickComposerImages(files);
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        void handleSendPrivateMessage();
                      }
                    }}
                    placeholder={copy.composerPlaceholder}
                    className="textarea-resizer block max-h-36 min-h-6 w-full resize-none border-0 bg-transparent px-0 py-0 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex h-full shrink-0 ">
                  <Button
                    onClick={() => void handleSendPrivateMessage()}
                    variant="primary"
                    size="sm"
                    className="rounded-full px-4 self-end"
                    disabled={
                      isSending ||
                      isUploadingImages ||
                      (!composerValue.trim() &&
                        composerImages.every((item) => !item.uploadedUrl))
                    }
                    loading={isSending}
                  >
                    <SendHorizontal className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto md:py-4 md:pl-4 md:pr-1">
            <div className="rounded-xl border border-border/70 bg-card/96 px-3 py-2">
              <div className="flex items-center justify-between gap-4">
                <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {typeLabel}
                </div>
                <p className="text-xs text-secondary">
                  {formatShortDate(selectedItem.createdAt || "", locale) ||
                    formatRelativeTime(
                      selectedItem.createdAt || "",
                      tTime,
                      locale,
                    )}
                </p>
              </div>

              <h3 className="font-semibold text-foreground">
                {selectedItem.title || tMsg("untitled")}
              </h3>

              <div className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-7 text-secondary">
                {selectedItem.content || copy.detailPlaceholder}
              </div>
            </div>
          </div>
        )}
      </section>
      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reasons={reportReasons}
        loading={reportSubmitting}
        onSubmit={async (payload) => {
          await onReportSelectedUser(payload);
          setShowReportDialog(false);
        }}
      />

      <ImageViewer
        images={imageViewerImages}
        initialIndex={imageViewerIndex}
        visible={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        alt={copy.imageMessage}
        enableSidePanel={false}
      />
    </>
  );
}
