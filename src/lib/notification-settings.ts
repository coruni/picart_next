"use client";

const NOTIFICATION_ENABLED_KEY = "picart_notification_enabled";

/**
 * 获取通知设置（是否启用桌面通知）
 * 默认返回 true（如果用户已授予权限）
 */
export function getNotificationSetting(): boolean {
  if (typeof window === "undefined") return false;

  const stored = localStorage.getItem(NOTIFICATION_ENABLED_KEY);
  if (stored === null) {
    // 默认未设置，如果权限已授予则返回 true
    return Notification.permission === "granted";
  }
  return stored === "true";
}

/**
 * 设置通知开关状态
 */
export function setNotificationSetting(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATION_ENABLED_KEY, String(enabled));
}

/**
 * 监听通知设置变化
 */
export function onNotificationSettingChange(
  callback: (enabled: boolean) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (e: StorageEvent) => {
    if (e.key === NOTIFICATION_ENABLED_KEY) {
      callback(getNotificationSetting());
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}
