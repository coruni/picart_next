import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useTranslations } from "next-intl";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(
  isoString: string,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  
  const now = new Date();
  const date = new Date(isoString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return t("time.justNow");
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return t("time.minutesAgo", { count: diffInMinutes });
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return t("time.hoursAgo", { count: diffInHours });
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return t("time.daysAgo", { count: diffInDays });
  }

  // 超过7天显示月份/日期
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}