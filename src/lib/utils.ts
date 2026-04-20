import { bannerControllerFindActive } from "@/api";
import { clsx, type ClassValue } from "clsx";
import { unstable_cache } from "next/cache";
import { twMerge } from "tailwind-merge";

export {
  formatDate,
  formatDateYMD,
  formatExpiryTime,
  formatRelativeTime,
  formatShortDate,
  toDate,
} from "./time";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

async function fetchPublicBanners() {
  const { data } = await bannerControllerFindActive();
  return data?.data;
}

export const getPublicBanners = unstable_cache(
  fetchPublicBanners,
  ["public-Banners"],
  {
    revalidate: 300,
  },
);

/**
 * 从 API 错误中提取可读的错误消息
 */
export function getErrorMessage(
  error: unknown,
  fallback = "操作失败",
): string {
  if (error && typeof error === "object") {
    // API 返回的错误格式: { code: number, message: string, data: null }
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}
