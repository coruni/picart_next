"use client";

import { useUserStore } from "@/stores";
import { useEffect } from "react";

/**
 * 请求通知权限
 * 返回布尔值表示是否已授予权限
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

/**
 * 显示系统通知 (Windows Toast Notification)
 * @param title 通知标题
 * @param options 通知选项
 */
export function showNotification(
  title: string,
  options?: NotificationOptions & {
    onClick?: () => void;
  },
): Notification | null {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  if (Notification.permission !== "granted") {
    return null;
  }

  // 如果页面在前台且处于焦点状态，不显示通知
  if (document.visibilityState === "visible" && document.hasFocus()) {
    return null;
  }

  const notification = new Notification(title, {
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    ...options,
  });

  if (options?.onClick) {
    notification.onclick = options.onClick;
  }

  notification.onshow = () => {
    // 自动关闭通知（5秒后）
    setTimeout(() => {
      notification.close();
    }, 5000);
  };

  return notification;
}

/**
 * Hook: 自动初始化通知权限（用户登录后）
 */
export function useNotificationPermission() {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      // 自动请求权限，但不强制
      void requestNotificationPermission();
    }
  }, [isAuthenticated]);
}

/**
 * Hook: 显示私信通知
 */
export function usePrivateMessageNotification() {
  return {
    showPrivateMessageNotification: (
      senderName: string,
      message: string,
      avatarUrl?: string,
      onClick?: () => void,
    ) => {
      return showNotification(senderName, {
        body: message,
        icon: avatarUrl || "/favicon.ico",
        tag: `private-message-${Date.now()}`,
        requireInteraction: false,
        onClick: () => {
          window.focus();
          onClick?.();
        },
      });
    },
  };
}
