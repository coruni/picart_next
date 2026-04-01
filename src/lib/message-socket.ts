"use client";

import type { UnreadCount } from "@/types";
import { io, type Socket } from "socket.io-client";

const SOCKET_REQUEST_TIMEOUT = 10000;

export interface MessageSocketListItem {
  id: number;
  senderId?: number | null;
  receiverId?: number | null;
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

  connect(token: string): Socket {
    if (this.socket && this.token === token) {
      if (!this.socket.connected) {
        this.socket.connect();
      }

      return this.socket;
    }

    this.disconnect();

    this.token = token;
    this.socket = io(resolveMessageSocketUrl(), {
      transports: ["websocket"],
      auth: { token },
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.token = null;
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
