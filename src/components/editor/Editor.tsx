"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { SizeClass, SizeStyle } from "quill/formats/size";
import QuillBlotFormatter2 from "@enzedonline/quill-blot-formatter2";
import type BlotFormatter from "@enzedonline/quill-blot-formatter2";
import { BlotSpec } from "@enzedonline/quill-blot-formatter2";
import "@enzedonline/quill-blot-formatter2/dist/css/quill-blot-formatter2.css";

import { CustomImageBlot } from "./blots/CustomImageBlot";
import { CustomImageSpec } from "./CustomImageSpec";
import { CustomLinkSpec } from "./CustomLinkSpec";
import {
  quillOverrideStyles,
  defaultFormats,
  customIcons,
  renderToolbar,
} from "./index";
import type { EditorProps } from "./index";
import {
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Button,
  uploadControllerUploadFile,
} from "./types";

// 注册自定义字号
SizeClass.whitelist = ["12px", "14px", "16px", "18px", "20px", "24px", "32px"];
SizeStyle.whitelist = ["12px", "14px", "16px", "18px", "20px", "24px", "32px"];
Quill.register(SizeStyle, true);
Quill.register(SizeClass, true);
Quill.register("modules/blotFormatter2", QuillBlotFormatter2);
Quill.register({ "formats/image": CustomImageBlot }, true);

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
    const savedSelection = useRef<{ index: number; length: number } | null>(
      null,
    );
    const quillRef = useRef<Quill | null>(null);
    const uploadAbortControllerRef = useRef<AbortController | null>(null);

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
              specs: [CustomImageSpec as unknown as typeof BlotSpec, CustomLinkSpec as unknown as typeof BlotSpec],
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
            // 图片上传处理
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

              // 为每个文件创建上传占位符并上传
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const currentIndex = startIndex + i;

                // 创建本地预览 URL
                // 转换为 base64 占位
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => resolve(e.target?.result as string);
                  reader.readAsDataURL(file);
                });

                // 插入带有上传状态的图片
                quill.insertEmbed(currentIndex, "image", base64);
                quill.setSelection(currentIndex + 1, 0);

                // 延迟一下确保 DOM 已更新
                await new Promise((resolve) => setTimeout(resolve, 50));

                // 找到刚插入的图片（CustomImageBlot 会创建 div.ql-image-wrapper > img.ql-image）
                const wrappers = quill.root.querySelectorAll("div.ql-image-wrapper");
                let targetWrapper: HTMLDivElement | null = null;
                let targetImg: HTMLImageElement | null = null;

                for (const wrapper of Array.from(wrappers)) {
                  const img = wrapper.querySelector("img.ql-image") as HTMLImageElement | null;
                  if (img && img.src === base64 && !img.dataset.uploaded) {
                    targetWrapper = wrapper as HTMLDivElement;
                    targetImg = img;
                    break;
                  }
                }

                if (targetWrapper && targetImg) {
                  // 设置 wrapper 为相对定位，以便显示遮罩
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

                  // 取消按钮
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

                  // 上传图片
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

                    // 更新进度
                    progressText.textContent = "100%";
                  } catch (error) {
                    if ((error as Error).name === "AbortError") {
                      continue;
                    }
                    console.error("上传失败:", error);
                    overlay.remove();
                    quill.deleteText(currentIndex, 1);
                    continue;
                  } finally {
                    // 移除遮罩
                    overlay.remove();
                  }
                }
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

        // 设置初始值
        if (value) {
          quill.root.innerHTML = value;
        }

        // 监听内容变化
        quill.on("text-change", () => {
          const html = quill.root.innerHTML || "";
          onChange?.(html);
        });

        // 键盘快捷键：Ctrl+C 复制图片
        const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "c") {
            // 检查是否有选中的图片 blot
            const selection = quill.getSelection();
            if (selection && selection.length > 0) {
              const delta = quill.getContents(selection.index, selection.length);
              // 检查是否包含图片
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const hasImage = delta.ops.some((op: any) => op.insert && typeof op.insert === "object" && "image" in op.insert);
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
                "user"
              );
              quill.setSelection(index + clipImage.length(), 0);
            }
          }
        };

        quill.root.addEventListener("keydown", handleKeyDown);

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

        // 监听 link-edit 事件（由 blotFormatter2 的 EditLinkAction 触发）
        const handleLinkEdit = (e: Event) => {
          const customEvent = e as CustomEvent<{ href: string; text: string }>;
          const { href, text } = customEvent.detail;
          setLinkUrl(href);
          setLinkText(text);
          setShowLinkModal(true);
        };
        document.addEventListener("link-edit", handleLinkEdit);
      }
    }, [ref, placeholder, readOnly, onChange, value]);

    // 点击外部关闭下拉菜单
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // 找到 toolbar 容器
        const toolbar = containerRef.current?.querySelector(".ql-toolbar");
        if (!toolbar) return;

        // 检查点击是否在 toolbar 内
        const isInsideToolbar = toolbar.contains(target);

        // 如果点击在 toolbar 外部，关闭所有下拉菜单
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

    // 插入视频的处理函数
    const handleInsertVideo = () => {
      const quill = quillRef.current;
      if (quill && videoUrl) {
        const range = quill.getSelection();
        quill.insertEmbed(range?.index || 0, "video", videoUrl);
      }
      setShowVideoModal(false);
      setVideoUrl("");
    };

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
    const modalBodyClassName = "space-y-4 py-4";
    const modalActionsClassName = "flex justify-center gap-8";
    const modalCancelButtonClassName =
      "rounded-full bg-[#EDF1F7] hover:bg-[#8592A3] text-muted";
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
                <DialogTitle className="text-sm">{t("modal.insertVideo")}</DialogTitle>
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
                <DialogTitle className="text-sm">{t("modal.insertLink")}</DialogTitle>
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
