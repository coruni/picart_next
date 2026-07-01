"use client";
/* eslint-disable @next/next/no-img-element */

import { emojiControllerFindAll, emojiControllerIncrementUseCount } from "@/api";
import { ImageViewer } from "@/components/article/ImageViewer";
import {
  hasQuillContent,
  loadQuill,
  normalizeEmojiGroups,
  registerEmojiQuill,
  type EmojiGroup,
  type EmojiRecord,
} from "@/components/editor/emoji-utils";
import {
  createDefaultReportReasons,
  DropdownMenu,
  ReportDialog,
  type MenuItem,
} from "@/components/shared";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn, formatRelativeTime } from "@/lib";
import {
  prepareCommentHtmlForDisplay,
  prepareRichTextHtmlForSummary,
} from "@/lib/rich-text";
import "quill/dist/quill.snow.css";

import {
  ArrowLeft,
  Ban,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MoreVertical,
  Paperclip,
  SendHorizontal,
  ShieldAlert,
  Smile,
  Undo2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./message-rich-text.css";
import type {
  MessageDetailPaneProps,
  PrivateHistoryItem,
  PrivateMessagePayload,
} from "./MessageCenter.types";
import { formatMessageClock } from "./MessageCenter.utils";

function resolveMessageImageUrl(payload?: PrivateMessagePayload): string | null {
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

// Composer-serialised messages embed emoji as <span class="ql-emoji-embed">.
// Any tag presence is a reliable signal we should render via HTML rather
// than plain text so emoji <img>s actually show up.
const RE_MESSAGE_HAS_HTML_TAG = /<[a-z!\/]/i;

function isRichTextMessage(content: string | undefined): content is string {
  return typeof content === "string" && RE_MESSAGE_HAS_HTML_TAG.test(content);
}

type PrivateRoutePaneProps = MessageDetailPaneProps;

type PrivateMessageRowProps = {
  item: PrivateHistoryItem;
  showDayDivider: boolean;
  dayLabel?: string;
  userId?: number | string;
  copy: PrivateRoutePaneProps["copy"];
  onRecall: (messageId: number, x: number, y: number) => void;
  onOpenImageViewer: (images: string[], index: number) => void;
  onImageLoaded: () => void;
};

const PrivateMessageRow = memo(function PrivateMessageRow({
  item,
  showDayDivider,
  dayLabel,
  userId,
  copy,
  onRecall,
  onOpenImageViewer,
  onImageLoaded,
}: PrivateMessageRowProps) {
  const isOwn = Number(item.senderId || 0) === Number(userId || 0);
  const canRecall = isOwn && !item.isRecalled && !item.pending;
  const imageUrls = resolveMessageImageUrls(item.payload);
  const hasText = Boolean(item.content?.trim());
  const isRecalled = Boolean(item.isRecalled);

  return (
    <div>
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
            onRecall(item.id, event.clientX, event.clientY);
          }}
          onTouchStart={(event) => {
            if (!canRecall) {
              return;
            }

            const touch = event.touches[0];
            if (!touch) {
              return;
            }

            window.setTimeout(() => {
              onRecall(item.id, touch.clientX, touch.clientY);
            }, 420);
          }}
          onKeyDown={(event) => {
            if (!canRecall) {
              return;
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              const rect = event.currentTarget.getBoundingClientRect();
              onRecall(item.id, rect.left + rect.width / 2, rect.top);
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
                imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2",
              )}
            >
              {imageUrls.map((url, index) => (
                <img
                  key={`${item.id}-${url}-${index}`}
                  src={url}
                  alt={copy.imageMessage}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  onLoad={onImageLoaded}
                  onClick={() => {
                    onOpenImageViewer(imageUrls, index);
                  }}
                  className={cn(
                    "block w-full cursor-pointer rounded-xl object-cover",
                    imageUrls.length === 1 ? "max-h-80" : "aspect-square max-h-44",
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
                  isOwn ? "text-white/75" : "text-muted-foreground",
                )}
              >
                {isOwn ? copy.recalledMessage : copy.recalledMessageByOther}
              </p>
              <div
                className={cn(
                  "pointer-events-none absolute bottom-0 right-0 flex items-center justify-end gap-1 text-[10px] dark:text-secondary",
                  isOwn ? "text-white/80" : "text-secondary",
                )}
              >
                <span>{formatMessageClock(item.createdAt)}</span>
              </div>
            </div>
          ) : hasText ? (
            <div
              className={cn(
                "relative min-w-0 pr-8",
                imageUrls.length > 0 ? "mt-2" : "",
              )}
            >
              {isRichTextMessage(item.content) ? (
                <div
                  className="message-rich-text whitespace-pre-wrap wrap-break-word text-sm leading-6"
                  dangerouslySetInnerHTML={{
                    __html: prepareCommentHtmlForDisplay(item.content),
                  }}
                />
              ) : (
                <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">
                  {item.content}
                </p>
              )}
              <div
                className={cn(
                  "pointer-events-none absolute bottom-0 right-0 flex items-center justify-end gap-1 text-[10px] dark:text-secondary",
                  isOwn ? "text-white/80" : "text-secondary",
                )}
              >
                <span>{formatMessageClock(item.createdAt)}</span>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "mt-1 flex justify-end text-[10px] dark:text-secondary",
                isOwn ? "text-white/80" : "text-secondary",
              )}
            >
              <span>{formatMessageClock(item.createdAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export function MessagePrivateDetailRoutePane({
  blockSubmitting,
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
  userId,
}: PrivateRoutePaneProps) {
  const tMenu = useTranslations("articleMenu");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const quillRef = useRef<unknown>(null);
  const composerContainerRef = useRef<HTMLDivElement | null>(null);
  const emojiPanelRef = useRef<HTMLDivElement | null>(null);
  const emojiTabsViewportRef = useRef<HTMLDivElement | null>(null);
  const handleSendRef = useRef<() => void>(() => {});
  const onPickComposerImagesRef = useRef(onPickComposerImages);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const messageMenuRef = useRef<HTMLDivElement | null>(null);
  const scheduledScrollFrameRef = useRef<number | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const initialScrollPendingRef = useRef(false);
  const previousThreadKeyRef = useRef<string | null>(null);
  const previousHistorySnapshotRef = useRef({
    length: 0,
    firstId: null as number | null,
    lastId: null as number | null,
  });
  const historyRestoreRef = useRef<{
    previousScrollHeight: number;
    previousScrollTop: number;
  } | null>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [pendingMessageCount, setPendingMessageCount] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [messageMenu, setMessageMenu] = useState<{
    messageId: number;
    x: number;
    y: number;
  } | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [emojiGroups, setEmojiGroups] = useState<EmojiGroup[]>([]);
  const [activeEmojiGroup, setActiveEmojiGroup] = useState<string>("all");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [editorHasContent, setEditorHasContent] = useState(false);

  const emojiList = useMemo(() => {
    if (activeEmojiGroup === "all") {
      return emojiGroups.flatMap((group) => group.items);
    }
    return (
      emojiGroups.find((group) => group.name === activeEmojiGroup)?.items || []
    );
  }, [activeEmojiGroup, emojiGroups]);

  useEffect(() => {
    onPickComposerImagesRef.current = onPickComposerImages;
  }, [onPickComposerImages]);

  useEffect(() => {
    handleSendRef.current = async () => {
      const quill = quillRef.current as {
        root: { innerHTML: string };
        setContents: (content: unknown[], source: string) => void;
      } | null;
      if (!quill) {
        return;
      }
      const html = quill.root.innerHTML;
      await handleSendPrivateMessage(html);
      quill.setContents([{ insert: "\n" }], "silent");
      setEditorHasContent(false);
      setEmojiOpen(false);
    };
  }, [handleSendPrivateMessage]);

  const statusLabel =
    selectedUserStatus?.isOnline
      ? copy.online
      : selectedUserStatus?.lastSeenAt
        ? tMsg("center.lastSeenAt", {
            time: formatRelativeTime(selectedUserStatus.lastSeenAt, tTime, locale),
          })
        : copy.lastSeenRecently;
  const reportReasons = createDefaultReportReasons(tMenu);
  const userMenuItems: MenuItem[] = [
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
  ];
  const selectedThreadKey =
    selectedItem?.type === "private"
      ? `private:${selectedItem.counterpartId ?? selectedItem.id}`
      : null;
  const firstHistoryMessageId = groupedPrivateHistory[0]?.item.id ?? null;
  const lastHistoryMessageId =
    groupedPrivateHistory[groupedPrivateHistory.length - 1]?.item.id ?? null;

  const cancelScheduledScroll = useCallback(() => {
    if (scheduledScrollFrameRef.current != null) {
      window.cancelAnimationFrame(scheduledScrollFrameRef.current);
      scheduledScrollFrameRef.current = null;
    }
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const viewport = scrollViewportRef.current;
    if (!viewport) {
      return;
    }

    if (behavior === "smooth") {
      bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    } else {
      viewport.scrollTop = viewport.scrollHeight;
      bottomAnchorRef.current?.scrollIntoView({ block: "end" });
    }

    shouldAutoScrollRef.current = true;
    setShowJumpToBottom(false);
    setPendingMessageCount(0);
  }, []);

  const scheduleScrollToBottom = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      if (historyRestoreRef.current) {
        return;
      }

      cancelScheduledScroll();
      scheduledScrollFrameRef.current = window.requestAnimationFrame(() => {
        scheduledScrollFrameRef.current = window.requestAnimationFrame(() => {
          scrollToBottom(behavior);
          scheduledScrollFrameRef.current = null;
        });
      });
    },
    [cancelScheduledScroll, scrollToBottom],
  );

  useEffect(() => {
    let quillInstance: {
      off: (event: string, handler: () => void) => void;
      root: HTMLElement;
    } | null = null;
    let syncEditorState: (() => void) | null = null;
    let keydownHandler: ((event: KeyboardEvent) => void) | null = null;
    let pasteHandler: ((event: ClipboardEvent) => void) | null = null;
    let focusHandler: (() => void) | null = null;

    const initQuill = async () => {
      await registerEmojiQuill();

      if (!composerContainerRef.current || quillRef.current) {
        return;
      }

      const { Quill } = await loadQuill();
      if (!Quill || !composerContainerRef.current || quillRef.current) {
        return;
      }

      const quill = new Quill(composerContainerRef.current, {
        theme: "snow",
        modules: {
          toolbar: false,
          history: { delay: 800, maxStack: 50, userOnly: true },
        },
        formats: ["emoji"],
        placeholder: copy.composerPlaceholder,
      });

      quillRef.current = quill;
      quillInstance = quill as unknown as {
        off: (event: string, handler: () => void) => void;
        root: HTMLElement;
      };

      syncEditorState = () => {
        setComposerValue(quill.root.innerHTML);
        setEditorHasContent(
          hasQuillContent(
            quill as unknown as { getText: () => string; root: Element },
          ),
        );
      };
      quill.on("text-change", syncEditorState);
      syncEditorState();

      keydownHandler = (event: KeyboardEvent) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.isComposing
        ) {
          event.preventDefault();
          void handleSendRef.current();
        }
      };
      quill.root.addEventListener("keydown", keydownHandler);

      pasteHandler = (event: ClipboardEvent) => {
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
        onPickComposerImagesRef.current?.(files);
      };
      quill.root.addEventListener("paste", pasteHandler);

      focusHandler = () => {
        if (shouldAutoScrollRef.current) {
          scheduleScrollToBottom();
        }
      };
      quill.root.addEventListener("focus", focusHandler);
    };

    void initQuill();

    return () => {
      if (quillInstance && syncEditorState) {
        quillInstance.off("text-change", syncEditorState);
      }
      const root = quillInstance?.root;
      if (root) {
        if (keydownHandler) {
          root.removeEventListener("keydown", keydownHandler);
        }
        if (pasteHandler) {
          root.removeEventListener("paste", pasteHandler);
        }
        if (focusHandler) {
          root.removeEventListener("focus", focusHandler);
        }
      }
      quillRef.current = null;
    };
  }, [copy.composerPlaceholder, scheduleScrollToBottom, setComposerValue]);

  useEffect(() => {
    const loadEmojis = async () => {
      try {
        const response = await emojiControllerFindAll({
          query: { page: 1, limit: 100, grouped: true },
        });
        const groups = normalizeEmojiGroups(response);
        setEmojiGroups(groups);
      } catch (error) {
        console.error("Failed to load emoji list:", error);
      }
    };

    void loadEmojis();
  }, []);

  useEffect(() => {
    if (!emojiOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!emojiPanelRef.current?.contains(event.target as Node)) {
        setEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [emojiOpen]);

  const handleEmojiSelect = async (emoji: EmojiRecord) => {
    const quill = quillRef.current as {
      getSelection: (focus: boolean) => { index: number } | null;
      getLength: () => number;
      insertEmbed: (
        index: number,
        type: string,
        value: unknown,
        source: string,
      ) => void;
      insertText: (index: number, text: string, source: string) => void;
      setSelection: (index: number, length: number, source: string) => void;
    } | null;
    if (!quill) {
      return;
    }

    const selection = quill.getSelection(true);
    const index = selection?.index ?? quill.getLength();

    quill.insertEmbed(
      index,
      "emoji",
      { src: emoji.url, alt: emoji.name, name: emoji.name },
      "user",
    );
    quill.insertText(index + 1, " ", "user");
    quill.setSelection(index + 2, 0, "silent");

    try {
      await emojiControllerIncrementUseCount({ path: { id: emoji.id } });
    } catch (error) {
      console.error("Failed to update emoji usage:", error);
    }
  };

  const scrollEmojiTabs = (direction: "prev" | "next") => {
    emojiTabsViewportRef.current?.scrollBy({
      left: direction === "next" ? 180 : -180,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const handleViewportChange = () => {
      if (
        !composerContainerRef.current?.contains(document.activeElement) ||
        !shouldAutoScrollRef.current
      ) {
        return;
      }

      scheduleScrollToBottom();
    };

    viewport.addEventListener("resize", handleViewportChange);
    viewport.addEventListener("scroll", handleViewportChange);

    return () => {
      viewport.removeEventListener("resize", handleViewportChange);
      viewport.removeEventListener("scroll", handleViewportChange);
    };
  }, [scheduleScrollToBottom]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport || !selectedThreadKey) {
      return;
    }

    const updateStickyState = () => {
      const distanceToBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      const isNearBottom = distanceToBottom <= 48;
      shouldAutoScrollRef.current = isNearBottom;
      setShowJumpToBottom(!isNearBottom);

      if (isNearBottom) {
        setPendingMessageCount(0);
      }
    };

    updateStickyState();
    viewport.addEventListener("scroll", updateStickyState, { passive: true });

    return () => {
      viewport.removeEventListener("scroll", updateStickyState);
    };
  }, [selectedThreadKey]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport || !selectedThreadKey || !hasMoreHistory) {
      return;
    }

    const maybeLoadOlderHistory = () => {
      if (
        viewport.scrollTop > 32 ||
        isLoadingOlderHistory ||
        historyRestoreRef.current
      ) {
        return;
      }

      cancelScheduledScroll();
      historyRestoreRef.current = {
        previousScrollHeight: viewport.scrollHeight,
        previousScrollTop: viewport.scrollTop,
      };
      void onLoadOlderHistory();
    };

    maybeLoadOlderHistory();
    viewport.addEventListener("scroll", maybeLoadOlderHistory, { passive: true });

    return () => {
      viewport.removeEventListener("scroll", maybeLoadOlderHistory);
    };
  }, [
    cancelScheduledScroll,
    hasMoreHistory,
    isLoadingOlderHistory,
    onLoadOlderHistory,
    selectedThreadKey,
  ]);

  useLayoutEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport || !selectedThreadKey) {
      previousThreadKeyRef.current = selectedThreadKey;
      previousHistorySnapshotRef.current = {
        length: groupedPrivateHistory.length,
        firstId: firstHistoryMessageId,
        lastId: lastHistoryMessageId,
      };
      historyRestoreRef.current = null;
      return;
    }

    const previousThreadKey = previousThreadKeyRef.current;
    const previousSnapshot = previousHistorySnapshotRef.current;
    const switchedThread =
      previousThreadKey == null || previousThreadKey !== selectedThreadKey;
    const hasMoreMessages = groupedPrivateHistory.length > previousSnapshot.length;
    const prependedHistory =
      hasMoreMessages &&
      previousSnapshot.firstId != null &&
      firstHistoryMessageId != null &&
      previousSnapshot.firstId !== firstHistoryMessageId;
    const appendedMessages =
      hasMoreMessages &&
      previousSnapshot.lastId != null &&
      lastHistoryMessageId != null &&
      previousSnapshot.lastId !== lastHistoryMessageId;

    if (switchedThread) {
      initialScrollPendingRef.current = true;
      historyRestoreRef.current = null;
      shouldAutoScrollRef.current = true;
      setShowJumpToBottom(false);
      setPendingMessageCount(0);
    } else if (prependedHistory && historyRestoreRef.current) {
      const { previousScrollHeight, previousScrollTop } = historyRestoreRef.current;
      viewport.scrollTop =
        previousScrollTop + (viewport.scrollHeight - previousScrollHeight);
      historyRestoreRef.current = null;
      shouldAutoScrollRef.current = false;
    } else if (appendedMessages && shouldAutoScrollRef.current) {
      scheduleScrollToBottom();
    } else if (appendedMessages) {
      setPendingMessageCount((prev) => prev + (groupedPrivateHistory.length - previousSnapshot.length));
      setShowJumpToBottom(true);
    } else if (!isLoadingOlderHistory && historyRestoreRef.current) {
      historyRestoreRef.current = null;
    }

    previousThreadKeyRef.current = selectedThreadKey;
    previousHistorySnapshotRef.current = {
      length: groupedPrivateHistory.length,
      firstId: firstHistoryMessageId,
      lastId: lastHistoryMessageId,
    };
  }, [
    firstHistoryMessageId,
    groupedPrivateHistory.length,
    isLoadingOlderHistory,
    lastHistoryMessageId,
    scheduleScrollToBottom,
    selectedThreadKey,
  ]);

  useEffect(() => {
    if (!selectedThreadKey) {
      return;
    }

    setPendingMessageCount(0);
    setShowJumpToBottom(false);
    initialScrollPendingRef.current = true;
    historyRestoreRef.current = null;
    setMessageMenu(null);
    setShowReportDialog(false);
  }, [selectedThreadKey]);

  useEffect(() => {
    if (!selectedThreadKey || detailLoading || !initialScrollPendingRef.current) {
      return;
    }

    initialScrollPendingRef.current = false;
    scrollToBottom();
  }, [detailLoading, scrollToBottom, selectedThreadKey]);

  useEffect(() => {
    return () => {
      cancelScheduledScroll();
    };
  }, [cancelScheduledScroll]);

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
    scheduleScrollToBottom("smooth");
  };

  const handleMessageImageLoaded = useCallback(() => {
    if (shouldAutoScrollRef.current) {
      scheduleScrollToBottom();
    }
  }, [scheduleScrollToBottom]);

  const handleOpenImageViewer = useCallback((images: string[], index: number) => {
    setImageViewerImages(images);
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  }, []);

  const handleOpenRecallMenu = useCallback((messageId: number, x: number, y: number) => {
    const menuWidth = 176;
    const menuHeight = 56;
    const padding = 12;

    setMessageMenu({
      messageId,
      x: Math.min(Math.max(x, padding), window.innerWidth - menuWidth - padding),
      y: Math.min(Math.max(y, padding), window.innerHeight - menuHeight - padding),
    });
  }, []);

  if (!selectedItem) {
    return null;
  }

  // 对于非私信类型（notification/system），渲染简单的详情视图
  if (selectedItem.type !== "private") {
    return (
      <>
        <section
          className={cn(
            "min-h-0 min-w-0 flex-1 flex-col bg-background md:flex",
            isMobileDetailOpen ? "flex" : "hidden",
          )}
        >
          <div className="flex min-w-0 shrink-0 items-center justify-between border-b border-card bg-card px-4 py-2">
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
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-foreground">
                  {selectedItem.title || tMsg("untitled")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(selectedItem.createdAt || "", tTime, locale)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center">
              <Button
                className="hidden rounded-full md:inline-flex"
                onClick={() => void markAllAsRead(selectedTab)}
              >
                {copy.markAll}
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="relative min-h-0 min-w-0 flex-1 px-4 py-6">
              <div className="mx-auto max-w-2xl">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  {selectedItem.title || tMsg("untitled")}
                </h3>
                <div
                  className="prose prose-sm max-w-none text-sm text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: prepareRichTextHtmlForSummary(selectedItem.content || ""),
                  }}
                />
                <div className="mt-6 text-xs text-muted-foreground">
                  {formatRelativeTime(selectedItem.createdAt || "", tTime, locale)}
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  // 私信类型保持原有逻辑

  return (
    <>
      <section
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col bg-background md:flex",
          isMobileDetailOpen ? "flex" : "hidden",
        )}
      >
        <div className="flex min-w-0 shrink-0 items-center justify-between border-b border-card bg-card px-4 py-2">
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
            <DropdownMenu
              title={tMenu("moreActions")}
              className="mr-2"
              items={userMenuItems}
              trigger={({ isOpen }) => (
                <Button
                  size="sm"
                  className={cn("rounded-full p-1!", isOpen && "bg-muted text-primary")}
                  disabled={blockSubmitting || reportSubmitting}
                >
                  <span className="sr-only">{tMenu("moreActions")}</span>
                  <MoreVertical size={16} />
                </Button>
              )}
            />
            <Button
              className="hidden rounded-full md:inline-flex"
              onClick={() => void markAllAsRead(selectedTab)}
            >
              {copy.markAll}
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 min-w-0 flex-1 px-2 md:px-0">
            <div
              ref={scrollViewportRef}
              className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto pb-0! py-4 md:border-r md:border-border md:pl-4 md:pr-1 md:py-4"
              style={{ scrollbarWidth: "none" }}
            >
              {groupedPrivateHistory.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {isLoadingOlderHistory ? (
                    <div className="flex justify-center py-1 text-xs text-muted-foreground">
                      {tCommon("loading")}
                    </div>
                  ) : null}

                  {groupedPrivateHistory.map(({ item, showDayDivider, dayLabel }) => (
                    <PrivateMessageRow
                      key={item.id}
                      item={item}
                      showDayDivider={showDayDivider}
                      dayLabel={dayLabel}
                      userId={userId}
                      copy={copy}
                      onRecall={handleOpenRecallMenu}
                      onOpenImageViewer={handleOpenImageViewer}
                      onImageLoaded={handleMessageImageLoaded}
                    />
                  ))}
                  <div ref={bottomAnchorRef} className="h-px w-full shrink-0" />
                </div>
              ) : detailLoading ? (
                <div className="text-sm text-muted-foreground">{tCommon("loading")}</div>
              ) : (
                <div className="text-sm text-muted-foreground">{copy.privatePlaceholder}</div>
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

          <div className="min-w-0 border-t border-border bg-background/92 py-3 backdrop-blur md:px-3 md:pr-0">
            {composerImages.length > 0 ? (
              <div className="mb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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
                <div className="relative" ref={emojiPanelRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full p-2"
                    onClick={() => setEmojiOpen((open) => !open)}
                    aria-label="表情"
                  >
                    <Smile size={16} />
                  </Button>

                  {emojiOpen && (
                    <div className="absolute bottom-full z-10 mb-3 w-max max-w-[calc(100vw-1rem)] min-w-[18rem] overflow-hidden rounded-2xl border border-border bg-card shadow-xl md:min-w-[24rem]">
                      <div className="flex h-10 items-center gap-2 rounded-t-xl border-b border-border bg-border px-2.5">
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:bg-card"
                          onClick={() => scrollEmojiTabs("prev")}
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        <div
                          ref={emojiTabsViewportRef}
                          className="flex h-10 flex-1 items-center gap-1.5 overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden"
                        >
                          <button
                            type="button"
                            className={cn(
                              "flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-md px-2 text-xs transition-colors hover:bg-card",
                              activeEmojiGroup === "all" &&
                                "bg-card text-primary",
                            )}
                            onClick={() => setActiveEmojiGroup("all")}
                          >
                            <span className="text-xs font-medium">全部</span>
                          </button>
                          {emojiGroups.map((group) => (
                            <button
                              key={group.name}
                              type="button"
                              className={cn(
                                "flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-xl px-2 transition-colors hover:bg-card",
                                activeEmojiGroup === group.name &&
                                  "bg-card text-primary",
                              )}
                              onClick={() => setActiveEmojiGroup(group.name)}
                              title={group.name}
                            >
                              {group.items[0]?.url ? (
                                <img
                                  src={group.items[0].url}
                                  alt={group.name}
                                  className="h-4.5 w-4.5 cursor-pointer object-contain"
                                />
                              ) : (
                                <span className="text-xs font-medium">
                                  {group.name.slice(0, 1)}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:bg-card"
                          onClick={() => scrollEmojiTabs("next")}
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                      <div className="grid h-52 grid-cols-7 content-start gap-1 overflow-y-auto px-2 py-2">
                        {emojiList.length > 0 ? (
                          emojiList.map((emoji) => (
                            <button
                              key={emoji.id}
                              type="button"
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-transparent p-1 transition-all hover:border-border hover:bg-primary/15"
                              onClick={() => void handleEmojiSelect(emoji)}
                              title={emoji.name}
                            >
                              <img
                                src={emoji.url}
                                alt={emoji.name}
                                className="max-h-7 max-w-7 object-contain"
                              />
                            </button>
                          ))
                        ) : (
                          <div className="col-span-7 py-8 text-center text-sm text-muted-foreground">
                            暂无表情
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

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

              <div
                ref={composerContainerRef}
                className="comment-editor-shell flex min-h-9 min-w-0 flex-1 items-center overflow-hidden [&_.ql-editor]:max-h-36 [&_.ql-editor]:min-h-6 [&_.ql-editor]:px-0 [&_.ql-editor]:py-1 [&_.ql-editor]:text-sm [&_.ql-editor]:leading-6 [&_.ql-editor.ql-blank::before]:font-normal [&_.ql-editor.ql-blank::before]:text-sm [&_.ql-editor.ql-blank::before]:text-muted-foreground [&_.ql-editor]:w-full! border-0!"
              />

              <div className="flex h-full shrink-0">
                <Button
                  onClick={() => void handleSendRef.current()}
                  variant="primary"
                  size="sm"
                  className="self-end rounded-full px-4"
                  disabled={
                    isSending ||
                    isUploadingImages ||
                    (!editorHasContent &&
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
