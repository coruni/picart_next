"use client";

import {
  commentControllerCreate,
  emojiControllerFindAll,
  emojiControllerIncrementUseCount,
  uploadControllerUploadFile,
} from "@/api";
import { useImageCompression } from "@/hooks/useImageCompression";
import { cn, sanitizeRichTextHtml } from "@/lib";
import { openLoginDialog } from "@/lib/modal-helpers";
import { useUserStore } from "@/stores";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  Send,
  Smile,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Button } from "../ui/Button";

import "swiper/css";

// 动态导入 Quill 以减少初始包大小
let QuillModule: typeof import("quill")["default"] | null = null;
let CustomEmojiBlot: unknown = null;

async function loadQuill() {
  if (!QuillModule) {
    const [{ default: Quill }, { CustomEmojiBlot: emojiBlot }] = await Promise.all([
      import("quill"),
      import("@/components/editor"),
    ]);
    QuillModule = Quill;
    CustomEmojiBlot = emojiBlot;
  }
  return { Quill: QuillModule, CustomEmojiBlot };
}

type CommentEditorProps = {
  articleId: string | number;
  parentId?: number | string;
  className?: string;
  onSubmitted?: () => void | Promise<void>;
  minHeight?: string | number;
};

type EmojiRecord = {
  id: string;
  name: string;
  url: string;
};

type EmojiGroup = {
  name: string;
  items: EmojiRecord[];
};

type UploadedAttachment = {
  id: string;
  previewUrl: string;
  progress: number;
  status: "uploading" | "uploaded";
  url?: string;
};

declare global {
  interface Window {
    __PICART_COMMENT_QUILL_REGISTERED__?: boolean;
  }
}

async function registerCommentQuillModules() {
  if (
    typeof window !== "undefined" &&
    window.__PICART_COMMENT_QUILL_REGISTERED__
  ) {
    return;
  }

  const { Quill, CustomEmojiBlot } = await loadQuill();

  if (Quill && CustomEmojiBlot) {
    (Quill as unknown as { register: (path: string, target: unknown, overwrite?: boolean) => void }).register("formats/emoji", CustomEmojiBlot, true);
  }

  if (typeof window !== "undefined") {
    window.__PICART_COMMENT_QUILL_REGISTERED__ = true;
  }
}

function normalizeEmojiGroups(response: unknown): EmojiGroup[] {
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

function hasQuillContent(quill: { getText: () => string; root: Element } | null) {
  if (!quill) {
    return false;
  }

  const text = quill.getText().replace(/[\s\u00A0\u200B-\u200D\uFEFF]/g, "");
  if (text.length > 0) {
    return true;
  }

  return !!quill.root.querySelector(".ql-emoji-embed");
}

function AttachmentPreviewCard({
  attachment,
  onRemove,
  removeLabel,
}: {
  attachment: UploadedAttachment;
  onRemove: (id: string) => void;
  removeLabel: string;
}) {
  const isUploading = attachment.status === "uploading";

  return (
    <div className="relative h-46 w-82 overflow-hidden rounded-[14px] bg-[#d9d9d9]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={attachment.url || attachment.previewUrl}
        alt=""
        className={cn(
          "h-full w-full object-cover transition duration-300",
          isUploading ? "opacity-70 grayscale-[0.2]" : "opacity-100",
        )}
      />
      <div
        className={cn(
          "absolute right-3 top-3 flex items-center overflow-hidden rounded-full bg-black/70 text-xs font-semibold text-white transition-[padding,gap] duration-300",
          isUploading ? "gap-2 px-3 py-1" : "gap-0 p-1",
        )}
      >
        <div
          className={cn(
            "flex items-center overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300",
            isUploading
              ? "mr-1 max-w-20 opacity-100"
              : "mr-0 max-w-0 opacity-0",
          )}
        >
          <LoaderCircle className="mr-2 size-3.5 shrink-0 animate-spin" />
          <span>{attachment.progress}%</span>
        </div>
        <button
          type="button"
          className="flex size-4 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:text-white"
          onClick={() => onRemove(attachment.id)}
          aria-label={removeLabel}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function CommentEditor({
  articleId,
  parentId,
  className,
  onSubmitted,
  minHeight,
}: CommentEditorProps) {
  const t = useTranslations("commentEditor");
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPanelRef = useRef<HTMLDivElement>(null);
  const emojiTabsViewportRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<unknown>(null);
  const uploadTimersRef = useRef<Record<string, number>>({});
  const attachmentsRef = useRef<UploadedAttachment[]>([]);
  const removedAttachmentIdsRef = useRef(new Set<string>());
  const { compressImages, validateFiles } = useImageCompression();
  const [emojiGroups, setEmojiGroups] = useState<EmojiGroup[]>([]);
  const [activeEmojiGroup, setActiveEmojiGroup] = useState<string>("all");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [editorHasContent, setEditorHasContent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  const articleIdValue = useMemo(() => Number(articleId), [articleId]);
  const parentIdValue = useMemo(() => {
    if (parentId === undefined || parentId === null || parentId === "") {
      return undefined;
    }
    return Number(parentId);
  }, [parentId]);

  const emojiList = useMemo(() => {
    if (activeEmojiGroup === "all") {
      return emojiGroups.flatMap((group) => group.items);
    }

    return (
      emojiGroups.find((group) => group.name === activeEmojiGroup)?.items || []
    );
  }, [activeEmojiGroup, emojiGroups]);

  const hasUploadingAttachment = attachments.some(
    (attachment) => attachment.status === "uploading",
  );
  const canSubmit =
    !isSubmitting &&
    !hasUploadingAttachment &&
    (editorHasContent || attachments.some((attachment) => attachment.url));

  useEffect(() => {
    const initQuill = async () => {
      await registerCommentQuillModules();

      if (!containerRef.current || quillRef.current) {
        return;
      }

      const { Quill } = await loadQuill();
      if (!Quill) return;

      const quill = new Quill(containerRef.current, {
        theme: "snow",
        modules: {
          toolbar: false,
          history: {
            delay: 800,
            maxStack: 50,
            userOnly: true,
          },
        },
        formats: ["emoji"],
        placeholder: t("placeholder"),
      });

      quillRef.current = quill;
      const syncEditorState = () => {
        setEditorHasContent(hasQuillContent(quill));
      };
      quill.on("text-change", syncEditorState);
      syncEditorState();
    };

    void initQuill();

    return () => {
      const quill = quillRef.current as { off: (event: string, handler: () => void) => void } | null;
      if (quill) {
        quill.off("text-change", () => {});
        quillRef.current = null;
      }
    };
  }, [t]);

  useEffect(() => {
    const loadEmojis = async () => {
      try {
        const response = await emojiControllerFindAll({
          query: {
            page: 1,
            limit: 100,
            grouped: true,
          },
        });
        const groups = normalizeEmojiGroups(response);
        setEmojiGroups(groups);
      } catch (error) {
        console.error("Failed to load emoji list:", error);
      }
    };

    void loadEmojis();
  }, []);

  useEffect(() => {
    if (!emojiOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!emojiPanelRef.current?.contains(event.target as Node)) {
        setEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [emojiOpen]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    const timers = uploadTimersRef.current;

    return () => {
      const currentAttachments = attachmentsRef.current;

      Object.values(timers).forEach((timer) => {
        window.clearInterval(timer);
      });

      currentAttachments.forEach((attachment) => {
        URL.revokeObjectURL(attachment.previewUrl);
      });
    };
  }, []);

  const updateAttachment = (
    id: string,
    updater: (attachment: UploadedAttachment) => UploadedAttachment,
  ) => {
    setAttachments((current) =>
      current.map((attachment) =>
        attachment.id === id ? updater(attachment) : attachment,
      ),
    );
  };

  const clearUploadTimer = (id: string) => {
    const timer = uploadTimersRef.current[id];
    if (timer) {
      window.clearInterval(timer);
      delete uploadTimersRef.current[id];
    }
  };

  const removeAttachment = (id: string) => {
    removedAttachmentIdsRef.current.add(id);
    clearUploadTimer(id);

    setAttachments((current) => {
      const target = current.find((attachment) => attachment.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((attachment) => attachment.id !== id);
    });
  };

  const handleEmojiSelect = async (emoji: EmojiRecord) => {
    const quill = quillRef.current as {
      getSelection: (focus: boolean) => { index: number } | null;
      getLength: () => number;
      insertEmbed: (index: number, type: string, value: unknown, source: string) => void;
      insertText: (index: number, text: string, source: string) => void;
      setSelection: (index: number, length: number, source: string) => void;
    } | null;
    if (!quill) {
      return;
    }

    const selection = quill.getSelection(true);
    const index = selection?.index ?? quill.getLength();

    quill.insertEmbed(
      index,
      "emoji",
      { src: emoji.url, alt: emoji.name, name: emoji.name },
      "user",
    );
    quill.insertText(index + 1, " ", "user");
    quill.setSelection(index + 2, 0, "silent");
    setEditorHasContent(true);

    try {
      await emojiControllerIncrementUseCount({ path: { id: emoji.id } });
    } catch (error) {
      console.error("Failed to update emoji usage:", error);
    }
  };

  const scrollEmojiTabs = (direction: "prev" | "next") => {
    emojiTabsViewportRef.current?.scrollBy({
      left: direction === "next" ? 180 : -180,
      behavior: "smooth",
    });
  };

  const startUploadProgress = (id: string) => {
    clearUploadTimer(id);

    uploadTimersRef.current[id] = window.setInterval(() => {
      updateAttachment(id, (attachment) => {
        if (attachment.status !== "uploading" || attachment.progress >= 95) {
          return attachment;
        }

        return {
          ...attachment,
          progress: Math.min(
            95,
            attachment.progress + Math.ceil(Math.random() * 12),
          ),
        };
      });
    }, 200);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    // 压缩图片
    const compressionResults = await compressImages(files);

    // 验证压缩后的文件大小
    const compressedFiles = compressionResults.map((r) => r.file);
    const validation = validateFiles(compressedFiles, true);
    if (!validation.valid) {
      console.error(validation.error);
      return;
    }

    // Create attachment entries for all files first
    const fileIds: string[] = [];
    const fileMap = new Map<string, File>();

    for (const result of compressionResults) {
      const file = result.file;
      const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      const previewUrl = URL.createObjectURL(file);

      fileIds.push(id);
      fileMap.set(id, file);
      removedAttachmentIdsRef.current.delete(id);

      setAttachments((current) => [
        ...current,
        {
          id,
          previewUrl,
          progress: 0,
          status: "uploading",
        },
      ]);
      startUploadProgress(id);
    }

    // Upload all compressed files in one request
    try {
      const response = await uploadControllerUploadFile({
        body: { file: compressedFiles as any },
      });

      const uploadedUrls = response.data?.data || [];

      // Update each attachment with its uploaded URL
      fileIds.forEach((id, index) => {
        if (removedAttachmentIdsRef.current.has(id)) {
          const file = fileMap.get(id);
          if (file) {
            URL.revokeObjectURL(URL.createObjectURL(file));
          }
          return;
        }

        const uploadedUrl = uploadedUrls[index]?.url;
        if (uploadedUrl) {
          clearUploadTimer(id);
          updateAttachment(id, (attachment) => ({
            ...attachment,
            status: "uploaded",
            progress: 100,
            url: uploadedUrl,
          }));
        } else {
          clearUploadTimer(id);
          removeAttachment(id);
        }
      });
    } catch (error) {
      // Clear all upload timers and remove attachments on error
      fileIds.forEach((id) => {
        clearUploadTimer(id);
        removeAttachment(id);
      });
      console.error("Failed to upload comment images:", error);
    }
  };

  const handleSubmit = async () => {
    const quill = quillRef.current as {
      root: { innerHTML: string };
      setContents: (content: unknown[], source: string) => void;
    } | null;
    if (!quill) {
      return;
    }

    if (!isAuthenticated) {
      openLoginDialog();
      return;
    }

    if (Number.isNaN(articleIdValue)) {
      console.error("Failed to create comment: invalid article id", articleId);
      return;
    }

    const uploadedAttachments = attachments.filter(
      (attachment) => attachment.status === "uploaded" && attachment.url,
    );

    if (!hasQuillContent(quill as unknown as { getText: () => string; root: Element }) && uploadedAttachments.length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const editorHtml = sanitizeRichTextHtml(quill.root.innerHTML || "");
      const images = uploadedAttachments
        .map((attachment) => attachment.url)
        .filter((url): url is string => Boolean(url));

      await commentControllerCreate({
        body: {
          content: editorHtml,
          articleId: articleIdValue,
          parentId: parentIdValue,
          images,
        },
      });

      quill.setContents([{ insert: "\n" }], "silent");
      setEditorHasContent(false);
      attachments.forEach((attachment) => {
        URL.revokeObjectURL(attachment.previewUrl);
      });
      setAttachments([]);
      setEmojiOpen(false);
      await onSubmitted?.();
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("px-6 pt-5", className)}>
      <div className="rounded-[20px] bg-card">
        <div
          className={cn(
            "comment-editor-shell rounded-xl border border-primary/90 bg-card transition-shadow focus-within:shadow-[0_0_0_3px_rgba(102,128,255,0.08)]",
            "[&_.ql-container]:border-0 [&_.ql-container]:rounded-2xl",
            "[&_.ql-container.ql-snow]:border-none!",
            "[&_.ql-editor]:px-5 [&_.ql-editor]:py-4 [&_.ql-editor]:text-sm [&_.ql-editor]:leading-6",
            "[&_.ql-editor.ql-blank::before]:left-5 [&_.ql-editor.ql-blank::before]:right-5 [&_.ql-editor.ql-blank::before]:font-sans [&_.ql-editor.ql-blank::before]:text-sm [&_.ql-editor.ql-blank::before]:font-normal [&_.ql-editor.ql-blank::before]:leading-6 [&_.ql-editor.ql-blank::before]:text-muted-foreground [&_.ql-editor.ql-blank::before]:not-italic! dark:[&_.ql-editor.ql-blank::before]:text-white/45!",
            !minHeight && "[&_.ql-editor]:min-h-24",
            minHeight && "[&_.ql-editor]:min-h-(--editor-min-height)",
          )}
          style={
            minHeight
              ? ({
                  "--editor-min-height":
                    typeof minHeight === "number"
                      ? `${minHeight}px`
                      : minHeight,
                } as React.CSSProperties)
              : undefined
          }
        >
          <div ref={containerRef} />
        </div>

        {attachments.length > 0 && (
          <div className="mt-4">
            <Swiper
              modules={[FreeMode]}
              freeMode={{
                enabled: true,
                sticky: true,
                momentumBounce: false,
              }}
              slidesPerView="auto"
              spaceBetween={12}
              className="comment-editor-upload-swiper"
            >
              {attachments.map((attachment) => (
                <SwiperSlide key={attachment.id} className="w-auto!">
                  <AttachmentPreviewCard
                    attachment={attachment}
                    onRemove={removeAttachment}
                    removeLabel={t("removeImage")}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        <div className="mt-2 flex items-end justify-between gap-4">
          <div className="flex items-center gap-2 text-[#a8b6cd]">
            <div className="relative" ref={emojiPanelRef}>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full transition hover:bg-muted hover:text-primary"
                aria-label={t("emoji")}
                onClick={() => setEmojiOpen((open) => !open)}
              >
                <Smile className="size-5" />
              </button>

              {emojiOpen && (
                <div
                  className="absolute top-full  z-30 mb-3 overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
                  style={{
                    width: "min(20rem, calc(100vw - 20rem))",
                    minWidth: "16rem",
                  }}
                >
                  <div className="flex h-10 items-center gap-2 rounded-t-xl border-b border-border bg-border px-2.5">
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:bg-card"
                      onClick={() => scrollEmojiTabs("prev")}
                      aria-label={t("scrollPrev")}
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <div
                      ref={emojiTabsViewportRef}
                      className="flex h-10 flex-1 items-center gap-1.5 overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden"
                    >
                      <button
                        type="button"
                        className={cn(
                          "flex h-7 shrink-0 items-center justify-center rounded-md cursor-pointer px-2 text-xs transition-colors hover:bg-card",
                          activeEmojiGroup === "all" && "bg-card text-primary",
                        )}
                        onClick={() => setActiveEmojiGroup("all")}
                        title={t("all")}
                      >
                        <span className="text-xs font-medium">{t("all")}</span>
                      </button>
                      {emojiGroups.map((group) => (
                        <button
                          key={group.name}
                          type="button"
                          className={cn(
                            "flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-xl px-2 transition-colors hover:bg-card",
                            activeEmojiGroup === group.name &&
                              "bg-card text-primary",
                          )}
                          onClick={() => setActiveEmojiGroup(group.name)}
                          title={group.name}
                        >
                          {group.items[0]?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={group.items[0].url}
                              alt={group.name}
                              className="h-4.5 w-4.5 object-contain cursor-pointer"
                            />
                          ) : (
                            <span className="text-xs font-medium">
                              {group.name.slice(0, 1)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:bg-card"
                      onClick={() => scrollEmojiTabs("next")}
                      aria-label={t("scrollNext")}
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                  <div className="grid h-52 grid-cols-7 content-start gap-1 overflow-y-auto px-2 py-2">
                    {emojiList.length > 0 ? (
                      emojiList.map((emoji) => (
                        <button
                          key={emoji.id}
                          type="button"
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-transparent p-1 transition-all hover:border-border hover:bg-accent"
                          onClick={() => void handleEmojiSelect(emoji)}
                          title={emoji.name}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={emoji.url}
                            alt={emoji.name}
                            className="max-h-7 max-w-7 object-contain"
                          />
                        </button>
                      ))
                    ) : (
                      <div className="col-span-7 py-8 text-center text-sm text-muted-foreground">
                        {t("emptyEmoji")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full transition hover:bg-muted hover:text-primary"
              aria-label={t("image")}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            loading={isSubmitting}
            className={cn(
              "h-8 min-w-24 rounded-full px-4 font-semibold shadow-none",
              canSubmit
                ? "hover:opacity-90"
                : "cursor-not-allowed bg-[#e9eef7] text-[#b7c1d3]",
            )}
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            <span className="inline-flex items-center gap-2">
              <Send className="size-4" />
              {t("send")}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
