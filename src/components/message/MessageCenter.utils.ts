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

type MessageImagePayload =
  | {
      urls?: unknown;
      url?: unknown;
      imageUrl?: unknown;
    }
  | null
  | undefined;

/**
 * 私信 payload 的图片地址：urls 优先，其次 imageUrl，最后 url。
 * 气泡渲染、列表预览、乐观发送去重都必须走这一份，否则同一消息在不同位置会解析出不同图片。
 */
export function resolveMessageImageUrls(payload?: MessageImagePayload): string[] {
  const urls = payload?.urls;

  if (Array.isArray(urls)) {
    const validUrls = urls.filter(
      (url): url is string => typeof url === "string" && Boolean(url.trim()),
    );

    if (validUrls.length > 0) {
      return validUrls;
    }
  }

  if (typeof payload?.imageUrl === "string" && payload.imageUrl.trim()) {
    return [payload.imageUrl];
  }

  if (typeof payload?.url === "string" && payload.url.trim()) {
    return [payload.url];
  }

  return [];
}

export function resolveMessageImageUrl(
  payload?: MessageImagePayload,
): string | null {
  return resolveMessageImageUrls(payload)[0] ?? null;
}

function resolvePreviewImageUrls(payload?: Record<string, unknown> | null) {
  return resolveMessageImageUrls(payload);
}

// Composer-serialised messages embed emoji as
//   <span class="ql-emoji-embed" title="<name>">...<img class="ql-emoji-embed__img" .../></span>
// which `prepareRichTextHtmlForSummary` would strip down to nothing
// (images are removed in summary form). Replace each emoji span with
// its name in brackets so a preview line still reads naturally.
const RE_EMOJI_SPAN_WITH_TITLE =
  /<span\s+class="ql-emoji-embed"[^>]*\btitle="([^"]*)"[^>]*>[\s\S]*?<\/span>/gi;
const RE_EMOJI_SPAN_FALLBACK =
  /<span\s+class="ql-emoji-embed"[^>]*>[\s\S]*?<\/span>/gi;

function replaceEmojiSpansWithNames(html: string): string {
  return html
    .replace(RE_EMOJI_SPAN_WITH_TITLE, (_, title: string) =>
      title ? `[${title}]` : "[emoji]",
    )
    .replace(RE_EMOJI_SPAN_FALLBACK, "[emoji]");
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
    return replaceEmojiSpansWithNames(content);
  }

  const hasImage =
    item.messageKind === "image" || resolvePreviewImageUrls(item.payload).length > 0;

  if (hasImage) {
    return copy.imageOnlyPreview;
  }

  return copy.emptyThread;
}
