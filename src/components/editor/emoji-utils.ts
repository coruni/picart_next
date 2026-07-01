// Shared Quill + emoji helpers used by both the comment editor and the
// private message composer so they stay in sync.

export type EmojiRecord = {
  id: string;
  name: string;
  url: string;
};

export type EmojiGroup = {
  name: string;
  items: EmojiRecord[];
};

// 动态导入 Quill 以减少初始包大小
let QuillModule: (typeof import("quill"))["default"] | null = null;
let CustomEmojiBlot: unknown = null;

export async function loadQuill() {
  if (!QuillModule) {
    const [{ default: Quill }, { CustomEmojiBlot: emojiBlot }] =
      await Promise.all([import("quill"), import("@/components/editor")]);
    QuillModule = Quill;
    CustomEmojiBlot = emojiBlot;
  }
  return { Quill: QuillModule, CustomEmojiBlot };
}

declare global {
  interface Window {
    __PICART_COMMENT_QUILL_REGISTERED__?: boolean;
  }
}

export async function registerEmojiQuill() {
  if (
    typeof window !== "undefined" &&
    window.__PICART_COMMENT_QUILL_REGISTERED__
  ) {
    return;
  }

  const { Quill, CustomEmojiBlot } = await loadQuill();

  if (Quill && CustomEmojiBlot) {
    (
      Quill as unknown as {
        register: (path: string, target: unknown, overwrite?: boolean) => void;
      }
    ).register("formats/emoji", CustomEmojiBlot, true);
  }

  if (typeof window !== "undefined") {
    window.__PICART_COMMENT_QUILL_REGISTERED__ = true;
  }
}

export function normalizeEmojiGroups(response: unknown): EmojiGroup[] {
  const payload = (response as { data?: { data?: unknown } })?.data?.data as
    | { groups?: unknown[] }
    | undefined;
  const groups = Array.isArray(payload?.groups) ? payload.groups : [];

  return groups.reduce<EmojiGroup[]>((acc, group) => {
    const raw = group as {
      name?: string;
      items?: unknown[];
    };

    if (!raw.name || !Array.isArray(raw.items)) {
      return acc;
    }

    const items = raw.items.reduce<EmojiRecord[]>((emojiAcc, item) => {
      const record = item as {
        id?: string | number;
        _id?: string | number;
        name?: string;
        url?: string;
        imageUrl?: string;
        code?: string;
      };
      const url = record.url || record.imageUrl;

      if (!url) {
        return emojiAcc;
      }

      emojiAcc.push({
        id: String(record.id ?? record._id ?? url),
        name: record.name || record.code || "emoji",
        url,
      });
      return emojiAcc;
    }, []);

    if (items.length > 0) {
      acc.push({
        name: raw.name,
        items,
      });
    }

    return acc;
  }, []);
}

export function hasQuillContent(
  quill: { getText: () => string; root: Element } | null,
) {
  if (!quill) {
    return false;
  }

  const text = quill.getText().replace(/[\s\u00A0\u200B-\u200D\uFEFF]/g, "");
  if (text.length > 0) {
    return true;
  }

  return !!quill.root.querySelector(".ql-emoji-embed");
}
