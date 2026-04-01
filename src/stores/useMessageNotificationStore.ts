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
import {
  messageSocketClient,
  type MessageSocketConnectedPayload,
  type MessageSocketErrorPayload,
  type MessageSocketPrivateConversationPayload,
  type MessageSocketPrivateConversationsResponse,
  type MessageSocketListItem,
  type MessageSocketUnreadPayload,
} from "@/lib/message-socket";
import type { UnreadCount } from "@/types";
import { create } from "zustand";
import { useUserStore } from "./useUserStore";

export type MessageTab = "all" | "notification" | "private" | "system";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MESSAGE_CENTER_PATH = "/message";

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

interface MessageNotificationState {
  centerMessages: MessageDropdownItem[];
  dropdownMessages: MessageDropdownItem[];
  selectedTab: MessageTab;
  dropdownLoadedTab: MessageTab;
  unreadCount: number;
  unreadSummary: UnreadCount | null;
  isLoading: boolean;
  dropdownIsLoading: boolean;
  isUnreadLoading: boolean;
  hasLoadedMessages: boolean;
  hasLoadedDropdownMessages: boolean;
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
    href: getMessageCenterHref("private", itemId),
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

function getMessageCenterHref(type: Exclude<MessageTab, "all">, id: number) {
  return `${MESSAGE_CENTER_PATH}?tab=${type}&item=${id}`;
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
    href: getMessageCenterHref(type, message.id),
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
    href: getMessageCenterHref("private", itemId),
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
    dropdownMessages: [],
    selectedTab: "all",
    dropdownLoadedTab: "all",
    unreadCount: 0,
    unreadSummary: null,
    isLoading: false,
    dropdownIsLoading: false,
    isUnreadLoading: false,
    hasLoadedMessages: false,
    hasLoadedDropdownMessages: false,
    socketConnected: false,

    fetchMessages: async (tab = get().selectedTab) => {
      if (!useUserStore.getState().isAuthenticated || get().isLoading) {
        return;
      }

      set({
        isLoading: true,
      });

      try {
        const messages = await fetchMessageList(tab);
        set({
          centerMessages: messages,
          hasLoadedMessages: true,
        });
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchDropdownMessages: async (tab) => {
      if (
        !useUserStore.getState().isAuthenticated ||
        get().dropdownIsLoading
      ) {
        return;
      }

      set({
        dropdownIsLoading: true,
        dropdownLoadedTab: tab,
      });

      try {
        const messages = await fetchMessageList(tab);
        set({
          dropdownMessages: messages,
          hasLoadedDropdownMessages: true,
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
        const socket = messageSocketClient.instance;

        if (socket?.connected) {
          socket.emit("markAllAsRead", tab === "all" ? {} : { type: tab });
        } else {
          await messageControllerMarkAllAsRead({
            body: tab === "all" ? {} : { type: tab },
          });
        }

        set((state) => ({
          centerMessages: markMessagesAsRead(state.centerMessages, tab),
          dropdownMessages: markMessagesAsRead(state.dropdownMessages, tab),
        }));

        void get().fetchUnreadCount();

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

      if (!token || !useUserStore.getState().isAuthenticated) {
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
      };

      const handleDisconnect = () => {
        set({ socketConnected: false });
      };

      const handleConnected = (_payload: MessageSocketConnectedPayload) => {
        set({ socketConnected: true });
        socket.emit("getUnreadCount");
      };

      const handleError = (payload: MessageSocketErrorPayload) => {
        console.error("Message websocket error:", payload);
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
            nextState.centerMessages = [
              normalized,
              ...state.centerMessages.filter((item) => item.id !== normalized.id),
            ].slice(0, DEFAULT_LIMIT);
            changed = true;
          }

          if (
            state.dropdownLoadedTab === "private" &&
            state.hasLoadedDropdownMessages
          ) {
            nextState.dropdownMessages = [
              normalized,
              ...state.dropdownMessages.filter((item) => item.id !== normalized.id),
            ].slice(0, DEFAULT_LIMIT);
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
          centerMessages,
          dropdownMessages,
          selectedTab,
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
          set({
            centerMessages: [
              normalized,
              ...centerMessages.filter((item) => item.id !== normalized.id),
            ].slice(0, DEFAULT_LIMIT),
          });
        }

        if (hasLoadedMessages && selectedTab === "private" && type === "private") {
          const nextMessages = applyPrivateMessagePreview(
            centerMessages,
            message,
            currentUserId,
          );

          if (nextMessages) {
            set({ centerMessages: nextMessages });
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
          set({
            dropdownMessages: [
              normalized,
              ...dropdownMessages.filter((item) => item.id !== normalized.id),
            ].slice(0, DEFAULT_LIMIT),
          });
        }

        if (
          hasLoadedDropdownMessages &&
          dropdownLoadedTab === "private" &&
          type === "private"
        ) {
          const nextDropdownMessages = applyPrivateMessagePreview(
            dropdownMessages,
            message,
            currentUserId,
          );

          if (nextDropdownMessages) {
            set({ dropdownMessages: nextDropdownMessages });
          } else {
            void get().fetchDropdownMessages("private");
          }
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
      set({
        centerMessages: [],
        dropdownMessages: [],
        selectedTab: "all",
        dropdownLoadedTab: "all",
        unreadCount: 0,
        unreadSummary: null,
        isLoading: false,
        dropdownIsLoading: false,
        isUnreadLoading: false,
        hasLoadedMessages: false,
        hasLoadedDropdownMessages: false,
      });
    },
  }),
);
