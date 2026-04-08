import { formatDateYMD, formatMonthDayLabel, formatTimeHM } from "@/lib";

export function getMessageDayKey(value?: string) {
  if (!value) {
    return "unknown";
  }

  return formatDateYMD(value) || value;
}

export function getMessageDayLabel(value: string | undefined, locale: string) {
  return formatMonthDayLabel(value, locale);
}

export function formatMessageClock(value?: string) {
  return formatTimeHM(value);
}

function resolvePreviewImageUrls(payload?: Record<string, unknown> | null) {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload.urls)) {
    return payload.urls.filter(
      (url): url is string => typeof url === "string" && Boolean(url.trim()),
    );
  }

  if (typeof payload.url === "string" && payload.url.trim()) {
    return [payload.url];
  }

  if (typeof payload.imageUrl === "string" && payload.imageUrl.trim()) {
    return [payload.imageUrl];
  }

  return [];
}

export function resolveMessagePreviewText(
  item: {
    content?: string;
    messageKind?: string;
    payload?: Record<string, unknown> | null;
    recalledAt?: string;
    isRecalled?: boolean;
  },
  copy: {
    emptyThread: string;
    imageOnlyPreview: string;
    recalledPreview: string;
  },
) {
  if (item.isRecalled || item.recalledAt) {
    return copy.recalledPreview;
  }

  const content = item.content?.trim();
  if (content) {
    return content;
  }

  const hasImage =
    item.messageKind === "image" || resolvePreviewImageUrls(item.payload).length > 0;

  if (hasImage) {
    return copy.imageOnlyPreview;
  }

  return copy.emptyThread;
}
