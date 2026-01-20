"use client";

import { useNotificationStore } from "@/stores";
import { useEffect, useState } from "react";

export function NotificationContainer() {
  const [isHydrated, setIsHydrated] = useState(false);
  const notificationStore = useNotificationStore();
  
  const notifications = isHydrated ? notificationStore.notifications : [];
  const removeNotification = notificationStore.removeNotification;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (notifications.length === 0) return null;

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      case "warning":
        return "bg-yellow-500 text-white";
      case "info":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] ${getTypeStyles(
            notification.type
          )}`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-4 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
