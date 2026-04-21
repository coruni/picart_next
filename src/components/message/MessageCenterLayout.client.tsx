"use client";

import type { MessageCenterCopy, MessageCenterTabItem } from "@/components/message/MessageCenter.types";
import { MessageConversationList } from "@/components/message/MessageConversationList";
import { resolveMessagePreviewText } from "@/components/message/MessageCenter.utils";
import { useIsMobile } from "@/hooks";
import { useRouter } from "@/i18n/routing";
import { buildMessageHrefFromItem, resolveMessageRouteType } from "@/lib/message-routes";
import type { MessageDropdownItem, MessageTab } from "@/stores/useMessageNotificationStore";
import { useMessageNotificationStore, useUserStore } from "@/stores";
import { userControllerFindOne } from "@/api";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { requestNotificationPermission, showNotification } from "@/lib/notifications";
import { getNotificationSetting, setNotificationSetting } from "@/lib/notification-settings";
import {
  type ReactNode,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

function resolveInitialTab(
  queryTab: string | null,
  routeType: MessageTab | null,
): MessageTab {
  if (
    queryTab === "all" ||
    queryTab === "notification" ||
    queryTab === "private" ||
    queryTab === "system"
  ) {
    return queryTab;
  }

  return routeType ?? "all";
}

export function MessageCenterLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const tCommon = useTranslations("common");
  const tMsg = useTranslations("messageDropdown");
  const tTime = useTranslations("time");
  const locale = useLocale();
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ type?: string | string[]; id?: string | string[] }>();
  const routeType = resolveMessageRouteType(
    typeof params.type === "string" ? params.type : null,
  );
  const routeId = Number(typeof params.id === "string" ? params.id : 0);
  const queryTab = searchParams.get("tab");
  const initialTab = resolveInitialTab(queryTab, routeType);
  const copy = useMemo<MessageCenterCopy>(
    () => ({
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
    }),
    [tMsg],
  );
  const token = useUserStore((state) => state.token);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const userId = useUserStore((state) => state.user?.id);
  const selectedTab = useMessageNotificationStore((state) => state.selectedTab);
  const messages = useMessageNotificationStore(
    (state) => state.centerMessagesByTab[selectedTab],
  );
  const socketConnected = useMessageNotificationStore(
    (state) => state.socketConnected,
  );
  const isLoading = useMessageNotificationStore((state) => state.isLoading);
  const hasLoadedMessages = useMessageNotificationStore(
    (state) => state.hasLoadedMessages,
  );
  const loadedCenterTabs = useMessageNotificationStore(
    (state) => state.loadedCenterTabs,
  );
  const fetchMessages = useMessageNotificationStore((state) => state.fetchMessages);
  const fetchUnreadCount = useMessageNotificationStore(
    (state) => state.fetchUnreadCount,
  );
  const setSelectedTab = useMessageNotificationStore(
    (state) => state.setSelectedTab,
  );
  const initializeSocket = useMessageNotificationStore(
    (state) => state.initializeSocket,
  );
  const resetNotifications = useMessageNotificationStore((state) => state.reset);

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [mobileViewportHeight, setMobileViewportHeight] = useState<
    number | null
  >(null);
  const [pendingPrivateTarget, setPendingPrivateTarget] = useState<{
    id: number;
    title: string;
    avatarUrl?: string;
    counterpartId: number;
  } | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(false);

  const tabs: MessageCenterTabItem[] = [
    { value: "all", label: tMsg("tabs.all") },
    { value: "notification", label: tMsg("tabs.notification") },
    { value: "private", label: tMsg("tabs.private") },
    { value: "system", label: tMsg("tabs.system") },
  ];

  const existingPrivateConversation = useMemo(() => {
    if (routeType !== "private" || !routeId) {
      return null;
    }

    return (
      messages.find(
        (item) =>
          item.type === "private" &&
          Number(item.counterpartId || 0) === Number(routeId),
      ) || null
    );
  }, [messages, routeId, routeType]);

  const pendingPrivateItem = useMemo<MessageDropdownItem | null>(() => {
    if (!pendingPrivateTarget) {
      return null;
    }

    return {
      id: -pendingPrivateTarget.counterpartId,
      type: "private",
      title: pendingPrivateTarget.title,
      content: "",
      createdAt: "",
      isRead: true,
      href: buildMessageHrefFromItem(
        {
          id: -pendingPrivateTarget.counterpartId,
          type: "private",
          counterpartId: pendingPrivateTarget.counterpartId,
        },
        "private",
      ),
      avatarUrl: pendingPrivateTarget.avatarUrl,
      counterpartId: pendingPrivateTarget.counterpartId,
      unreadCount: 0,
      messageKind: undefined,
      payload: null,
      recalledAt: undefined,
      isRecalled: false,
    };
  }, [pendingPrivateTarget]);

  const displayedMessages = useMemo(() => {
    if (
      !pendingPrivateItem ||
      existingPrivateConversation ||
      messages.some((item) => item.id === pendingPrivateItem.id)
    ) {
      return messages;
    }

    return [pendingPrivateItem, ...messages];
  }, [existingPrivateConversation, messages, pendingPrivateItem]);
  const hasCachedMessages = messages.length > 0;
  const isInitialLoading = isLoading && !hasCachedMessages;
  const isRefreshing = isLoading && hasCachedMessages;

  useEffect(() => {
    if (!isAuthenticated || !token) {
      resetNotifications();
      return;
    }

    if (userId != null) {
      initializeSocket(token);
    }

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
    userId,
  ]);

  // 检查通知权限状态
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
      setNotificationEnabled(getNotificationSetting());
    }
  }, []);

  useEffect(() => {
    if (selectedTab === initialTab || !isAuthenticated) {
      return;
    }

    setSelectedTab(initialTab);
    void fetchMessages(initialTab);
  }, [
    fetchMessages,
    initialTab,
    isAuthenticated,
    selectedTab,
    setSelectedTab,
  ]);

  useEffect(() => {
    if (routeType !== "private" || !routeId || !isAuthenticated) {
      setPendingPrivateTarget(null);
      return;
    }

    if (existingPrivateConversation) {
      setPendingPrivateTarget(null);
      return;
    }

    let cancelled = false;

    const loadTargetUser = async () => {
      try {
        const response = await userControllerFindOne({
          path: { id: String(routeId) },
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
  }, [existingPrivateConversation, isAuthenticated, routeId, routeType, tMsg]);

  useEffect(() => {
    if (!isMobile || typeof window === "undefined") {
      setMobileViewportHeight(null);
      return;
    }

    const viewport = window.visualViewport;
    const updateViewportHeight = () => {
      setMobileViewportHeight(
        Math.round(viewport?.height ?? window.innerHeight),
      );
    };

    updateViewportHeight();
    viewport?.addEventListener("resize", updateViewportHeight);
    viewport?.addEventListener("scroll", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);

    return () => {
      viewport?.removeEventListener("resize", updateViewportHeight);
      viewport?.removeEventListener("scroll", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
    };
  }, [isMobile]);

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

  const summarizedMessages = useMemo(() => {
    if (selectedTab !== "all") {
      return filteredMessages;
    }

    return filteredMessages.map((item) => ({
      ...item,
      content: resolveMessagePreviewText(
        {
          content: item.content,
          messageKind: item.messageKind,
          payload: item.payload,
          recalledAt: item.recalledAt,
          isRecalled: item.isRecalled,
        },
        copy,
      ),
    }));
  }, [copy, filteredMessages, selectedTab]);

  const selectedListItemId = useMemo(() => {
    if (!routeType || !routeId) {
      return null;
    }

    if (routeType === "private") {
      return (
        displayedMessages.find(
          (item) =>
            item.type === "private" &&
            Number(item.counterpartId || 0) === Number(routeId),
        )?.id ?? null
      );
    }

    return (
      displayedMessages.find(
        (item) => item.type === routeType && Number(item.id) === Number(routeId),
      )?.id ?? null
    );
  }, [displayedMessages, routeId, routeType]);

  const isMobileDetailOpen = isMobile && Boolean(routeType && routeId);
  const shouldFetchCurrentTab =
    isAuthenticated &&
    !isLoading &&
    (!hasLoadedMessages || !loadedCenterTabs[selectedTab]);
  const baseMessagePath = "/message";

  const handleTabChange = (tab: MessageTab) => {
    setSelectedTab(tab);
    void fetchMessages(tab);

    const nextParams = new URLSearchParams(searchParams.toString());
    if (tab === "all") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", tab);
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${baseMessagePath}?${nextQuery}` : baseMessagePath);
  };

  useEffect(() => {
    if (shouldFetchCurrentTab) {
      void fetchMessages(selectedTab);
    }
  }, [fetchMessages, selectedTab, shouldFetchCurrentTab]);

  const handleSelectItem = (_itemId: number, itemHref?: string) => {
    if (!itemHref) {
      return;
    }

    router.push(itemHref);
  };

  // 处理通知权限请求和开关
  const handleRequestNotificationPermission = async () => {
    // 如果已有权限，直接切换开关
    if (notificationPermission === "granted") {
      const newValue = !notificationEnabled;
      setNotificationSetting(newValue);
      setNotificationEnabled(newValue);
      return;
    }

    // 无权限时请求权限
    const granted = await requestNotificationPermission();

    // 同步更新权限状态
    const currentPermission = Notification.permission;
    setNotificationPermission(currentPermission);

    if (granted) {
      // 授权成功后自动开启
      setNotificationSetting(true);
      setNotificationEnabled(true);
      // 显示测试通知
      showNotification("通知已启用", {
        body: "您现在会收到新消息的桌面通知",
        icon: "/favicon.ico",
        onClick: () => window.focus(),
      });
    }
  };

  const mobilePageStyle =
    isMobile && mobileViewportHeight
      ? {
          height: `calc(${mobileViewportHeight}px - var(--header-height,60px))`,
        }
      : undefined;
  const mobileCardStyle =
    isMobile && mobileViewportHeight
      ? {
          height: `calc(${mobileViewportHeight}px - var(--header-height,60px) - 16px)`,
        }
      : undefined;

  return (
    <div
      className="page-container h-[calc(100dvh-var(--header-height,60px))] overflow-hidden pb-0! transition-[height] ease-out"
      style={mobilePageStyle}
    >
      <div
        className="left-container h-[calc(100dvh-var(--header-height,60px)-16px)] min-h-0 overflow-hidden rounded-2xl border border-border/70 bg-card transition-[height] ease-out"
        style={mobileCardStyle}
      >
        <div className="grid h-full min-h-0 md:grid-cols-[348px_minmax(0,1fr)]">
          <MessageConversationList
            copy={copy}
            filteredMessages={summarizedMessages}
            isLoading={isInitialLoading}
            isSwitchingTab={isRefreshing}
            isMobileDetailOpen={isMobileDetailOpen}
            locale={locale}
            onTabChange={handleTabChange}
            search={search}
            selectedItemId={selectedListItemId}
            selectedTab={selectedTab}
            setSearch={setSearch}
            onSelectItem={handleSelectItem}
            socketConnected={socketConnected}
            tabs={tabs}
            tCommon={tCommon}
            tMsg={tMsg}
            tTime={tTime}
            notificationPermission={notificationPermission}
            notificationEnabled={notificationEnabled}
            onRequestNotificationPermission={handleRequestNotificationPermission}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
