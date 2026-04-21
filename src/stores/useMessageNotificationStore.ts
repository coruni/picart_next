import {
  messageControllerGetPrivateConversations,
  messageControllerGetUnreadCount,
  messageControllerMarkAllAsRead,
  messageControllerSearch,
} from "@/api";
import type {
  MessageControllerGetPrivateConversationsResponse,
  MessageControllerSearchResponse,
} from "@/api/types.gen";
import { buildMessageCenterHref } from "@/lib/message-routes";
import {
  messageSocketClient,
  type MessageSocketConnectedPayload,
  type MessageSocketErrorPayload,
  type MessageSocketListItem,
  type MessageSocketPrivateConversationPayload,
  type MessageSocketPrivateConversationsResponse,
  type MessageSocketUnreadPayload,
} from "@/lib/message-socket";
import { showNotification } from "@/lib/notifications";
import type { UnreadCount } from "@/types";
import { create } from "zustand";
import { useUserStore } from "./useUserStore";

export type MessageTab = "all" | "notification" | "private" | "system";
type MessageTabCache = Record<MessageTab, MessageDropdownItem[]>;
type LoadedMessageTabMap = Record<MessageTab, boolean>;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
type SearchMessageList = NonNullable<
  NonNullable<MessageControllerSearchResponse["data"]>["data"]
>;
type SearchMessageItem = SearchMessageList[number];
type PrivateConversationList = NonNullable<
  NonNullable<MessageControllerGetPrivateConversationsResponse["data"]>["data"]
>;
type PrivateConversationItem = PrivateConversationList[number];

export interface MessageDropdownItem {
  id: number;
  type: Exclude<MessageTab, "all">;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  href: string;
  avatarUrl?: string;
  counterpartId?: number;
  unreadCount?: number;
  messageKind?: string;
  payload?: Record<string, unknown> | null;
  recalledAt?: string;
  isRecalled?: boolean;
}

let removeSocketListeners: (() => void) | null = null;
let socketToken: string | null = null;
let centerMessagesRequestVersion = 0;
let dropdownMessagesRequestVersion = 0;

interface MessageNotificationState {
  centerMessages: MessageDropdownItem[];
  centerMessagesByTab: MessageTabCache;
  dropdownMessages: MessageDropdownItem[];
  dropdownMessagesByTab: MessageTabCache;
  selectedTab: MessageTab;
  centerLoadedTab: MessageTab;
  dropdownLoadedTab: MessageTab;
  unreadCount: number;
  unreadSummary: UnreadCount | null;
  isLoading: boolean;
  isSwitchingTab: boolean;
  dropdownIsLoading: boolean;
  isUnreadLoading: boolean;
  hasLoadedMessages: boolean;
  hasLoadedDropdownMessages: boolean;
  loadedCenterTabs: LoadedMessageTabMap;
  loadedDropdownTabs: LoadedMessageTabMap;
  socketConnected: boolean;
  fetchMessages: (tab?: MessageTab) => Promise<void>;
  fetchDropdownMessages: (tab: MessageTab) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAllAsRead: (tab?: MessageTab) => Promise<void>;
  setSelectedTab: (tab: MessageTab) => void;
  initializeSocket: (token: string | null) => void;
  teardownSocket: () => void;
  reset: () => void;
}

function createEmptyDropdownCache(): MessageTabCache {
  return {
    all: [],
    notification: [],
    private: [],
    system: [],
  };
}

function createEmptyLoadedDropdownTabs(): LoadedMessageTabMap {
  return {
    all: false,
    notification: false,
    private: false,
    system: false,
  };
}

function updateDropdownCache(
  cache: MessageTabCache,
  tab: MessageTab,
  messages: MessageDropdownItem[],
): MessageTabCache {
  return {
    ...cache,
    [tab]: messages,
  };
}

function markMessagesAsRead(
  messages: MessageDropdownItem[],
  tab: MessageTab,
): MessageDropdownItem[] {
  return messages.map((message) => {
    if (tab !== "all" && message.type !== tab) {
      return message;
    }

    return {
      ...message,
      isRead: true,
      unreadCount: 0,
    };
  });
}

function markUnreadSummaryAsRead(
  summary: UnreadCount | null,
  tab: MessageTab,
): UnreadCount | null {
  if (!summary) {
    return summary;
  }

  if (tab === "all") {
    return {
      ...summary,
      total: 0,
      personal: 0,
      notification: 0,
      broadcast: 0,
    };
  }

  const nextSummary: UnreadCount = { ...summary };

  if (tab === "private") {
    nextSummary.personal = 0;
  }

  if (tab === "notification") {
    nextSummary.notification = 0;
  }

  if (tab === "system") {
    nextSummary.broadcast = 0;
  }

  nextSummary.total = Math.max(
    0,
    Number(nextSummary.personal || 0) +
      Number(nextSummary.notification || 0) +
      Number(nextSummary.broadcast || 0),
  );

  return nextSummary;
}

const IGNORABLE_ERROR_CODES = [
  "USER_NOT_FOUND",
  "CONVERSATION_NOT_FOUND",
];

function getSocketErrorMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload instanceof Error && payload.message.trim()) {
    return payload.message;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    // Check if this is an ignorable error code
    if ("code" in payload && typeof payload.code === "string") {
      if (IGNORABLE_ERROR_CODES.includes(payload.code)) {
        return null; // Don't log ignorable errors
      }
    }
    return payload.message;
  }

  return null;
}

function applyPrivateMessagePreview(
  messages: MessageDropdownItem[],
  message: MessageSocketListItem,
  currentUserId: number | null,
): MessageDropdownItem[] | null {
  if (currentUserId == null) {
    return null;
  }

  const senderId = Number(message.senderId || 0);
  const receiverId = Number(message.receiverId || 0);
  const counterpartId =
    senderId === currentUserId ? receiverId : receiverId === currentUserId ? senderId : 0;

  if (!counterpartId) {
    return null;
  }

  const existingConversation = messages.find(
    (item) => item.type === "private" && Number(item.counterpartId || 0) === counterpartId,
  );

  if (!existingConversation) {
    return null;
  }

  const isIncoming = receiverId === currentUserId;
  const nextConversation: MessageDropdownItem = {
    ...existingConversation,
    content: message.content || existingConversation.content,
    createdAt: message.createdAt || existingConversation.createdAt,
    isRead: !isIncoming,
    unreadCount: isIncoming
      ? Math.max(1, Number(existingConversation.unreadCount || 0) + 1)
      : 0,
    messageKind: message.messageKind || existingConversation.messageKind,
    payload:
      (message.payload as Record<string, unknown> | null | undefined) ??
      existingConversation.payload,
    recalledAt:
      ("recalledAt" in message ? (message.recalledAt as string | undefined) : undefined) ??
      existingConversation.recalledAt,
    isRecalled:
      ("isRecalled" in message
        ? (message.isRecalled as boolean | undefined)
        : undefined) ?? existingConversation.isRecalled,
  };

  return [
    nextConversation,
    ...messages.filter((item) => item.id !== existingConversation.id),
  ].slice(0, DEFAULT_LIMIT);
}

function normalizeSocketPrivateConversation(
  conversation: MessageSocketPrivateConversationPayload,
): MessageDropdownItem {
  const counterpartName =
    conversation.counterpart?.nickname ||
    conversation.counterpart?.username ||
    "Private Chat";
  const latestMessage = conversation.latestMessage;
  const itemId =
    conversation.conversationId ||
    latestMessage?.id ||
    conversation.counterpart?.id ||
    Date.now();

  return {
    id: itemId,
    type: "private",
    title: counterpartName,
    content: latestMessage?.content || "",
    createdAt: conversation.lastMessageAt || latestMessage?.createdAt || "",
    isRead: (conversation.unreadCount || 0) <= 0,
    href: buildMessageCenterHref(
      "private",
      conversation.counterpart?.id || itemId,
    ),
    avatarUrl: conversation.counterpart?.avatar,
    counterpartId: conversation.counterpart?.id,
    unreadCount: conversation.unreadCount || 0,
    messageKind: latestMessage?.messageKind,
    payload: (latestMessage?.payload as Record<string, unknown> | null) || null,
    recalledAt: latestMessage?.recalledAt || undefined,
    isRecalled: Boolean((latestMessage as { isRecalled?: boolean } | null | undefined)?.isRecalled),
  };
}

function cleanupSocketListeners() {
  removeSocketListeners?.();
  removeSocketListeners = null;
  socketToken = null;
}

function normalizeMessageItem(
  message: SearchMessageItem | MessageSocketListItem,
): MessageDropdownItem {
  const type =
    message.type === "private" ||
    message.type === "system" ||
    message.type === "notification"
      ? message.type
      : "notification";

  return {
    id: message.id,
    type,
    title: message.title || "",
    content: message.content || "",
    createdAt: message.createdAt || "",
    isRead: Boolean(message.isRead),
    href: buildMessageCenterHref(type, message.id),
    messageKind: "messageKind" in message ? message.messageKind : undefined,
    payload:
      "payload" in message
        ? ((message.payload as Record<string, unknown> | null | undefined) ?? null)
        : null,
    recalledAt:
      "recalledAt" in message ? (message.recalledAt as string | undefined) : undefined,
    isRecalled:
      "isRecalled" in message ? Boolean(message.isRecalled) : false,
  };
}

function normalizePrivateConversation(
  conversation: PrivateConversationItem,
): MessageDropdownItem {
  const counterpartName =
    conversation.counterpart?.nickname ||
    conversation.counterpart?.username ||
    "Private Chat";
  const latestMessage = conversation.latestMessage;
  const itemId =
    conversation.conversationId ||
    latestMessage?.id ||
    conversation.counterpart?.id ||
    Date.now();

  return {
    id: itemId,
    type: "private",
    title: counterpartName,
    content: latestMessage?.content || "",
    createdAt: conversation.lastMessageAt || latestMessage?.createdAt || "",
    isRead: (conversation.unreadCount || 0) <= 0,
    href: buildMessageCenterHref(
      "private",
      conversation.counterpart?.id || itemId,
    ),
    avatarUrl: conversation.counterpart?.avatar,
    counterpartId: conversation.counterpart?.id,
    unreadCount: conversation.unreadCount || 0,
    messageKind: latestMessage?.messageKind,
    payload: (latestMessage?.payload as Record<string, unknown> | null) || null,
    recalledAt: latestMessage?.recalledAt || undefined,
    isRecalled: Boolean(latestMessage?.isRecalled),
  };
}

async function fetchMessageList(
  tab: MessageTab,
): Promise<MessageDropdownItem[]> {
  if (tab === "private") {
    const socket = messageSocketClient.instance;
    const socketResponse = socket?.connected
      ? await messageSocketClient.request<MessageSocketPrivateConversationsResponse>(
          "getPrivateConversations",
          "privateConversations",
          { limit: DEFAULT_LIMIT },
        )
      : null;

    return socketResponse?.data
      ? socketResponse.data.map(normalizeSocketPrivateConversation)
      : (
          (
            await messageControllerGetPrivateConversations({
              query: {
                limit: DEFAULT_LIMIT,
              },
            })
          ).data?.data?.data || []
        ).map((item) =>
          normalizePrivateConversation(item as PrivateConversationItem),
        );
  }

  const { data } = await messageControllerSearch({
    query: {
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      ...(tab !== "all" ? { type: tab } : {}),
    },
  });

  return (data?.data?.data || []).map(normalizeMessageItem);
}

export const useMessageNotificationStore = create<MessageNotificationState>()(
  (set, get) => ({
    centerMessages: [],
    centerMessagesByTab: createEmptyDropdownCache(),
    dropdownMessages: [],
    dropdownMessagesByTab: createEmptyDropdownCache(),
    selectedTab: "all",
    centerLoadedTab: "all",
    dropdownLoadedTab: "all",
    unreadCount: 0,
    unreadSummary: null,
    isLoading: false,
    isSwitchingTab: false, // 新增：tab 切换中状态
    dropdownIsLoading: false,
    isUnreadLoading: false,
    hasLoadedMessages: false,
    hasLoadedDropdownMessages: false,
    loadedCenterTabs: createEmptyLoadedDropdownTabs(),
    loadedDropdownTabs: createEmptyLoadedDropdownTabs(),
    socketConnected: false,

    fetchMessages: async (tab = get().selectedTab) => {
      if (!useUserStore.getState().isAuthenticated || get().isLoading) {
        return;
      }

      const isTabSwitch = tab !== get().selectedTab;
      const requestVersion = ++centerMessagesRequestVersion;

      set({
        isLoading: true,
        isSwitchingTab: isTabSwitch, // 标记是否在切换 tab
        centerLoadedTab: tab,
        centerMessages: get().centerMessagesByTab[tab] || [],
      });

      try {
        const messages = await fetchMessageList(tab);

        if (requestVersion !== centerMessagesRequestVersion) {
          return;
        }

        set({
          centerMessagesByTab: updateDropdownCache(
            get().centerMessagesByTab,
            tab,
            messages,
          ),
          centerMessages: messages,
          hasLoadedMessages: true,
          loadedCenterTabs: {
            ...get().loadedCenterTabs,
            [tab]: true,
          },
        });
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        set({ isLoading: false, isSwitchingTab: false });
      }
    },

    fetchDropdownMessages: async (tab) => {
      if (
        !useUserStore.getState().isAuthenticated ||
        get().dropdownIsLoading
      ) {
        return;
      }

      const requestVersion = ++dropdownMessagesRequestVersion;

      set({
        dropdownIsLoading: true,
        dropdownLoadedTab: tab,
        dropdownMessages: get().dropdownMessagesByTab[tab] || [],
      });

      try {
        const messages = await fetchMessageList(tab);

        if (requestVersion !== dropdownMessagesRequestVersion) {
          return;
        }

        set({
          dropdownMessagesByTab: updateDropdownCache(
            get().dropdownMessagesByTab,
            tab,
            messages,
          ),
          dropdownMessages: messages,
          hasLoadedDropdownMessages: true,
          loadedDropdownTabs: {
            ...get().loadedDropdownTabs,
            [tab]: true,
          },
        });
      } catch (error) {
        console.error("Failed to fetch dropdown messages:", error);
      } finally {
        set({ dropdownIsLoading: false });
      }
    },

    fetchUnreadCount: async () => {
      if (!useUserStore.getState().isAuthenticated || get().isUnreadLoading) {
        return;
      }

      set({ isUnreadLoading: true });

      try {
        const socket = messageSocketClient.instance;
        const unreadSummary = socket?.connected
          ? await messageSocketClient.request<UnreadCount>(
              "getUnreadCount",
              "unreadCount",
            )
          : (await messageControllerGetUnreadCount()).data?.data ?? null;

        set({
          unreadSummary,
          unreadCount: unreadSummary?.total ?? 0,
        });
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      } finally {
        set({ isUnreadLoading: false });
      }
    },

    markAllAsRead: async (tab = get().selectedTab) => {
      if (!useUserStore.getState().isAuthenticated) {
        return;
      }

      try {
        centerMessagesRequestVersion++;
        dropdownMessagesRequestVersion++;

        await messageControllerMarkAllAsRead({
          body: tab === "all" ? {} : { type: tab },
        });

        set((state) => {
          const nextUnreadSummary = markUnreadSummaryAsRead(state.unreadSummary, tab);

          return {
            centerMessages: markMessagesAsRead(state.centerMessages, tab),
            centerMessagesByTab: Object.fromEntries(
              (Object.entries(state.centerMessagesByTab) as Array<
                [MessageTab, MessageDropdownItem[]]
              >).map(([cacheTab, messages]) => [
                cacheTab,
                markMessagesAsRead(messages, tab),
              ]),
            ) as MessageTabCache,
            dropdownMessages: markMessagesAsRead(state.dropdownMessages, tab),
            dropdownMessagesByTab: Object.fromEntries(
              (Object.entries(state.dropdownMessagesByTab) as Array<
                [MessageTab, MessageDropdownItem[]]
              >).map(([cacheTab, messages]) => [
                cacheTab,
                markMessagesAsRead(messages, tab),
              ]),
            ) as MessageTabCache,
            unreadSummary: nextUnreadSummary,
            unreadCount: nextUnreadSummary?.total ?? 0,
          };
        });

        void get().fetchUnreadCount();

        const socket = messageSocketClient.instance;
        if (socket?.connected) {
          socket.emit("getUnreadCount");
        }
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }
    },

    setSelectedTab: (tab) => {
      set({ selectedTab: tab });
    },

    initializeSocket: (token) => {
      if (typeof window === "undefined") {
        return;
      }

      const currentUser = useUserStore.getState().user;

      if (!token || !useUserStore.getState().isAuthenticated || !currentUser?.id) {
        get().teardownSocket();
        return;
      }

      if (socketToken === token && removeSocketListeners) {
        const socket = messageSocketClient.instance;
        if (!socket?.connected) {
          socket?.connect();
        }
        return;
      }

      cleanupSocketListeners();

      const socket = messageSocketClient.connect(token);

      const handleConnect = () => {
        set({ socketConnected: true });
        // 连接成功后刷新未读数
        void get().fetchUnreadCount();
      };

      const handleDisconnect = () => {
        set({ socketConnected: false });
      };

      const handleConnected = (_payload: MessageSocketConnectedPayload) => {
        set({ socketConnected: true });
        socket.emit("getUnreadCount");
        // 连接成功后刷新消息列表
        void get().fetchMessages();
      };

      const handleError = (payload: MessageSocketErrorPayload | unknown) => {
        const message = getSocketErrorMessage(payload);

        if (message) {
          console.error("Message websocket error:", message, payload);
          return;
        }

        if (
          payload &&
          typeof payload === "object" &&
          Object.keys(payload).length > 0
        ) {
          console.warn("Message websocket emitted non-standard error payload:", payload);
        }
      };

      const handleUnreadCount = (payload: MessageSocketUnreadPayload) => {
        set((state) => ({
          unreadSummary: state.unreadSummary
            ? { ...state.unreadSummary, ...payload }
            : (payload as UnreadCount),
          unreadCount: payload.total ?? state.unreadCount,
        }));
      };

      const handlePrivateConversationUpdated = (
        payload: MessageSocketPrivateConversationPayload,
      ) => {
        const normalized = normalizeSocketPrivateConversation(payload);

        set((state) => {
          const nextState: Partial<MessageNotificationState> = {};
          let changed = false;

          if (state.selectedTab === "private" && state.hasLoadedMessages) {
            const nextPrivateMessages = [
              normalized,
              ...state.centerMessagesByTab.private.filter(
                (item) => item.id !== normalized.id,
              ),
            ].slice(0, DEFAULT_LIMIT);
            nextState.centerMessagesByTab = updateDropdownCache(
              state.centerMessagesByTab,
              "private",
              nextPrivateMessages,
            );
            nextState.centerMessages = nextPrivateMessages;
            changed = true;
          }

          if (
            state.dropdownLoadedTab === "private" &&
            state.hasLoadedDropdownMessages
          ) {
            const nextPrivateMessages = [
              normalized,
              ...state.dropdownMessagesByTab.private.filter(
                (item) => item.id !== normalized.id,
              ),
            ].slice(0, DEFAULT_LIMIT);
            nextState.dropdownMessagesByTab = updateDropdownCache(
              state.dropdownMessagesByTab,
              "private",
              nextPrivateMessages,
            );
            nextState.dropdownMessages = nextPrivateMessages;
            changed = true;
          }

          return changed ? nextState : state;
        });
      };

      const handleNewMessage = (message: MessageSocketListItem) => {
        const type =
          message.type === "private" ||
          message.type === "system" ||
          message.type === "notification"
            ? message.type
            : null;
        const {
          hasLoadedMessages,
          hasLoadedDropdownMessages,
          centerMessagesByTab,
          dropdownMessagesByTab,
          selectedTab,
          centerLoadedTab,
          dropdownLoadedTab,
        } = get();
        const currentUserId = useUserStore.getState().user?.id
          ? Number(useUserStore.getState().user?.id)
          : null;

        if (
          hasLoadedMessages &&
          type &&
          selectedTab !== "private" &&
          (selectedTab === "all" || type === selectedTab)
        ) {
          const normalized = normalizeMessageItem(message);
          const nextCenterMessages = [
            normalized,
            ...centerMessagesByTab[selectedTab].filter(
              (item) => item.id !== normalized.id,
            ),
          ].slice(0, DEFAULT_LIMIT);
          set({
            centerMessagesByTab: updateDropdownCache(
              centerMessagesByTab,
              selectedTab,
              nextCenterMessages,
            ),
            ...(centerLoadedTab === selectedTab
              ? { centerMessages: nextCenterMessages }
              : {}),
          });
        }

        if (hasLoadedMessages && selectedTab === "private" && type === "private") {
          const nextMessages = applyPrivateMessagePreview(
            centerMessagesByTab.private,
            message,
            currentUserId,
          );

          if (nextMessages) {
            set({
              centerMessagesByTab: updateDropdownCache(
                centerMessagesByTab,
                "private",
                nextMessages,
              ),
              ...(centerLoadedTab === "private"
                ? { centerMessages: nextMessages }
                : {}),
            });
          } else {
            void get().fetchMessages("private");
          }
        }

        if (
          hasLoadedDropdownMessages &&
          type &&
          dropdownLoadedTab !== "private" &&
          (dropdownLoadedTab === "all" || type === dropdownLoadedTab)
        ) {
          const normalized = normalizeMessageItem(message);
          const nextDropdownMessages = [
            normalized,
            ...dropdownMessagesByTab[dropdownLoadedTab].filter(
              (item) => item.id !== normalized.id,
            ),
          ].slice(0, DEFAULT_LIMIT);
          set({
            dropdownMessagesByTab: updateDropdownCache(
              dropdownMessagesByTab,
              dropdownLoadedTab,
              nextDropdownMessages,
            ),
            dropdownMessages: nextDropdownMessages,
          });
        }

        if (
          hasLoadedDropdownMessages &&
          dropdownLoadedTab === "private" &&
          type === "private"
        ) {
          const nextDropdownMessages = applyPrivateMessagePreview(
            dropdownMessagesByTab.private,
            message,
            currentUserId,
          );

          if (nextDropdownMessages) {
            set({
              dropdownMessagesByTab: updateDropdownCache(
                dropdownMessagesByTab,
                "private",
                nextDropdownMessages,
              ),
              dropdownMessages: nextDropdownMessages,
            });
          } else {
            void get().fetchDropdownMessages("private");
          }
        }

        // 显示系统通知 (Windows Toast Notification)
        if (type === "private" && message.senderId !== currentUserId) {
          const content = message.isRecalled
            ? "[已撤回]"
            : message.content || "[图片]";
          const senderName = message.sender?.nickname || message.sender?.username || message.title || "新消息";
          showNotification(senderName, {
            body: content,
            icon: message.sender?.avatar || "/favicon.ico",
            tag: `private-message-${message.id}`,
            requireInteraction: false,
            onClick: () => {
              window.focus();
              const href = buildMessageCenterHref("private", message.counterpartId!);
              window.location.href = href;
            },
          });
        }

        socket.emit("getUnreadCount");
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connected", handleConnected);
      socket.on("error", handleError);
      socket.on("newMessage", handleNewMessage);
      socket.on("privateConversationUpdated", handlePrivateConversationUpdated);
      socket.on("unreadCount", handleUnreadCount);

      removeSocketListeners = () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("connected", handleConnected);
        socket.off("error", handleError);
        socket.off("newMessage", handleNewMessage);
        socket.off("privateConversationUpdated", handlePrivateConversationUpdated);
        socket.off("unreadCount", handleUnreadCount);
      };

      socketToken = token;
    },

    teardownSocket: () => {
      cleanupSocketListeners();
      messageSocketClient.disconnect();
      set({ socketConnected: false });
    },

    reset: () => {
      get().teardownSocket();
      centerMessagesRequestVersion++;
      dropdownMessagesRequestVersion++;
      set({
        centerMessages: [],
        centerMessagesByTab: createEmptyDropdownCache(),
        dropdownMessages: [],
        dropdownMessagesByTab: createEmptyDropdownCache(),
        selectedTab: "all",
        centerLoadedTab: "all",
        dropdownLoadedTab: "all",
        unreadCount: 0,
        unreadSummary: null,
        isLoading: false,
        dropdownIsLoading: false,
        isUnreadLoading: false,
        hasLoadedMessages: false,
        hasLoadedDropdownMessages: false,
        loadedCenterTabs: createEmptyLoadedDropdownTabs(),
        loadedDropdownTabs: createEmptyLoadedDropdownTabs(),
      });
    },
  }),
);
