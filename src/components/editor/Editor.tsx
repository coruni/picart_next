"use client";

import QuillBlotFormatter2, {
  BlotSpec,
} from "@enzedonline/quill-blot-formatter2";
import "@enzedonline/quill-blot-formatter2/dist/css/quill-blot-formatter2.css";
import { useTranslations } from "next-intl";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { SizeClass, SizeStyle } from "quill/formats/size";
import { forwardRef, useEffect, useRef, useState } from "react";

import { prepareRichTextHtmlForEditor, sanitizeRichTextHtml } from "@/lib";
import { CustomEmojiBlot } from "./blots/CustomEmojiBlot";
import { CustomImageBlot } from "./blots/CustomImageBlot";
import type { EditorProps } from "./index";
import {
  customIcons,
  defaultFormats,
  quillOverrideStyles,
  renderToolbar,
} from "./index";
import { CustomImageSpec, CustomLinkSpec } from "./specs";
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
  Quill.register({ "formats/emoji": CustomEmojiBlot }, true);

  if (typeof window !== "undefined") {
    window.__PICART_QUILL_REGISTERED__ = true;
  }
};

registerQuillModules();

/**
 * 瀵屾枃鏈紪杈戝櫒缁勪欢
 * 鍩轰簬 Quill.js
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
    const savedSelection = useRef<{ index: number; length: number } | null>(
      null,
    );
    const quillRef = useRef<Quill | null>(null);
    const uploadAbortControllerRef = useRef<AbortController | null>(null);
    const lastSyncedValueRef = useRef("");

    const emitSanitizedContent = (root: HTMLElement) => {
      const html = sanitizeRichTextHtml(root.innerHTML || "");
      lastSyncedValueRef.current = html;
      onChange?.(html);
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

    // 鍒濆鍖?Quill
    useEffect(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;

      // 鍒涘缓 editor 瀹瑰櫒
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

        // 娓叉煋鑷畾涔?toolbar
        renderToolbar({
          quill,
          container,
          t: (key: string) => t(`toolbar.${key}`),
          onVideoClick: () => setShowVideoModal(true),
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
          onImageUpload: () => {
            // 鍥剧墖涓婁紶澶勭悊
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

              // 涓烘瘡涓枃浠跺垱寤轰笂浼犲崰浣嶇骞朵笂浼?
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const currentIndex = startIndex + i;

                // 鍒涘缓鏈湴棰勮 URL
                // 杞崲涓?base64 鍗犱綅
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => resolve(e.target?.result as string);
                  reader.readAsDataURL(file);
                });

                // 鎻掑叆甯︽湁涓婁紶鐘舵€佺殑鍥剧墖
                quill.insertEmbed(currentIndex, "image", base64);
                quill.setSelection(currentIndex + 1, 0);

                // 寤惰繜涓€涓嬬‘淇?DOM 宸叉洿鏂?
                await new Promise((resolve) => setTimeout(resolve, 50));

                // 鎵惧埌鍒氭彃鍏ョ殑鍥剧墖锛圕ustomImageBlot 浼氬垱寤?div.ql-image-wrapper > img.ql-image锛?
                const wrappers = quill.root.querySelectorAll(
                  "div.ql-image-wrapper",
                );
                let targetWrapper: HTMLDivElement | null = null;
                let targetImg: HTMLImageElement | null = null;

                for (const wrapper of Array.from(wrappers)) {
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
                  // 璁剧疆 wrapper 涓虹浉瀵瑰畾浣嶏紝浠ヤ究鏄剧ず閬僵
                  targetWrapper.style.position = "relative";
                  targetWrapper.style.display = "inline-block";

                  // 鍒涘缓閬僵
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

                  // 灏嗛伄缃╂坊鍔犲埌 wrapper 涓?
                  targetWrapper.appendChild(overlay);

                  // 鍙栨秷鎸夐挳
                  const cancelBtn = overlay.querySelector(
                    ".cancel-btn",
                  ) as HTMLButtonElement;
                  const abortController = new AbortController();
                  uploadAbortControllerRef.current = abortController;

                  cancelBtn.onclick = () => {
                    abortController.abort();
                    overlay.remove();
                    quill.deleteText(currentIndex, 1);
                  };

                  // 涓婁紶鍥剧墖
                  const progressText = overlay.querySelector(
                    ".progress-text",
                  ) as HTMLSpanElement;
                  try {
                    const formData = new FormData();
                    formData.append("file", file);
                    const response = await uploadControllerUploadFile({
                      bodySerializer: (body) => {
                        const formData = new FormData();
                        formData.append("files", body.file);
                        return formData;
                      },
                      body: { file },
                      headers: {
                        "Content-Type": null,
                      },
                    });

                    if (response.data?.data?.[0]?.url) {
                      targetImg.src = response.data.data[0].url;
                      targetImg.dataset.uploaded = "true";
                    }

                    // 鏇存柊杩涘害
                    progressText.textContent = "100%";
                  } catch (error) {
                    if ((error as Error).name === "AbortError") {
                      continue;
                    }
                    console.error("Upload failed:", error);
                    overlay.remove();
                    quill.deleteText(currentIndex, 1);
                    continue;
                  } finally {
                    // 绉婚櫎閬僵
                    overlay.remove();
                  }
                }
              }
            };
          },
        });

        // 鏆撮湶 quill 瀹炰緥
        if (ref) {
          if (typeof ref === "function") {
            ref(quill);
          } else {
            ref.current = quill;
          }
        }

        // 璁剧疆鍒濆鍊?
        if (value) {
          const preparedValue = prepareRichTextHtmlForEditor(value);
          quill.root.innerHTML = preparedValue;
          ensureImageCaptions(quill.root);
          lastSyncedValueRef.current = sanitizeRichTextHtml(preparedValue);
        }

        // 鐩戝惉鍐呭鍙樺寲
        const handleTextChange = () => {
          ensureImageCaptions(quill.root);
          emitSanitizedContent(quill.root);
        };

        quill.on("text-change", handleTextChange);

        // 閿洏蹇嵎閿細Ctrl+C 澶嶅埗鍥剧墖
        const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "c") {
            // 妫€鏌ユ槸鍚︽湁閫変腑鐨勫浘鐗?blot
            const selection = quill.getSelection();
            if (selection && selection.length > 0) {
              const delta = quill.getContents(
                selection.index,
                selection.length,
              );
              // 妫€鏌ユ槸鍚﹀寘鍚浘鐗?

              const hasImage = delta.ops.some(
                (op: any) =>
                  op.insert &&
                  typeof op.insert === "object" &&
                  "image" in op.insert,
              );
              if (hasImage) {
                // 瀛樺偍鍒板叏灞€鍙橀噺
                (window as any).__quillClipboardImage = delta;
              }
            }
          }

          // Ctrl+V 绮樿创鍥剧墖
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

        // 鐩戝惉鍥剧墖 caption 杈撳叆锛屽悓姝ュ埌 alt 灞炴€?
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

        // 闃绘 caption 涓婄殑閿洏浜嬩欢鍐掓场鍒?Quill
        const handleCaptionKeyDown = (e: KeyboardEvent) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains("ql-image-caption")) {
            // 鍏佽鍩烘湰鐨勭紪杈戞搷浣?
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              // 绉诲姩鍏夋爣鍒板浘鐗囧悗闈?
              const wrapper = target.closest(".ql-image-wrapper");
              if (wrapper) {
                const blot = quill.scroll.find(wrapper);
                if (blot) {
                  const index = quill.getIndex(blot);
                  quill.setSelection(index + 1, 0);
                }
              }
            }
            // 闃绘鍒犻櫎閿垹闄ゅ浘鐗囨湰韬?
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
    }, [ref, placeholder, readOnly, onChange, value]);

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

    useEffect(() => {
      const quill = quillRef.current;
      if (!quill) return;

      const nextValue = value || "";
      if (nextValue === lastSyncedValueRef.current) return;

      const preparedValue = prepareRichTextHtmlForEditor(nextValue);
      quill.root.innerHTML = preparedValue;
      ensureImageCaptions(quill.root);
      lastSyncedValueRef.current = sanitizeRichTextHtml(preparedValue);
    }, [value]);

    // 鐐瑰嚮澶栭儴鍏抽棴涓嬫媺鑿滃崟
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // 鎵惧埌 toolbar 瀹瑰櫒
        const toolbar = containerRef.current?.querySelector(".ql-toolbar");
        if (!toolbar) return;

        // 妫€鏌ョ偣鍑绘槸鍚﹀湪 toolbar 鍐?
        const isInsideToolbar = toolbar.contains(target);

        // 濡傛灉鐐瑰嚮鍦?toolbar 澶栭儴锛屽叧闂墍鏈変笅鎷夎彍鍗?
        if (!isInsideToolbar) {
          const dropdowns = toolbar.querySelectorAll('[id^="dropdown-"]');
          dropdowns.forEach((dropdown) => {
            dropdown.classList.add("hidden");
          });
        }
      };

      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // 鎻掑叆瑙嗛鐨勫鐞嗗嚱鏁?
    const handleInsertVideo = () => {
      const quill = quillRef.current;
      if (quill && videoUrl) {
        const range = quill.getSelection();
        quill.insertEmbed(range?.index || 0, "video", videoUrl);
      }
      setShowVideoModal(false);
      setVideoUrl("");
    };

    // 鎻掑叆閾炬帴鐨勫鐞嗗嚱鏁?
    const handleInsertLink = () => {
      const quill = quillRef.current;
      if (quill && linkUrl) {
        const selection = savedSelection.current || quill.getSelection();
        if (selection) {
          // 濡傛灉鏈夐€変腑鐨勬枃瀛楋紝鐩存帴娣诲姞閾炬帴
          if (selection.length > 0) {
            quill.formatText(
              selection.index,
              selection.length,
              "link",
              linkUrl,
            );
          } else if (linkText) {
            // 濡傛灉娌℃湁閫変腑鏂囧瓧浣嗘湁閾炬帴鏂囧瓧锛屾彃鍏ユ柊閾炬帴
            quill.insertText(selection.index, linkText, "link", linkUrl);
            quill.setSelection(selection.index + linkText.length, 0);
          } else {
            // 濡傛灉閮芥病鏈夛紝鐢ㄩ摼鎺ュ湴鍧€浣滀负鏂囧瓧
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
    const modalBodyClassName = "space-y-4 py-4";
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
            "[&_.ql-toolbar button]:w-8 [&_.ql-toolbar button]:h-8 [&_.ql-toolbar button]:p-1 [&_.ql-toolbar button]:rounded [&_.ql-toolbar button]:flex [&_.ql-toolbar button]:items-center [&_.ql-toolbar button]:justify-center [&_.ql-toolbar button]:border-0 [&_.ql-toolbar button]:bg-transparent [&_.ql-toolbar button svg]:h-[auto]! [&_.ql-toolbar button svg]:!h-auto",
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
              }
            }}
          >
            <DialogContent className={modalContentClassName}>
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
            <DialogContent className={modalContentClassName}>
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
        </div>
      </>
    );
  },
);

Editor.displayName = "Editor";

