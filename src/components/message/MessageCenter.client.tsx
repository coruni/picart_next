"use client";

import {
  messageControllerBlockPrivateUser,
  messageControllerGetPrivateConversation,
  messageControllerMarkPrivateMessagesRead,
  reportControllerCreate,
  uploadControllerUploadFile,
  userControllerFindOne,
} from "@/api";
import type {
  ComposerImageItem,
  MessageCenterCopy,
  MessageCenterTabItem,
  PrivateHistoryItem,
  PrivateMessagePayload,
  PrivateRealtimePayload,
  PrivateUserStatus,
} from "@/components/message/MessageCenter.types";
import {
  getMessageDayKey,
  getMessageDayLabel,
} from "@/components/message/MessageCenter.utils";
import { MessageConversationList } from "@/components/message/MessageConversationList";
import { MessageDetailPane } from "@/components/message/MessageDetailPane";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { useIsMobile } from "@/hooks";
import { useImageCompression } from "@/hooks/useImageCompression";
import { buildUploadMetadata } from "@/lib/file-hash";
import { usePathname, useRouter } from "@/i18n/routing";
import { messageSocketClient } from "@/lib/message-socket";
import { openLoginDialog } from "@/lib/modal-helpers";
import { useMessageNotificationStore, useUserStore } from "@/stores";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

type PrivateHistorySourceItem = {
  id?: number;
  senderId?: number | null;
  receiverId?: number | null;
  messageKind?: string;
  content?: string;
  payload?: PrivateMessagePayload;
  createdAt?: string;
  isRead?: boolean;
  recalledAt?: string;
  recallReason?: string;
  isRecalled?: boolean;
};

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

function buildPrivateHistoryCursor(items: PrivateHistoryItem[]): string | null {
  const oldestItem = items[0];

  if (
    !oldestItem?.id ||
    !oldestItem.createdAt ||
    typeof window === "undefined"
  ) {
    return null;
  }

  try {
    return window.btoa(
      JSON.stringify({
        time: oldestItem.createdAt,
        id: oldestItem.id,
      }),
    );
  } catch {
    return null;
  }
}

function resolvePrivateHistoryCursor(
  nextCursor: unknown,
  items: PrivateHistoryItem[],
): string | null {
  if (typeof nextCursor === "string" && nextCursor.trim()) {
    return nextCursor;
  }

  return buildPrivateHistoryCursor(items);
}

function normalizePrivateHistoryItem(
  item: PrivateHistorySourceItem,
): PrivateHistoryItem | null {
  if (!item.id) {
    return null;
  }

  const imageUrl = resolveMessageImageUrl(item.payload);
  if (!item.content && !imageUrl && !item.isRecalled) {
    return null;
  }

  return {
    id: item.id,
    senderId: item.senderId ?? undefined,
    receiverId: item.receiverId ?? undefined,
    content: item.content,
    messageKind: item.messageKind,
    payload: item.payload,
    createdAt: item.createdAt,
    isRead: item.isRead,
    recalledAt: item.recalledAt,
    recallReason: item.recallReason,
    isRecalled: item.isRecalled,
  };
}

export function MessageCenterClient() {
  const tCommon = useTranslations("common");
  const tMsg = useTranslations("messageDropdown");
  const tTime = useTranslations("time");
  const locale = useLocale();
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const copy: MessageCenterCopy = {
    title: tMsg("center.title"),
    subtitle: tMsg("center.subtitle"),
    searchPlaceholder: tMsg("center.searchPlaceholder"),
    chatList: tMsg("center.chatList"),
    detailPlaceholder: tMsg("center.detailPlaceholder"),
    privatePlaceholder: tMsg("center.privatePlaceholder"),
    noConversation: tMsg("center.noConversation"),
    noMessages: tMsg("center.noMessages"),
    noResults: tMsg("center.noResults"),
    markAll: tMsg("center.markAll"),
    privateHeader: tMsg("center.privateHeader"),
    notificationHeader: tMsg("center.notificationHeader"),
    realtime: tMsg("center.realtime"),
    emptyThread: tMsg("center.emptyThread"),
    lastSeenRecently: tMsg("center.lastSeenRecently"),
    composerPlaceholder: tMsg("center.composerPlaceholder"),
    unreadSuffix: tMsg("center.unreadSuffix"),
    uploadImage: tMsg("center.uploadImage"),
    removeImage: tMsg("center.removeImage"),
    uploadingImage: tMsg("center.uploadingImage"),
    imageMessage: tMsg("center.imageMessage"),
    jumpToLatest: tMsg("center.jumpToLatest"),
    newMessagesSuffix: tMsg("center.newMessagesSuffix"),
    online: tMsg("center.online"),
    recall: tMsg("center.recall"),
    recalledMessage: tMsg("center.recalledMessage"),
    recalledMessageByOther: tMsg("center.recalledMessageByOther"),
    recalledPreview: tMsg("center.recalledPreview"),
    recallReasonDefault: tMsg("center.recallReasonDefault"),
    imageOnlyPreview: tMsg("center.imageOnlyPreview"),
  };
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab");
  const queryItemId = Number(searchParams.get("item"));
  const queryUserId = Number(searchParams.get("userId"));
  const user = useUserStore((state) => state.user);
  const token = useUserStore((state) => state.token);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const messages = useMessageNotificationStore((state) => state.centerMessages);
  const selectedTab = useMessageNotificationStore((state) => state.selectedTab);
  const unreadCount = useMessageNotificationStore((state) => state.unreadCount);
  const socketConnected = useMessageNotificationStore(
    (state) => state.socketConnected,
  );
  const isLoading = useMessageNotificationStore((state) => state.isLoading);
  const isSwitchingTab = useMessageNotificationStore((state) => state.isSwitchingTab);
  const fetchMessages = useMessageNotificationStore(
    (state) => state.fetchMessages,
  );
  const fetchUnreadCount = useMessageNotificationStore(
    (state) => state.fetchUnreadCount,
  );
  const markAllAsRead = useMessageNotificationStore(
    (state) => state.markAllAsRead,
  );
  const setSelectedTab = useMessageNotificationStore(
    (state) => state.setSelectedTab,
  );
  const initializeSocket = useMessageNotificationStore(
    (state) => state.initializeSocket,
  );
  const resetNotifications = useMessageNotificationStore(
    (state) => state.reset,
  );

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [privateHistory, setPrivateHistory] = useState<PrivateHistoryItem[]>(
    [],
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [privateHistoryCursor, setPrivateHistoryCursor] = useState<
    string | null
  >(null);
  const [hasMorePrivateHistory, setHasMorePrivateHistory] = useState(false);
  const [isLoadingOlderHistory, setIsLoadingOlderHistory] = useState(false);
  const [composerValue, setComposerValue] = useState("");
  const [composerImages, setComposerImages] = useState<ComposerImageItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedUserStatus, setSelectedUserStatus] =
    useState<PrivateUserStatus | null>(null);
  const [pendingPrivateTarget, setPendingPrivateTarget] = useState<{
    id: number;
    title: string;
    avatarUrl?: string;
    counterpartId: number;
  } | null>(null);
  const composerImagesRef = useRef<ComposerImageItem[]>([]);
  const { compressImages, validateFiles } = useImageCompression();

  const tabs: MessageCenterTabItem[] = [
    { value: "all", label: tMsg("tabs.all") },
    { value: "notification", label: tMsg("tabs.notification") },
    { value: "private", label: tMsg("tabs.private") },
    { value: "system", label: tMsg("tabs.system") },
  ];

  const initialTab =
    queryUserId
      ? "private"
      : queryTab === "all" ||
    queryTab === "notification" ||
    queryTab === "private" ||
    queryTab === "system"
        ? queryTab
        : "all";

  const existingQueryConversation = useMemo(() => {
    if (!queryUserId) {
      return null;
    }

    return (
      messages.find(
        (item) =>
          item.type === "private" &&
          Number(item.counterpartId || 0) === Number(queryUserId),
      ) || null
    );
  }, [messages, queryUserId]);

  const pendingPrivateItem = useMemo(() => {
    if (!pendingPrivateTarget) {
      return null;
    }

    return {
      id: pendingPrivateTarget.id,
      type: "private" as const,
      title: pendingPrivateTarget.title,
      content: "",
      createdAt: "",
      isRead: true,
      href: `/message?tab=private&userId=${pendingPrivateTarget.counterpartId}`,
      avatarUrl: pendingPrivateTarget.avatarUrl,
      counterpartId: pendingPrivateTarget.counterpartId,
      unreadCount: 0,
    };
  }, [pendingPrivateTarget]);

  const displayedMessages = useMemo(() => {
    if (
      !pendingPrivateItem ||
      existingQueryConversation ||
      messages.some((item) => item.id === pendingPrivateItem.id)
    ) {
      return messages;
    }

    return [pendingPrivateItem, ...messages];
  }, [existingQueryConversation, messages, pendingPrivateItem]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      resetNotifications();
      return;
    }

    initializeSocket(token);
    void fetchUnreadCount();
    setSelectedTab(initialTab);
    void fetchMessages(initialTab);
  }, [
    fetchMessages,
    fetchUnreadCount,
    initialTab,
    initializeSocket,
    isAuthenticated,
    resetNotifications,
    setSelectedTab,
    token,
  ]);

  const filteredMessages = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();
    if (!keyword) {
      return displayedMessages;
    }

    return displayedMessages.filter((item) =>
      [item.title, item.content].some((value) =>
        value?.toLowerCase().includes(keyword),
      ),
    );
  }, [deferredSearch, displayedMessages]);

  const selectedItem = useMemo(() => {
    return displayedMessages.find((item) => item.id === selectedItemId) || null;
  }, [displayedMessages, selectedItemId]);

  const selectedPrivateCounterpartId =
    selectedItem?.type === "private"
      ? (selectedItem.counterpartId ?? null)
      : null;

  useEffect(() => {
    if (queryItemId) {
      setSelectedItemId(queryItemId);
      return;
    }

    if (existingQueryConversation) {
      setSelectedItemId(existingQueryConversation.id);
      return;
    }

    if (pendingPrivateItem) {
      setSelectedItemId(pendingPrivateItem.id);
      return;
    }

    if (!isMobile && !selectedItemId && filteredMessages.length > 0) {
      setSelectedItemId(filteredMessages[0].id);
    }
  }, [
    existingQueryConversation,
    filteredMessages,
    isMobile,
    pendingPrivateItem,
    queryItemId,
    selectedItemId,
  ]);

  const isMobileDetailOpen = isMobile && Boolean(selectedItem);

  const handleBackToList = () => {
    setSelectedItemId(null);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("item");
    nextParams.delete("userId");

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  const requireAuth = () => {
    if (isAuthenticated) {
      return true;
    }

    openLoginDialog();
    return false;
  };

  const removeSelectedPrivateConversation = () => {
    if (!selectedItem || selectedItem.type !== "private") {
      return;
    }

    const selectedConversationId = selectedItem.id;
    const selectedCounterpartId = Number(selectedItem.counterpartId || 0);

    useMessageNotificationStore.setState((state) => ({
      centerMessages: state.centerMessages.filter((message) => {
        if (message.type !== "private") {
          return true;
        }

        return (
          message.id !== selectedConversationId &&
          Number(message.counterpartId || 0) !== selectedCounterpartId
        );
      }),
      dropdownMessages: state.dropdownMessages.filter((message) => {
        if (message.type !== "private") {
          return true;
        }

        return (
          message.id !== selectedConversationId &&
          Number(message.counterpartId || 0) !== selectedCounterpartId
        );
      }),
    }));

    handleBackToList();
  };

  const handleTabChange = (tab: MessageCenterTabItem["value"]) => {
    setSelectedTab(tab);
    setSelectedItemId(null);
    void fetchMessages(tab);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", tab);
    nextParams.delete("item");
    nextParams.delete("userId");

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  useEffect(() => {
    if (!queryUserId || !isAuthenticated) {
      setPendingPrivateTarget(null);
      return;
    }

    if (existingQueryConversation) {
      setPendingPrivateTarget(null);
      return;
    }

    let cancelled = false;

    const loadTargetUser = async () => {
      try {
        const response = await userControllerFindOne({
          path: { id: String(queryUserId) },
        });
        const targetUser = response?.data?.data;

        if (cancelled || !targetUser?.id) {
          return;
        }

        setPendingPrivateTarget({
          id: -Number(targetUser.id),
          title: targetUser.nickname || targetUser.username || tMsg("untitled"),
          avatarUrl: targetUser.avatar || undefined,
          counterpartId: Number(targetUser.id),
        });
      } catch (error) {
        console.error("Failed to load private message target:", error);
        if (!cancelled) {
          setPendingPrivateTarget(null);
        }
      }
    };

    void loadTargetUser();

    return () => {
      cancelled = true;
    };
  }, [existingQueryConversation, isAuthenticated, queryUserId, tMsg]);

  const handleReportSelectedUser = async (payload: {
    category: "SPAM" | "ABUSE" | "INAPPROPRIATE" | "COPYRIGHT" | "OTHER";
    reason: string;
  }) => {
    if (!selectedPrivateCounterpartId || !requireAuth()) {
      return;
    }

    setReportSubmitting(true);
    try {
      await reportControllerCreate({
        body: {
          type: "USER",
          category: payload.category,
          reason: payload.reason,
          reportedUserId: Number(selectedPrivateCounterpartId),
        },
      });
    } catch (error) {
      console.error("Failed to report private user:", error);
      throw error;
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleBlockSelectedUser = async () => {
    if (!selectedPrivateCounterpartId || !requireAuth() || blockSubmitting) {
      return;
    }

    setBlockSubmitting(true);
    try {
      await messageControllerBlockPrivateUser({
        path: { userId: String(selectedPrivateCounterpartId) },
      });
      setBlockDialogOpen(false);
      removeSelectedPrivateConversation();
      void fetchUnreadCount();
    } catch (error) {
      console.error("Failed to block private user:", error);
    } finally {
      setBlockSubmitting(false);
    }
  };

  const openBlockDialog = () => {
    if (!selectedPrivateCounterpartId || !requireAuth()) {
      return;
    }
    setBlockDialogOpen(true);
  };

  useEffect(() => {
    composerImagesRef.current = composerImages;
  }, [composerImages]);

  useEffect(() => {
    if (!selectedPrivateCounterpartId) {
      setPrivateHistory([]);
      setPrivateHistoryCursor(null);
      setHasMorePrivateHistory(false);
      setSelectedUserStatus(null);
      setComposerValue("");
      setComposerImages((current) => {
        current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        return [];
      });
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setDetailLoading(true);
      try {
        const restResponse = await messageControllerGetPrivateConversation({
          path: { userId: String(selectedPrivateCounterpartId) },
          query: { limit: 100 },
        });
        const nextHistorySource = restResponse?.data?.data?.data || [];
        const nextMeta = restResponse?.data?.data?.meta;

        const nextHistory = nextHistorySource
          .map(normalizePrivateHistoryItem)
          .filter((item): item is PrivateHistoryItem => item !== null)
          .sort((a, b) => {
            const aTime = new Date(a.createdAt || 0).getTime();
            const bTime = new Date(b.createdAt || 0).getTime();
            return aTime - bTime;
          });

        if (cancelled) {
          return;
        }

        setPrivateHistory(nextHistory);
        setHasMorePrivateHistory(Boolean(nextMeta?.hasMore));
        setPrivateHistoryCursor(
          resolvePrivateHistoryCursor(nextMeta?.nextCursor, nextHistory),
        );

        const unreadIds = nextHistory
          .filter(
            (item) =>
              item.receiverId != null &&
              user?.id != null &&
              Number(item.receiverId) === Number(user.id) &&
              !item.isRead,
          )
          .map((item) => item.id);

        if (unreadIds.length > 0) {
          const socket = messageSocketClient.instance;
          if (socket?.connected) {
            socket.emit("readPrivateMessages", { messageIds: unreadIds });
          } else {
            await messageControllerMarkPrivateMessagesRead({
              body: {
                messageIds: unreadIds as unknown as string[],
              },
            });
          }

          useMessageNotificationStore.setState((state) => ({
            centerMessages: state.centerMessages.map((message) =>
              message.id === selectedItemId
                ? { ...message, isRead: true, unreadCount: 0 }
                : message,
            ),
          }));

          void fetchUnreadCount();
        }
      } catch (error) {
        console.error("Failed to fetch private history:", error);
        if (!cancelled) {
          setPrivateHistory([]);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [
    fetchUnreadCount,
    selectedItemId,
    selectedPrivateCounterpartId,
    user?.id,
  ]);

  useEffect(() => {
    return () => {
      composerImagesRef.current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  useEffect(() => {
    if (!selectedPrivateCounterpartId) {
      setSelectedUserStatus(null);
      return;
    }

    const socket = messageSocketClient.instance;
    if (!socket?.connected) {
      return;
    }

    const targetUserId = Number(selectedPrivateCounterpartId);

    const handleUserStatus = (payload: {
      userId?: number;
      isOnline?: boolean;
      lastSeenAt?: string | null;
    }) => {
      if (Number(payload.userId || 0) !== targetUserId) {
        return;
      }

      setSelectedUserStatus({
        userId: targetUserId,
        isOnline: Boolean(payload.isOnline),
        lastSeenAt: payload.lastSeenAt ?? null,
      });
    };

    socket.on("userStatus", handleUserStatus);
    socket.on("userStatusChanged", handleUserStatus);
    socket.emit("subscribeUserStatus", { userId: targetUserId });

    return () => {
      socket.emit("unsubscribeUserStatus", { userId: targetUserId });
      socket.off("userStatus", handleUserStatus);
      socket.off("userStatusChanged", handleUserStatus);
    };
  }, [selectedPrivateCounterpartId, socketConnected]);

  const handleLoadOlderHistory = async () => {
    if (
      !selectedPrivateCounterpartId ||
      !privateHistoryCursor ||
      !hasMorePrivateHistory ||
      isLoadingOlderHistory
    ) {
      return;
    }

    setIsLoadingOlderHistory(true);

    try {
      const restResponse = await messageControllerGetPrivateConversation({
        path: { userId: String(selectedPrivateCounterpartId) },
        query: {
          cursor: privateHistoryCursor,
          limit: 100,
        },
      });

      const olderHistorySource = restResponse?.data?.data?.data || [];
      const olderMeta = restResponse?.data?.data?.meta;

      const olderHistory = olderHistorySource
        .map(normalizePrivateHistoryItem)
        .filter((item): item is PrivateHistoryItem => item !== null)
        .sort((a, b) => {
          const aTime = new Date(a.createdAt || 0).getTime();
          const bTime = new Date(b.createdAt || 0).getTime();
          return aTime - bTime;
        });

      let mergedHistory: PrivateHistoryItem[] = privateHistory;

      if (olderHistory.length > 0) {
        mergedHistory = (() => {
          const merged = [...olderHistory, ...privateHistory];
          const unique = new Map<number, PrivateHistoryItem>();

          for (const item of merged) {
            unique.set(item.id, item);
          }

          return Array.from(unique.values()).sort((a, b) => {
            const aTime = new Date(a.createdAt || 0).getTime();
            const bTime = new Date(b.createdAt || 0).getTime();
            return aTime - bTime;
          });
        })();

        setPrivateHistory(mergedHistory);
      }

      setHasMorePrivateHistory(
        olderHistory.length > 0 && Boolean(olderMeta?.hasMore),
      );
      setPrivateHistoryCursor(
        olderHistory.length > 0
          ? resolvePrivateHistoryCursor(olderMeta?.nextCursor, mergedHistory)
          : null,
      );
    } catch (error) {
      console.error("Failed to load older private history:", error);
    } finally {
      setIsLoadingOlderHistory(false);
    }
  };

  useEffect(() => {
    if (!selectedPrivateCounterpartId) {
      return;
    }

    const socket = messageSocketClient.instance;
    if (!socket) {
      return;
    }

    const handlePrivateMessage = (payload: PrivateRealtimePayload) => {
      const senderId = Number(payload.senderId || 0);
      const receiverId = Number(payload.receiverId || 0);
      const counterpartId = Number(selectedPrivateCounterpartId || 0);
      const viewerId = Number(user?.id || 0);
      const matched =
        (senderId === counterpartId && receiverId === viewerId) ||
        (senderId === viewerId && receiverId === counterpartId);

      const imageUrl = resolveMessageImageUrl(payload.payload);

      if (
        !matched ||
        !payload.id ||
        (!payload.content && !imageUrl && !payload.isRecalled)
      ) {
        return;
      }

      setPrivateHistory((prev) => {
        const nextItem: PrivateHistoryItem = {
          id: payload.id,
          senderId,
          receiverId,
          content: payload.content,
          messageKind: payload.messageKind,
          payload: payload.payload,
          createdAt: payload.createdAt,
          isRead: payload.isRead,
          recalledAt: payload.recalledAt,
          recallReason: payload.recallReason,
          isRecalled: payload.isRecalled,
        };

        if (prev.some((item) => item.id === nextItem.id)) {
          return prev;
        }

        return [...prev, nextItem];
      });
    };

    const handlePrivateMessageRecalled = (payload: {
      id?: number;
      recalledAt?: string;
      recallReason?: string;
      isRecalled?: boolean;
    }) => {
      if (!payload.id) {
        return;
      }

      setPrivateHistory((prev) =>
        prev.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                isRecalled: true,
                recalledAt: payload.recalledAt ?? item.recalledAt,
                recallReason: payload.recallReason ?? item.recallReason,
              }
            : item,
        ),
      );
    };

    socket.on("privateMessage", handlePrivateMessage);
    socket.on("privateMessageRecalled", handlePrivateMessageRecalled);
    return () => {
      socket.off("privateMessage", handlePrivateMessage);
      socket.off("privateMessageRecalled", handlePrivateMessageRecalled);
    };
  }, [selectedPrivateCounterpartId, user?.id]);

  const groupedPrivateHistory = useMemo(() => {
    return privateHistory.map((item, index) => {
      const previousItem = privateHistory[index - 1];
      const dayKey = getMessageDayKey(item.createdAt);
      const previousDayKey = getMessageDayKey(previousItem?.createdAt);

      return {
        item,
        showDayDivider: index === 0 || dayKey !== previousDayKey,
        dayLabel: getMessageDayLabel(item.createdAt, locale),
      };
    });
  }, [locale, privateHistory]);

  const handlePickComposerImages = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const nextFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (!nextFiles.length) {
      return;
    }

    setIsUploadingImages(true);

    void (async () => {
      // 保存原始文件引用（用于计算 hash）
      const originalFiles = nextFiles;

      // 压缩图片
      const compressionResults = await compressImages(nextFiles);

      // 验证压缩后的文件大小
      const validation = validateFiles(
        compressionResults.map((r) => r.file),
        true,
      );
      if (!validation.valid) {
        console.error(validation.error);
        setIsUploadingImages(false);
        return;
      }

      const drafts = compressionResults.map((result, index) => ({
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        file: result.file,
        originalFile: originalFiles[index], // 保存原始文件用于计算 hash
        previewUrl: URL.createObjectURL(result.file),
      }));

      setComposerImages((current) => [
        ...current,
        ...drafts.map((draft) => ({
          id: draft.id,
          previewUrl: draft.previewUrl,
          uploading: true,
          fileName: draft.file.name,
        })),
      ]);

      try {
        for (const draft of drafts) {
          try {
            // 计算原始文件的 hash
            const metadata = await buildUploadMetadata([draft.originalFile]);

            const response = await uploadControllerUploadFile({
              body: { file: draft.file, metadata },
            });
            const uploadedUrl = response?.data?.data?.[0]?.url;

            if (!uploadedUrl) {
              throw new Error("Missing uploaded file url");
            }

            setComposerImages((current) =>
              current.map((item) =>
                item.id === draft.id
                  ? {
                      ...item,
                      uploadedUrl,
                      uploading: false,
                    }
                  : item,
              ),
            );
          } catch (error) {
            URL.revokeObjectURL(draft.previewUrl);
            setComposerImages((current) =>
              current.filter((item) => item.id !== draft.id),
            );
            console.error("Failed to upload private image:", error);
          }
        }
      } finally {
        setIsUploadingImages(false);
      }
    })();
  };

  const handleRemoveComposerImage = (id: string) => {
    setComposerImages((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const handleSendPrivateMessage = async () => {
    const content = composerValue.trim();
    const readyImages = composerImages.filter(
      (item) => !item.uploading && item.uploadedUrl,
    );
    const socket = messageSocketClient.instance;

    if (
      (!content && readyImages.length === 0) ||
      !selectedPrivateCounterpartId ||
      !socket?.connected ||
      isSending ||
      isUploadingImages
    ) {
      return;
    }

    setIsSending(true);

    try {
      if (readyImages.length > 0) {
        const uploadedUrls = readyImages
          .map((item) => item.uploadedUrl)
          .filter((url): url is string => Boolean(url));

        socket.emit("sendMessage", {
          toUserId: selectedPrivateCounterpartId,
          type: "private",
          messageKind: "image",
          content: content || undefined,
          payload: {
            url: uploadedUrls[0],
            urls: uploadedUrls,
          },
        });

        readyImages.forEach((item) => {
          URL.revokeObjectURL(item.previewUrl);
        });
      } else if (content) {
        socket.emit("sendMessage", {
          toUserId: selectedPrivateCounterpartId,
          type: "private",
          messageKind: "text",
          content,
        });
      }

      setComposerValue("");
      setComposerImages([]);
    } finally {
      setIsSending(false);
    }
  };

  const handleRecallPrivateMessage = async (messageId: number) => {
    const socket = messageSocketClient.instance;

    if (!socket?.connected || !messageId) {
      return;
    }

    socket.emit("recallPrivateMessage", {
      messageId,
      reason: copy.recallReasonDefault,
    });

    setPrivateHistory((prev) =>
      prev.map((item) =>
        item.id === messageId
          ? {
              ...item,
              isRecalled: true,
              recalledAt: new Date().toISOString(),
              recallReason: copy.recallReasonDefault,
            }
          : item,
      ),
    );
  };

  return (
    <div className="page-container h-[calc(100dvh-var(--header-height,60px))] overflow-hidden pb-0!">
      <div className="left-container h-[calc(100dvh-var(--header-height,60px)-16px)] min-h-0 overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="grid h-full min-h-0 md:grid-cols-[348px_minmax(0,1fr)]">
          <MessageConversationList
            copy={copy}
            filteredMessages={filteredMessages}
            isLoading={isLoading}
            isSwitchingTab={isSwitchingTab}
            isMobileDetailOpen={isMobileDetailOpen}
            locale={locale}
            onTabChange={handleTabChange}
            search={search}
            selectedItemId={selectedItemId}
            selectedTab={selectedTab}
            setSearch={setSearch}
            setSelectedItemId={setSelectedItemId}
            socketConnected={socketConnected}
            tabs={tabs}
            tCommon={tCommon}
            tMsg={tMsg}
            tTime={tTime}
          />
          <MessageDetailPane
            blockSubmitting={blockSubmitting}
            composerValue={composerValue}
            composerImages={composerImages}
            copy={copy}
            detailLoading={detailLoading}
            hasMoreHistory={hasMorePrivateHistory}
            isMobileDetailOpen={isMobileDetailOpen}
            groupedPrivateHistory={groupedPrivateHistory}
            handleRecallPrivateMessage={handleRecallPrivateMessage}
            handleSendPrivateMessage={handleSendPrivateMessage}
            isLoadingOlderHistory={isLoadingOlderHistory}
            isSending={isSending}
            isUploadingImages={isUploadingImages}
            locale={locale}
            markAllAsRead={markAllAsRead}
            onBlockSelectedUser={openBlockDialog}
            onPickComposerImages={handlePickComposerImages}
            onLoadOlderHistory={handleLoadOlderHistory}
            onRemoveComposerImage={handleRemoveComposerImage}
            onReportSelectedUser={handleReportSelectedUser}
            onBackToList={handleBackToList}
            reportSubmitting={reportSubmitting}
            selectedItem={selectedItem}
            selectedUserStatus={selectedUserStatus}
            selectedTab={selectedTab}
            setComposerValue={setComposerValue}
            tCommon={tCommon}
            tMsg={tMsg}
            tTime={tTime}
            unreadCount={unreadCount}
            userId={user?.id}
          />
        </div>
      </div>

      {/* 拉黑确认 Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6" showClose={false}>
          <DialogHeader className="mb-0 space-y-2 text-center sm:text-center">
            <DialogTitle>{tMsg("blockConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {tMsg("blockConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex-row justify-center gap-6! sm:justify-center">
            <Button
              variant="outline"
              className="h-8 rounded-full px-6 min-w-20"
              onClick={() => setBlockDialogOpen(false)}
              disabled={blockSubmitting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              className="h-8 rounded-full px-6 min-w-20"
              onClick={handleBlockSelectedUser}
              loading={blockSubmitting}
              disabled={blockSubmitting}
            >
              {tMsg("blockUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
