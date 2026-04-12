"use client";

import type { UnreadCount } from "@/types";
import { io, type Socket } from "socket.io-client";

const SOCKET_REQUEST_TIMEOUT = 10000;
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export interface MessageSocketListItem {
  id: number;
  senderId?: number | null;
  receiverId?: number | null;
  sender?: {
    id?: number;
    username?: string;
    nickname?: string;
    avatar?: string;
  } | null;
  receiver?: {
    id?: number;
    username?: string;
    nickname?: string;
    avatar?: string;
  } | null;
  counterpartId?: number;
  content: string;
  messageKind?: string;
  payload?: Record<string, unknown> | null;
  type?: string;
  isRead: boolean;
  isBroadcast?: boolean;
  title?: string;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  recalledAt?: string;
  isRecalled?: boolean;
  targetId?: number;
  targetType?: string;
  notificationType?: string;
}

export interface MessageSocketConnectedPayload {
  message: string;
  user: {
    id: number;
    username: string;
    nickname?: string;
    avatar?: string;
  };
}

export interface MessageSocketErrorPayload {
  message: string;
  code?: string;
}

export type MessageSocketUnreadPayload = Partial<UnreadCount>;

export interface MessageSocketPrivateConversationPayload {
  conversationId?: number;
  counterpart?: {
    id?: number;
    username?: string;
    nickname?: string;
    avatar?: string;
  } | null;
  latestMessage?: MessageSocketListItem | null;
  unreadCount?: number;
  lastMessageAt?: string | null;
}

export interface MessageSocketPrivateConversationsResponse {
  data: MessageSocketPrivateConversationPayload[];
  meta?: {
    limit?: number;
    hasMore?: boolean;
    nextCursor?: string | null;
  };
}

export interface MessageSocketPrivateHistoryResponse {
  data: MessageSocketListItem[];
  meta?: {
    limit?: number;
    hasMore?: boolean;
    nextCursor?: string | null;
  };
}

function resolveMessageSocketUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const rawBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || window.location.origin;

  try {
    const url = new URL(rawBaseUrl, window.location.origin);
    const apiIndex = url.pathname.toLowerCase().indexOf("/api");

    url.pathname = apiIndex >= 0 ? url.pathname.slice(0, apiIndex) || "/" : "/";
    url.search = "";
    url.hash = "";

    return `${url.toString().replace(/\/$/, "")}/ws-message`;
  } catch {
    return `${window.location.origin}/ws-message`;
  }
}

class MessageSocketClient {
  private socket: Socket | null = null;

  private token: string | null = null;

  private reconnectAttempts = 0;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private isManualDisconnect = false;

  private visibilityHandler: (() => void) | null = null;

  private onlineHandler: (() => void) | null = null;

  private offlineHandler: (() => void) | null = null;

  connect(token: string): Socket {
    if (this.socket && this.token === token) {
      if (!this.socket.connected) {
        this.socket.connect();
      }

      return this.socket;
    }

    this.disconnect();

    this.token = token;
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;

    this.socket = io(resolveMessageSocketUrl(), {
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionDelayMax: 10000,
    });

    this.setupEventHandlers();
    this.setupVisibilityHandler();
    this.setupNetworkHandlers();

    return this.socket;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on("disconnect", (reason) => {
      // 如果是手动断开，不重连
      if (this.isManualDisconnect) {
        return;
      }

      // 如果是服务器断开或传输错误，自动重连机制会处理
      // 如果是客户端断开（如网络变化），需要特殊处理
      if (reason === "io client disconnect" || reason === "io server disconnect") {
        this.scheduleReconnect();
      }
    });

    this.socket.on("connect", () => {
      this.reconnectAttempts = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    this.socket.on("connect_error", () => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn("MessageSocket: Max reconnection attempts reached");
      }
    });
  }

  private setupVisibilityHandler() {
    if (typeof document === "undefined") return;

    // 清理旧的事件监听
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }

    this.visibilityHandler = () => {
      if (document.visibilityState === "visible") {
        // 页面回到前台，检查连接状态
        if (this.socket && !this.socket.connected && this.token && !this.isManualDisconnect) {
          console.log("MessageSocket: Page visible, reconnecting...");
          this.socket.connect();
        }
      }
    };

    document.addEventListener("visibilitychange", this.visibilityHandler);
  }

  private setupNetworkHandlers() {
    if (typeof window === "undefined") return;

    // 清理旧的事件监听
    if (this.onlineHandler) {
      window.removeEventListener("online", this.onlineHandler);
    }
    if (this.offlineHandler) {
      window.removeEventListener("offline", this.offlineHandler);
    }

    this.onlineHandler = () => {
      console.log("MessageSocket: Network online");
      if (this.socket && !this.socket.connected && this.token && !this.isManualDisconnect) {
        this.socket.connect();
      }
    };

    this.offlineHandler = () => {
      console.log("MessageSocket: Network offline");
    };

    window.addEventListener("online", this.onlineHandler);
    window.addEventListener("offline", this.offlineHandler);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isManualDisconnect) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.socket && !this.socket.connected && this.token) {
        this.socket.connect();
      }
    }, RECONNECT_DELAY);
  }

  disconnect() {
    this.isManualDisconnect = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.onlineHandler) {
      window.removeEventListener("online", this.onlineHandler);
      this.onlineHandler = null;
    }

    if (this.offlineHandler) {
      window.removeEventListener("offline", this.offlineHandler);
      this.offlineHandler = null;
    }

    this.socket?.disconnect();
    this.socket = null;
    this.token = null;
    this.reconnectAttempts = 0;
  }

  request<TResponse>(
    eventName: string,
    responseEvent: string,
    payload?: Record<string, unknown>,
    timeoutMs = SOCKET_REQUEST_TIMEOUT,
  ): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      const socket = this.socket;

      if (!socket) {
        reject(new Error("Message websocket is not connected"));
        return;
      }

      let settled = false;
      const timer = window.setTimeout(() => {
        if (settled) {
          return;
        }

        settled = true;
        socket.off(responseEvent, handleResponse);
        reject(new Error(`Message websocket request timed out: ${eventName}`));
      }, timeoutMs);

      const handleResponse = (response: TResponse) => {
        if (settled) {
          return;
        }

        settled = true;
        window.clearTimeout(timer);
        socket.off(responseEvent, handleResponse);
        resolve(response);
      };

      socket.on(responseEvent, handleResponse);
      socket.emit(eventName, payload);
    });
  }

  get instance() {
    return this.socket;
  }
}

export const messageSocketClient = new MessageSocketClient();
