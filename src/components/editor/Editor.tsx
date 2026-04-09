"use client";

import QuillBlotFormatter2, {
  BlotSpec,
} from "@enzedonline/quill-blot-formatter2";
import "@enzedonline/quill-blot-formatter2/dist/css/quill-blot-formatter2.css";
import { useTranslations } from "next-intl";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { SizeClass, SizeStyle } from "quill/formats/size";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import "./inline-article.css";

import { articleControllerFindByAuthor, articleControllerFindOne } from "@/api";
import { useImageCompression } from "@/hooks/useImageCompression";
import { useEditorFocus } from "@/hooks/useEditorFocus";
import { useInfiniteScrollObserver } from "@/hooks/useInfiniteScrollObserver";
import { prepareRichTextHtmlForEditor, sanitizeRichTextHtml } from "@/lib";
import { buildUploadMetadata } from "@/lib/file-hash";
import { useUserStore } from "@/stores";
import { ArticleList } from "@/types";
import { getImageUrl, ImageInfo } from "@/types/image";
import { GripVertical, X } from "lucide-react";
import { ImageWithFallback } from "../shared/ImageWithFallback";
import { InfiniteScrollStatus } from "../shared/InfiniteScrollStatus";
import { DialogFooter } from "../ui/Dialog";
import { CustomEmojiBlot } from "./blots/CustomEmojiBlot";
import { CustomImageBlot } from "./blots/CustomImageBlot";
import { CustomVideoBlot, parseVideoUrl } from "./blots/CustomVideoBlot";
import { DividerBlot } from "./blots/DividerBlot";
import { InlineArticleListBlot } from "./blots/InlineArticleListBlot";
import type { EditorProps } from "./index";
import {
  customIcons,
  defaultFormats,
  quillOverrideStyles,
  renderToolbar,
} from "./index";
import {
  CustomImageSpec,
  CustomLinkSpec,
  InlineArticleSpec,
  VideoSpec,
} from "./specs";
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  uploadControllerUploadFile,
} from "./types";

const CODE_BLOCK_HINT_REGEX =
  /(^\s{2,}|\t)|[{}[\];]|=>|<\/?[a-z][\s\S]*?>|^\s*(const|let|var|function|class|import|export|if|else|for|while|switch|try|catch|return|def|public|private|async|await)\b/m;

const normalizeClipboardText = (value: string) =>
  value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const shouldPasteAsCodeBlock = (plainText: string, htmlText: string) => {
  const normalized = normalizeClipboardText(plainText).trimEnd();
  if (!normalized.includes("\n")) return false;

  if (/<(pre|code)\b/i.test(htmlText)) return true;

  const nonEmptyLines = normalized
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (nonEmptyLines.length < 2) return false;

  return (
    nonEmptyLines.some((line) => /^\s{2,}|\t/.test(line)) ||
    CODE_BLOCK_HINT_REGEX.test(normalized)
  );
};

declare global {
  interface Window {
    __PICART_QUILL_REGISTERED__?: boolean;
  }
}

const registerQuillModules = () => {
  if (typeof window !== "undefined" && window.__PICART_QUILL_REGISTERED__) {
    return;
  }

  SizeClass.whitelist = [
    "12px",
    "14px",
    "16px",
    "18px",
    "20px",
    "24px",
    "32px",
  ];
  SizeStyle.whitelist = [
    "12px",
    "14px",
    "16px",
    "18px",
    "20px",
    "24px",
    "32px",
  ];
  Quill.register(SizeStyle, true);
  Quill.register(SizeClass, true);
  Quill.register("modules/blotFormatter2", QuillBlotFormatter2);
  Quill.register({ "formats/image": CustomImageBlot }, true);
  Quill.register({ "formats/video": CustomVideoBlot }, true);
  Quill.register({ "formats/emoji": CustomEmojiBlot }, true);
  Quill.register({ "formats/divider": DividerBlot }, true);
  Quill.register({ "formats/inlineArticleList": InlineArticleListBlot }, true);

  if (typeof window !== "undefined") {
    window.__PICART_QUILL_REGISTERED__ = true;
  }
};

registerQuillModules();

/**
 * 富文本编辑器组件
 * 基于 Quill.js
 */
export const Editor = forwardRef<Quill | null, EditorProps>(
  (
    {
      value,
      onChange,
      placeholder: placeholderProp,
      className,
      readOnly = false,
    },
    ref,
  ) => {
    const t = useTranslations("editor");
    const placeholder = placeholderProp ?? t("placeholder");
    const containerRef = useRef<HTMLDivElement>(null);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [videoUrl, setVideoUrl] = useState("");
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [articleSearchQuery, setArticleSearchQuery] = useState("");

    interface ArticleItem {
      id: number;
      title: string;
      cover?: string;
      images?: string | ImageInfo[];
      author: ArticleList[number]["author"];
      views: number;
    }
    const [articles, setArticles] = useState<ArticleItem[]>([]);
    const [selectedArticles, setSelectedArticles] = useState<ArticleItem[]>([]);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [articleLoading, setArticleLoading] = useState(false);
    const { user, token } = useUserStore();
    const { compressImages, validateFiles } = useImageCompression();
    const quillRef = useRef<Quill | null>(null);
    const uploadAbortControllerRef = useRef<AbortController | null>(null);
    const lastSyncedValueRef = useRef("");
    const onChangeRef = useRef(onChange);
    const isApplyingExternalValueRef = useRef(false);
    // 跟踪初始值，用于区分初始加载和后续更新
    const initialValueRef = useRef(value);

    // 使用焦点管理 hook
    const {
      savedSelection,
      restoreFocus,
    } = useEditorFocus(quillRef);

    // 记录文章总数
    const [articleTotal, setArticleTotal] = useState<number>(0);
    const [articlePage, setArticlePage] = useState(1);
    const [articleHasMore, setArticleHasMore] = useState(true);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // 保持 onChange 引用最新
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    const emitSanitizedContent = (root: HTMLElement) => {
      const html = sanitizeRichTextHtml(root.innerHTML || "");
      lastSyncedValueRef.current = html;
      onChangeRef.current?.(html);
    };

    const ensureImageCaptions = (root: HTMLElement) => {
      const wrappers = root.querySelectorAll(".ql-image-wrapper");

      wrappers.forEach((wrapper) => {
        const imageWrapper = wrapper as HTMLElement;
        const img = imageWrapper.querySelector("img.ql-image, img");
        if (!img) return;

        let caption = imageWrapper.querySelector(
          ".ql-image-caption",
        ) as HTMLParagraphElement | null;

        if (!caption) {
          caption = document.createElement("p");
          caption.className = "ql-image-caption";
          caption.setAttribute("contenteditable", "true");
          caption.setAttribute(
            "data-placeholder",
            t("imageCaptionPlaceholder"),
          );
          imageWrapper.appendChild(caption);
        }

        if (!caption.textContent?.trim()) {
          caption.textContent = img.getAttribute("alt") || "";
        }
      });
    };

    // 初始化 Quill
    useEffect(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;

      // 创建 editor 容器
      const editorContainer = container.querySelector(".editor-container");
      if (!editorContainer) {
        const div = document.createElement("div");
        div.className = "editor-container";
        container.appendChild(div);

        const quill = new Quill(div, {
          theme: "snow",
          modules: {
            toolbar: false,
            history: {
              delay: 1000,
              maxStack: 100,
              userOnly: true,
            },
            blotFormatter2: {
              specs: [
                CustomImageSpec as unknown as typeof BlotSpec,
                CustomLinkSpec as unknown as typeof BlotSpec,
                InlineArticleSpec as unknown as typeof BlotSpec,
                VideoSpec as unknown as typeof BlotSpec,
              ],
              toolbar: {
                icons: customIcons,
                mainStyle: {
                  position: "absolute",
                  top: "0px",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  background: "rgba(0, 0, 0, 0.85)",
                  borderRadius: "8px",
                  whiteSpace: "nowrap",
                  width: "max-content",
                  minWidth: "max-content",
                },
                buttonStyle: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  padding: "4px",
                  fontWeight: "bold",
                  background: "transparent",
                  border: "none",
                  borderRadius: "99px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                },
                buttonSelectedStyle: {
                  background: "var(--primary)",
                },
              },
              align: {
                allowAligning: true,
              },
              resize: {
                allowResizing: false,
              },
              delete: {
                allowKeyboardDelete: true,
              },
              image: {
                allowAltTitleEdit: false,
                linkOptions: {
                  allowLinkEdit: false,
                },
              },
            },
          },
          formats: defaultFormats,
          placeholder,
          readOnly,
        });

        quillRef.current = quill;

        // 渲染自定义 toolbar
        renderToolbar({
          quill,
          container,
          t: (key: string) => t(`toolbar.${key}`),
          onVideoClick: () => setShowVideoModal(true),
          onSaveSelection: () => {
            // 保存当前光标位置
            const range = quill.getSelection(true);
            if (range) {
              savedSelection.current = { index: range.index, length: range.length };
            }
          },
          onLinkClick: () => {
            const selection = quill.getSelection();
            savedSelection.current = selection;
            if (selection && selection.length > 0) {
              const text = quill.getText(selection.index, selection.length);
              setLinkText(text);
              const format = quill.getFormat(selection);
              if (format.link) {
                setLinkUrl(format.link as string);
              } else {
                setLinkUrl("");
              }
            } else {
              setLinkText("");
              setLinkUrl("");
            }
            setShowLinkModal(true);
          },
          onArticleClick: () => {
            setShowArticleModal(true);
          },
          onImageUpload: async () => {
            // 图片上传处理（带预压缩）
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.multiple = true;
            input.click();
            input.onchange = async () => {
              const files = input.files;
              if (!files || files.length === 0) return;

              const selection = quill.getSelection();
              const startIndex = selection?.index || 0;

              // 保存原始文件引用（用于计算 hash）
              const originalFiles = Array.from(files);

              // 压缩图片
              const compressionResults = await compressImages(originalFiles);

              // 验证压缩后的文件大小
              const validation = validateFiles(
                compressionResults.map((r) => r.file),
                true,
              );
              if (!validation.valid) {
                console.error(validation.error);
                return;
              }

              // 计算原始文件的 hash 并构建 metadata
              const metadata = await buildUploadMetadata(originalFiles);

              // Store upload info for each file
              const uploadItems: {
                file: File;
                index: number;
                base64: string;
                wrapper: HTMLDivElement | null;
                img: HTMLImageElement | null;
                overlay: HTMLDivElement | null;
                progressText: HTMLSpanElement | null;
              }[] = [];

              // Create all placeholders first
              for (let i = 0; i < compressionResults.length; i++) {
                const result = compressionResults[i];
                const file = result.file;
                const currentIndex = startIndex + i;

                // 转换为 base64 占位
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => resolve(e.target?.result as string);
                  reader.readAsDataURL(file);
                });

                // 插入带有上传状态的图片
                quill.insertEmbed(currentIndex, "image", base64);
                quill.setSelection(currentIndex + 1, 0);

                // 等待 DOM 更新
                await new Promise((resolve) => setTimeout(resolve, 50));

                // 找到刚插入的图片
                const wrappers = Array.from(
                  quill.root.querySelectorAll("div.ql-image-wrapper"),
                ) as HTMLDivElement[];
                let targetWrapper: HTMLDivElement | null = null;
                let targetImg: HTMLImageElement | null = null;

                for (const wrapper of wrappers) {
                  const img = wrapper.querySelector(
                    "img.ql-image",
                  ) as HTMLImageElement | null;
                  if (img && img.src === base64 && !img.dataset.uploaded) {
                    targetWrapper = wrapper as HTMLDivElement;
                    targetImg = img;
                    break;
                  }
                }

                if (targetWrapper && targetImg) {
                  // 设置 wrapper 为相对定位
                  targetWrapper.style.position = "relative";
                  targetWrapper.style.display = "inline-block";

                  // 创建遮罩
                  const overlay = document.createElement("div");
                  overlay.className = "image-upload-overlay";
                  overlay.innerHTML = `
                    <div class="image-upload-pill">
                      <div class="progress">
                        <div class="spinner"></div>
                        <span class="progress-text">0%</span>
                      </div>
                      <button type="button" class="cancel-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  `;

                  // 将遮罩添加到 wrapper 中
                  targetWrapper.appendChild(overlay);

                  const progressText = overlay.querySelector(
                    ".progress-text",
                  ) as HTMLSpanElement;

                  // Store references
                  uploadItems.push({
                    file,
                    index: currentIndex,
                    base64,
                    wrapper: targetWrapper,
                    img: targetImg,
                    overlay,
                    progressText,
                  });

                  // 取消按钮
                  const cancelBtn = overlay.querySelector(
                    ".cancel-btn",
                  ) as HTMLButtonElement;
                  cancelBtn.onclick = () => {
                    // Mark this item as cancelled
                    const item = uploadItems.find(
                      (u) => u.index === currentIndex,
                    );
                    if (item) {
                      item.wrapper = null;
                      item.img = null;
                    }
                    overlay.remove();
                    quill.deleteText(currentIndex, 1);
                  };
                }
              }

              // Batch upload all compressed files
              const abortController = new AbortController();
              uploadAbortControllerRef.current = abortController;

              try {
                const compressedFiles = compressionResults.map((r) => r.file);
                const response = await uploadControllerUploadFile({
                  body: { file: compressedFiles as any, metadata },
                });

                const uploadedUrls = response.data?.data || [];

                // Update each uploaded image
                uploadItems.forEach((item, idx) => {
                  // Skip if cancelled (wrapper is null)
                  if (!item.wrapper || !item.img) return;

                  const uploadedUrl = uploadedUrls[idx]?.url;
                  if (uploadedUrl) {
                    item.img.src = uploadedUrl;
                    item.img.dataset.uploaded = "true";
                    if (item.progressText) {
                      item.progressText.textContent = "100%";
                    }
                  }
                  // Remove overlay
                  item.overlay?.remove();
                });
              } catch (error) {
                if ((error as Error).name === "AbortError") {
                  return;
                }
                console.error("Upload failed:", error);
                // Remove all overlays and delete placeholders on error
                uploadItems.forEach((item) => {
                  item.overlay?.remove();
                  if (item.wrapper) {
                    quill.deleteText(item.index, 1);
                  }
                });
              }
            };
          },
        });

        // 暴露 quill 实例
        if (ref) {
          if (typeof ref === "function") {
            ref(quill);
          } else {
            ref.current = quill;
          }
        }

        // 设置初始值由第二个 effect 处理

        // 监听内容变化
        const handleTextChange = () => {
          if (isApplyingExternalValueRef.current) return;
          ensureImageCaptions(quill.root);
          emitSanitizedContent(quill.root);
        };
        quill.on("text-change", handleTextChange);

        // 键盘快捷键：Ctrl+C 复制图片
        const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "c") {
            // 检查是否有选中的图片 blot
            const selection = quill.getSelection();
            if (selection && selection.length > 0) {
              const delta = quill.getContents(
                selection.index,
                selection.length,
              );
              // 检查是否包含图片
              const hasImage = delta.ops.some(
                (op: any) =>
                  op.insert &&
                  typeof op.insert === "object" &&
                  "image" in op.insert,
              );
              if (hasImage) {
                // 存储到全局变量
                (window as any).__quillClipboardImage = delta;
              }
            }
          }

          // Ctrl+V 粘贴图片
          if ((e.ctrlKey || e.metaKey) && e.key === "v") {
            const clipImage = (window as any).__quillClipboardImage;
            if (clipImage) {
              e.preventDefault();
              const selection = quill.getSelection();
              const index = selection ? selection.index : quill.getLength();
              quill.updateContents(
                new (Quill.import("delta"))().retain(index).concat(clipImage),
                "user",
              );
              quill.setSelection(index + clipImage.length(), 0);
            }
          }
        };

        quill.root.addEventListener("keydown", handleKeyDown);

        const handlePaste = (e: ClipboardEvent) => {
          const clipboardData = e.clipboardData;
          if (!clipboardData) return;

          const plainText = clipboardData.getData("text/plain");
          const htmlText = clipboardData.getData("text/html");
          if (!plainText || !shouldPasteAsCodeBlock(plainText, htmlText))
            return;

          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const normalizedText = normalizeClipboardText(plainText);
          const selection = quill.getSelection(true);
          const index = selection?.index ?? quill.getLength();

          if (selection?.length) {
            quill.deleteText(index, selection.length, "user");
          }

          const codeHtml = `<pre>${escapeHtml(normalizedText)}</pre>`;
          quill.clipboard.dangerouslyPasteHTML(index, codeHtml, "user");
        };

        quill.root.addEventListener("paste", handlePaste, true);

        // 监听图片 caption 输入，同步到 alt 属性
        const handleCaptionInput = (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains("ql-image-caption")) {
            const wrapper = target.closest(".ql-image-wrapper");
            if (wrapper) {
              const img = wrapper.querySelector("img.ql-image");
              if (img) {
                const text = target.textContent || "";
                if (text.trim()) {
                  img.setAttribute("alt", text);
                } else {
                  img.removeAttribute("alt");
                }
                emitSanitizedContent(quill.root);
              }
            }
          }
        };

        quill.root.addEventListener("input", handleCaptionInput);

        // 阻止 caption 上的键盘事件冒泡到 Quill
        const handleCaptionKeyDown = (e: KeyboardEvent) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains("ql-image-caption")) {
            // 允许基本的编辑操作
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              // 移动光标到图片后面
              const wrapper = target.closest(".ql-image-wrapper");
              if (wrapper) {
                const blot = quill.scroll.find(wrapper);
                if (blot) {
                  const index = quill.getIndex(blot);
                  quill.setSelection(index + 1, 0);
                }
              }
            }
            // 阻止删除键删除图片本身
            if (e.key === "Backspace" && target.textContent === "") {
              e.preventDefault();
            }
          }
        };

        quill.root.addEventListener("keydown", handleCaptionKeyDown, true);

        return () => {
          uploadAbortControllerRef.current?.abort();
          quill.off("text-change", handleTextChange);
          quill.root.removeEventListener("keydown", handleKeyDown);
          quill.root.removeEventListener("paste", handlePaste, true);
          quill.root.removeEventListener("input", handleCaptionInput);
          quill.root.removeEventListener("keydown", handleCaptionKeyDown, true);
        };
      }
    }, [ref, placeholder, readOnly]);

    // 独立的 link-edit 事件监听器
    useEffect(() => {
      const handleLinkEdit = (e: Event) => {
        const customEvent = e as CustomEvent<{ href: string; text: string }>;
        const { href, text } = customEvent.detail;
        setLinkUrl(href);
        setLinkText(text);
        setShowLinkModal(true);
      };
      document.addEventListener("link-edit", handleLinkEdit);
      return () => {
        document.removeEventListener("link-edit", handleLinkEdit);
      };
    }, []);

    // 内联文章编辑事件监听器
    const inlineArticleEditIndexRef = useRef<number | null>(null);

    useEffect(() => {
      const handleInlineArticleEdit = (e: Event) => {
        const customEvent = e as CustomEvent<{
          index: number;
          articles: Array<{
            id: string;
            title?: string;
            authorName?: string;
            views?: number;
            cover?: string;
            authorAvatar?: string;
          }>;
        }>;
        const { index, articles } = customEvent.detail;

        // 预填充选中文章（转换为 ArticleItem 格式）
        if (articles && articles.length > 0) {
          const preSelectedArticles = articles.map((article) => ({
            id: parseInt(article.id, 10),
            title: article.title || `文章 #${article.id}`,
            cover: article.cover,
            images: article.cover
              ? ([article.cover] as unknown as ImageInfo[])
              : undefined,
            author: user || {
              id: 0,
              username: article.authorName || "",
              nickname: article.authorName || "",
              status: "active",
              banned: "false",
              banReason: "",
              avatar: article.authorAvatar || "",
              description: "",
              background: "",
              gender: "unknown",
              birthDate: "",
              articleCount: 0,
            },
            views: article.views || 0,
          }));
          setSelectedArticles(preSelectedArticles as ArticleItem[]);
        }

        // 保存当前编辑的 blot 索引，用于替换
        inlineArticleEditIndexRef.current = index;

        // 打开文章选择对话框
        setShowArticleModal(true);
      };
      document.addEventListener("inline-article-edit", handleInlineArticleEdit);
      return () => {
        document.removeEventListener(
          "inline-article-edit",
          handleInlineArticleEdit,
        );
      };
    }, [user]);

    // 标记是否已完成初始值设置
    const hasInitializedRef = useRef(false);

    useEffect(() => {
      const quill = quillRef.current;
      if (!quill) return;

      const nextValue = value || "";
      const sanitizedNext = sanitizeRichTextHtml(nextValue);
      const currentValue = sanitizeRichTextHtml(quill.root.innerHTML || "");

      // 检测是否是初始加载（value 从 undefined/空 变成有值）
      const isInitialLoad =
        !hasInitializedRef.current &&
        (sanitizedNext || initialValueRef.current);

      // 只在初始化时应用外部值，避免编辑时覆盖用户输入
      if (isInitialLoad) {
        if (sanitizedNext !== currentValue) {
          isApplyingExternalValueRef.current = true;
          try {
            const preparedValue = prepareRichTextHtmlForEditor(nextValue);
            quill.setContents([], "silent");
            quill.clipboard.dangerouslyPasteHTML(0, preparedValue, "silent");
            ensureImageCaptions(quill.root);
            lastSyncedValueRef.current = sanitizeRichTextHtml(
              quill.root.innerHTML || "",
            );
          } finally {
            isApplyingExternalValueRef.current = false;
          }
        }
        hasInitializedRef.current = true;
        return;
      }

      // 初始化完成后，只在值真正变化且不是用户正在编辑时同步
      if (sanitizedNext === currentValue) {
        lastSyncedValueRef.current = currentValue;
        return;
      }

      // 如果编辑器有焦点，说明用户正在编辑，不覆盖
      if (quill.hasFocus()) {
        return;
      }

      // 只在确认是外部更新（不是来自 onChange）时才应用
      if (sanitizedNext !== lastSyncedValueRef.current) {
        isApplyingExternalValueRef.current = true;
        try {
          const preparedValue = prepareRichTextHtmlForEditor(nextValue);
          quill.setContents([], "silent");
          quill.clipboard.dangerouslyPasteHTML(0, preparedValue, "silent");
          ensureImageCaptions(quill.root);
          lastSyncedValueRef.current = sanitizeRichTextHtml(
            quill.root.innerHTML || "",
          );
        } finally {
          isApplyingExternalValueRef.current = false;
        }
      }
    }, [value]);

    // 点击外部关闭下拉菜单
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // 找到 toolbar 容器
        const toolbar = containerRef.current?.querySelector(".ql-toolbar");
        if (!toolbar) return;

        // 检查点击是否在 toolbar 内
        const isInsideToolbar = toolbar.contains(target);

        // 检查点击是否在任何 dropdown 内（包括 emoji 面板等）
        const dropdowns = document.querySelectorAll('[id^="dropdown-"]');
        const isInsideDropdown = Array.from(dropdowns).some((dropdown) =>
          dropdown.contains(target),
        );

        // 如果点击在 toolbar 外部且不在任何 dropdown 内，关闭所有下拉菜单
        if (!isInsideToolbar && !isInsideDropdown) {
          dropdowns.forEach((dropdown) => {
            dropdown.classList.add("hidden");
          });
        }
      };

      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // 插入视频的处理函数
    const handleInsertVideo = () => {
      const quill = quillRef.current;
      if (quill && videoUrl) {
        const parsed = parseVideoUrl(videoUrl);
        if (parsed) {
          // 使用保存的光标位置
          const index = savedSelection.current?.index ?? quill.getSelection(true)?.index ?? 0;
          quill.insertEmbed(index, "video", {
            src: videoUrl,
            platform: parsed.platform,
            videoId: parsed.videoId,
          });
        }
      }
      setShowVideoModal(false);
      setVideoUrl("");
      // 恢复焦点
      setTimeout(() => restoreFocus(), 0);
    };

    // 加载用户的文章列表
    const loadUserArticles = useCallback(
      async (keyword?: string, page: number = 1) => {
        if (!user?.id || !token) return;
        setArticleLoading(true);
        try {
          const response = await articleControllerFindByAuthor({
            path: { id: String(user.id) },
            query: {
              page,
              limit: 20,
              keyword: keyword || undefined,
            },
          });
          const data = response.data?.data?.data || [];
          const total = response.data?.data?.meta?.total || 0;

          const newArticles = data.map((article) => ({
            id: article.id,
            title: article.title,
            cover: article.cover,
            images: article.images,
            author: article.author,
            views: article.views,
          }));

          if (page === 1) {
            setArticles(newArticles);
            setArticleHasMore(newArticles.length < total);
          } else {
            setArticles((prev) => {
              // 去重：只添加不存在的新文章
              const existingIds = new Set(prev.map((a) => a.id));
              const uniqueNewArticles = newArticles.filter(
                (a) => !existingIds.has(a.id),
              );
              const updatedArticles = [...prev, ...uniqueNewArticles];
              setArticleHasMore(updatedArticles.length < total);
              return updatedArticles;
            });
          }

          setArticleTotal(total);
          setArticlePage(page);
        } catch (error) {
          console.error("Failed to load articles:", error);
          if (page === 1) {
            setArticles([]);
          }
        } finally {
          setArticleLoading(false);
        }
      },
      [user?.id, token],
    );

    // 加载更多文章
    const loadMoreArticles = useCallback(() => {
      if (articleLoading || !articleHasMore) return;
      const nextPage = articlePage + 1;
      loadUserArticles(articleSearchQuery, nextPage);
    }, [
      articleLoading,
      articleHasMore,
      articlePage,
      articleSearchQuery,
      loadUserArticles,
    ]);

    // 无限滚动监听
    useInfiniteScrollObserver({
      targetRef: loadMoreRef,
      onIntersect: loadMoreArticles,
      enabled: !articleLoading && articleHasMore && articles.length > 0,
      rootMargin: "50px",
    });

    // 通过ID搜索文章
    const searchArticleById = useCallback(
      async (id: number) => {
        if (!token) return;
        setArticleLoading(true);
        try {
          const response = await articleControllerFindOne({
            path: { id: String(id) },
          });
          const article = response.data?.data;
          if (article && article.authorId === user?.id) {
            setArticles([
              {
                id: article.id,
                title: article.title,
                images: article.images,
                author: article.author,
                views: article.views,
              },
            ]);
          } else {
            setArticles([]);
          }
        } catch (error) {
          console.error("Failed to search article:", error);
          setArticles([]);
        } finally {
          setArticleLoading(false);
        }
      },
      [token, user?.id],
    );

    // 处理搜索输入
    const handleArticleSearch = useCallback(
      (query: string) => {
        setArticleSearchQuery(query);
        setArticlePage(1);
        setArticleHasMore(true);
        // 检查是否是URL格式
        const urlRegex = /\/article\/(\d+)/;
        const match = query.match(urlRegex);
        if (match) {
          // 是URL，提取ID搜索
          const articleId = parseInt(match[1], 10);
          searchArticleById(articleId);
        } else {
          // 普通关键词搜索
          loadUserArticles(query, 1);
        }
      },
      [loadUserArticles, searchArticleById],
    );

    // 切换文章选中状态
    const toggleArticleSelection = (article: ArticleItem) => {
      setSelectedArticles((prev) => {
        const exists = prev.find((a) => a.id === article.id);
        if (exists) {
          return prev.filter((a) => a.id !== article.id);
        }
        return [...prev, article];
      });
    };

    // 拖拽排序处理
    const handleDragStart = (index: number) => {
      setDraggingIndex(index);
    };

    const handleDragOver = (
      e: React.DragEvent<HTMLDivElement>,
      index: number,
    ) => {
      e.preventDefault();
      if (draggingIndex === null || draggingIndex === index) return;
      setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      if (draggingIndex === null || draggingIndex === index) {
        setDraggingIndex(null);
        setDragOverIndex(null);
        return;
      }

      setSelectedArticles((prev) => {
        const newList = [...prev];
        const [draggedItem] = newList.splice(draggingIndex, 1);
        newList.splice(index, 0, draggedItem);
        return newList;
      });

      setDraggingIndex(null);
      setDragOverIndex(null);
    };

    const handleDragEnd = () => {
      setDraggingIndex(null);
      setDragOverIndex(null);
    };

    // 插入已选文章
    const handleInsertSelectedArticles = () => {
      const quill = quillRef.current;
      if (!quill || selectedArticles.length === 0) return;

      // 检查是否是编辑模式（有保存的索引）
      const editIndex = inlineArticleEditIndexRef.current;
      let index: number;

      if (editIndex !== null) {
        // 编辑模式：删除原有 blot 并在原位置插入
        index = editIndex;
        quill.deleteText(index, 1, "user");
      } else {
        // 插入模式：在光标位置插入
        const range = quill.getSelection();
        index = range?.index ?? quill.getLength();
      }

      // 所有文章都使用 inlineArticleList 包裹（包括单篇）
      const articles = selectedArticles.map((article) => {
        const coverUrl =
          article.cover ||
          (article.images?.length
            ? getImageUrl(article.images?.[0], "small")
            : undefined);

        return {
          id: String(article.id),
          title: article.title,
          authorName:
            article.author?.nickname || article.author?.username || "",
          views: article.views || 0,
          cover: coverUrl,
          authorAvatar: article.author?.avatar || "",
        };
      });

      quill.insertEmbed(index, "inlineArticleList", { articles }, "user");

      quill.setSelection(index + 1, 0, "silent");
      setShowArticleModal(false);
      setArticleSearchQuery("");
      setSelectedArticles([]);
      // 重置编辑索引
      inlineArticleEditIndexRef.current = null;
    };

    // Dialog 打开时加载文章
    useEffect(() => {
      if (showArticleModal && user?.id) {
        setArticlePage(1);
        setArticleHasMore(true);
        loadUserArticles(undefined, 1);
      }
    }, [showArticleModal, user?.id, loadUserArticles]);

    // 插入链接的处理函数
    const handleInsertLink = () => {
      const quill = quillRef.current;
      if (quill && linkUrl) {
        const selection = savedSelection.current || quill.getSelection();
        if (selection) {
          // 如果有选中的文字，直接添加链接
          if (selection.length > 0) {
            quill.formatText(
              selection.index,
              selection.length,
              "link",
              linkUrl,
            );
          } else if (linkText) {
            // 如果没有选中文字但有链接文字，插入新链接
            quill.insertText(selection.index, linkText, "link", linkUrl);
            quill.setSelection(selection.index + linkText.length, 0);
          } else {
            // 如果都没有，用链接地址作为文字
            quill.insertText(selection.index, linkUrl, "link", linkUrl);
            quill.setSelection(selection.index + linkUrl.length, 0);
          }
        }
      }
      setShowLinkModal(false);
      setLinkUrl("");
      setLinkText("");
      savedSelection.current = null;
    };

    const modalContentClassName = "max-w-2xl pt-4!";
    const modalBodyClassName = "space-y-4 px-4 pb-4";
    const modalActionsClassName = "flex justify-center gap-8";
    const modalCancelButtonClassName =
      "rounded-full bg-[#EDF1F7] hover:bg-[#8592A3] text-secondary";
    const modalConfirmButtonClassName = "rounded-full";

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: quillOverrideStyles }} />
        <div
          className={cn(
            "bg-card border border-border rounded-lg",
            "[&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-muted/50 [&_.ql-toolbar]:rounded-t-lg",
            "[&_.ql-toolbar_.ql-formats]:flex [&_.ql-toolbar_.ql-formats]:gap-1 [&_.ql-toolbar]:flex-wrap [&_.ql-toolbar]:p-2",
            "[&_.ql-toolbar button]:w-8 [&_.ql-toolbar button]:h-8 [&_.ql-toolbar button]:p-1 [&_.ql-toolbar button]:rounded [&_.ql-toolbar button]:flex [&_.ql-toolbar button]:items-center [&_.ql-toolbar button]:justify-center [&_.ql-toolbar button]:border-0 [&_.ql-toolbar button]:bg-transparent [&_.ql-toolbar button svg]:h-auto!",
            "[&_.ql-toolbar button:hover]:bg-accent [&_.ql-toolbar button:hover]:text-accent-foreground",
            "[&_.ql-toolbar button.ql-active]:bg-primary [&_.ql-toolbar button.ql-active]:text-primary-foreground",
            "[&_.ql-container]:border-0 [&_.ql-container]:rounded-b-lg [&_.ql-container]:min-h-100 [&_.ql-container]:overflow-visible",
            "[&_.ql-editor]:min-h-100! [&_.ql-editor]:text-sm",
            "[&_.ql-editor.ql-blank::before]:text-muted-foreground [&_.ql-editor.ql-blank::before]:font-normal",

            className,
          )}
        >
          <div ref={containerRef} />

          {/* Video Modal */}
          <Dialog
            open={showVideoModal}
            onOpenChange={(open) => {
              setShowVideoModal(open);
              if (!open) {
                setVideoUrl("");
                // 取消时恢复焦点
                setTimeout(() => restoreFocus(), 0);
              }
            }}
          >
            <DialogContent className={cn(modalContentClassName, "p-0!")}>
              <DialogHeader>
                <DialogTitle className="text-sm">
                  {t("modal.insertVideo")}
                </DialogTitle>
              </DialogHeader>
              <div className={modalBodyClassName}>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={t("modal.videoUrlPlaceholder")}
                  fullWidth
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInsertVideo();
                  }}
                />
                <div className={modalActionsClassName}>
                  <Button
                    variant="default"
                    className={modalCancelButtonClassName}
                    onClick={() => {
                      setShowVideoModal(false);
                      setVideoUrl("");
                    }}
                  >
                    {t("toolbar.cancel")}
                  </Button>
                  <Button
                    variant="default"
                    className={modalConfirmButtonClassName}
                    onClick={handleInsertVideo}
                  >
                    {t("toolbar.insert")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Link Modal */}
          <Dialog
            open={showLinkModal}
            onOpenChange={(open) => {
              setShowLinkModal(open);
              if (!open) {
                setLinkUrl("");
                setLinkText("");
                savedSelection.current = null;
              }
            }}
          >
            <DialogContent className={cn(modalContentClassName, "p-0!")}>
              <DialogHeader>
                <DialogTitle className="text-sm">
                  {t("modal.insertLink")}
                </DialogTitle>
              </DialogHeader>
              <div className={modalBodyClassName}>
                <Input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder={t("modal.linkTextPlaceholder")}
                  fullWidth
                />
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder={t("modal.linkUrlPlaceholder")}
                  fullWidth
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInsertLink();
                  }}
                />
                <div className={modalActionsClassName}>
                  <Button
                    variant="default"
                    onClick={() => {
                      setShowLinkModal(false);
                      setLinkUrl("");
                      setLinkText("");
                      savedSelection.current = null;
                    }}
                    className={modalCancelButtonClassName}
                  >
                    {t("toolbar.cancel")}
                  </Button>
                  <Button
                    variant="default"
                    className={modalConfirmButtonClassName}
                    onClick={handleInsertLink}
                  >
                    {t("toolbar.confirm")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Inline Article Modal */}
          <Dialog
            open={showArticleModal}
            onOpenChange={(open) => {
              setShowArticleModal(open);
              if (!open) {
                setArticleSearchQuery("");
                setArticles([]);
                setSelectedArticles([]);
                // 重置编辑索引
                inlineArticleEditIndexRef.current = null;
              }
            }}
          >
            <DialogContent
              className={cn(
                modalContentClassName,
                "p-0! rounded-xl! overflow-hidden! w-[min(960px,calc(100vw-2rem))]! max-w-2xl! h-[80vh]! flex flex-col",
              )}
            >
              <DialogHeader className="px-6 py-4 mb-0! border-b border-border shrink-0">
                <DialogTitle className="text-sm font-semibold">
                  {t("modal.insertArticle")}
                </DialogTitle>
              </DialogHeader>

              {/* 主体区域：必须 min-h-0，不然内部滚动会失效 */}
              <div className="flex-1 min-h-0 flex flex-col">
                {/* 表头 */}
                <div className="flex items-center px-6 py-2 bg-muted/60 text-sm border-b border-border shrink-0">
                  <div className="flex-1 min-w-0">
                    {t("articleSelector.articles", { count: articleTotal })}
                  </div>
                  <div className="flex-1 min-w-0">
                    {t("articleSelector.selected", {
                      count: selectedArticles.length,
                    })}
                  </div>
                </div>

                {/* 左右两栏容器：必须 flex-1 + min-h-0 */}
                <div className="flex-1 min-h-0 flex">
                  {/* 左边 */}
                  <div className="flex-1 min-w-0 min-h-0 flex flex-col border-r border-border">
                    {/* 搜索栏固定，不参与滚动 */}
                    <div className="px-3 py-2 shrink-0">
                      <Input
                        value={articleSearchQuery}
                        onChange={(e) => handleArticleSearch(e.target.value)}
                        placeholder={t("articleSelector.searchPlaceholder")}
                        fullWidth
                        className="h-8"
                      />
                    </div>

                    {/* 列表滚动区 */}
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2">
                      {articleLoading && articles.length === 0 ? (
                        <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                          {t("articleSelector.loading")}
                        </div>
                      ) : articles.length === 0 ? (
                        <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                          {t("articleSelector.noArticles")}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {articles.map((article) => {
                            const coverUrl =
                              article.cover ||
                              (article.images?.length &&
                                getImageUrl(article.images?.[0], "small"));
                            const isSelected = selectedArticles.some(
                              (a) => a.id === article.id,
                            );

                            return (
                              <button
                                key={article.id}
                                type="button"
                                onClick={() => toggleArticleSelection(article)}
                                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/60 transition-colors text-left "
                              >
                                <div className="flex items-center flex-1 gap-3">
                                  <div className="relative  aspect-4/3 h-14">
                                    <ImageWithFallback
                                      fill
                                      src={coverUrl || ""}
                                      alt={article.title}
                                      className=" object-cover rounded-md shrink-0"
                                    />
                                  </div>

                                  <span className="text-xs line-clamp-2 flex-1 min-w-0">
                                    {article.title}
                                  </span>
                                </div>
                                <div className="flex items-center justify-center">
                                  <span
                                    className={cn(
                                      "size-4 border border-primary rounded-full relative",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "absolute top-1/2 left-1/2 size-2 rounded-full bg-primary -translate-x-1/2 -translate-y-1/2",
                                        "transition-all",
                                        isSelected
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                          {/* 无限滚动状态组件 */}
                          <InfiniteScrollStatus
                            observerRef={loadMoreRef}
                            hasMore={articleHasMore}
                            loading={articleLoading}
                            isEmpty={articles.length === 0}
                            loadingText="加载中..."
                            allLoadedText="没有更多文章了"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右边 */}
                  <div className="flex-1 min-w-0 min-h-0 flex flex-col">
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2">
                      {selectedArticles.length === 0 ? (
                        <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                          {t("articleSelector.noSelectedArticles")}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {selectedArticles.map((article, index) => {
                            const coverUrl =
                              article.cover ||
                              (article.images?.length &&
                                getImageUrl(article.images?.[0], "small"));
                            const isDragging = draggingIndex === index;
                            const isDragOver = dragOverIndex === index;

                            return (
                              <div
                                key={article.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                  "w-full flex items-center gap-3 p-2 rounded-md transition-colors",
                                  isDragging && "opacity-50",
                                  isDragOver && "bg-primary/10",
                                  !isDragging &&
                                    !isDragOver &&
                                    "hover:bg-muted/60",
                                )}
                              >
                                <GripVertical
                                  size={16}
                                  className="cursor-grab text-muted-foreground"
                                />

                                <div className="flex flex-1 items-center gap-3">
                                  <div className="relative aspect-4/3 h-14">
                                    <ImageWithFallback
                                      fill
                                      src={coverUrl || ""}
                                      alt={article.title}
                                      className="object-cover rounded-md shrink-0"
                                    />
                                  </div>
                                  <span className="text-xs line-clamp-2 flex-1 min-w-0">
                                    {article.title}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleArticleSelection(article)
                                  }
                                  className="p-1 hover:bg-muted rounded"
                                >
                                  <X size={16} className="text-secondary" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-4! px-6 pb-5 pt-4 border-t border-border shrink-0 mt-0!">
                <Button
                  variant="outline"
                  className="rounded-full h-10 w-full"
                  onClick={() => {
                    setShowArticleModal(false);
                    setArticleSearchQuery("");
                    setSelectedArticles([]);
                  }}
                >
                  {t("articleSelector.cancel")}
                </Button>
                <Button
                  className="rounded-full h-10 w-full"
                  disabled={selectedArticles.length === 0}
                  onClick={handleInsertSelectedArticles}
                >
                  {t("articleSelector.insert", {
                    count: selectedArticles.length,
                  })}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </>
    );
  },
);

Editor.displayName = "Editor";
