"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";
import {
  Undo2,
  Redo2,
  Smile,
  Image,
  Video,
  Type,
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Palette,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ListOrdered,
  List,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Link,
  RemoveFormatting,
  Plus,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

// 覆盖 Quill 默认的 SVG 高度样式
const quillOverrideStyles = `
  .ql-snow.ql-toolbar button svg,
  .ql-snow .ql-toolbar button svg {
    height: auto !important;
    color: #8592a3 !important;
  }
  .ql-snow.ql-toolbar .ql-formats button:not(.h-8),
  .ql-snow .ql-toolbar .ql-formats button:not(.h-8) {
    display: flex !important;
    flex-shrink: 0 !important;
    height: auto !important;
    line-height: auto !important;
    width: auto !important;
  }
  .ql-snow.ql-toolbar .ql-formats button:not(.h-8) svg,
  .ql-snow .ql-toolbar .ql-formats button:not(.h-8) svg {
    width: 24px !important;
    height: 24px !important;
  }
  .ql-toolbar.ql-snow,
  .ql-container.ql-snow
  {
    border:none !important;
    }
`;

export interface EditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const defaultFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
  "image",
  "video",
  "align",
  "color",
  "background",
  "font",
  "size",
];

// 字号选项
const fontSizes = [
  { value: 12, label: "12px" },
  { value: 14, label: "14px" },
  { value: 16, label: "16px" },
  { value: 22, label: "22px" },
  { value: 24, label: "24px" },
  { value: 32, label: "32px" },
];

// 更多选项
const moreOptions = [
  { name: "link", label: "链接", Icon: Link },
  { name: "video", label: "视频", Icon: Video },
  { name: "clean", label: "清除", Icon: RemoveFormatting },
];

// 对齐选项
const alignOptions = [
  { value: false, label: "默认", Icon: AlignLeft },
  { value: "center", label: "居中", Icon: AlignCenter },
  { value: "right", label: "右对齐", Icon: AlignRight },
];

// 标题选项
const headerOptions = [
  { value: 1, label: "H1", Icon: Heading1 },
  { value: 2, label: "H2", Icon: Heading2 },
  { value: 3, label: "H3", Icon: Heading3 },
  { value: 4, label: "H4", Icon: Heading4 },
];

// 渲染图标组件为 HTML 字符串
const renderIcon = (
  Icon: React.ComponentType<{ size?: number; className?: string }>,
  className?: string,
  size: number = 22,
) => {
  return ReactDOMServer.renderToStaticMarkup(
    <Icon size={size} className={className} />,
  );
};

// 渲染 toolbar 函数（放在组件外部）
const renderToolbar = (
  quill: Quill,
  container: HTMLElement,
  onVideoClick: () => void,
) => {
  const toolbar = document.createElement("div");
  toolbar.className = "ql-toolbar ql-snow flex items-center bg-border!";

  // 关闭所有下拉菜单
  const closeAllDropdowns = () => {
    container.querySelectorAll('[id^="dropdown-"]').forEach((el) => {
      el.classList.add("hidden");
    });
  };

  // 切换指定下拉菜单（先关闭其他下拉菜单）
  const toggleDropdown = (dropdownId: string, e: Event) => {
    e.stopPropagation();
    closeAllDropdowns();
    const dropdown = document.getElementById(dropdownId);
    dropdown?.classList.toggle("hidden");
  };

  // 第一行：undo redo | emoji image video more
  const row1 = document.createElement("div");
  row1.className = "ql-formats flex! items-center gap-3";

  // Undo, Redo
  const undoBtn = document.createElement("button");
  undoBtn.className = "ql-undo";
  undoBtn.type = "button";
  undoBtn.innerHTML = renderIcon(Undo2);
  undoBtn.onclick = () => quill.history.undo();
  row1.appendChild(undoBtn);

  const redoBtn = document.createElement("button");
  redoBtn.className = "ql-redo";
  redoBtn.type = "button";
  redoBtn.innerHTML = renderIcon(Redo2);
  redoBtn.onclick = () => quill.history.redo();
  row1.appendChild(redoBtn);

  // 分隔符
  const divider1 = document.createElement("span");
  divider1.className = "w-px h-4 bg-border mx-1";
  row1.appendChild(divider1);

  // Emoji, Image
  const emojiBtn = document.createElement("button");
  emojiBtn.className = "ql-emoji";
  emojiBtn.type = "button";
  emojiBtn.innerHTML = renderIcon(Smile);
  emojiBtn.onclick = () => {
    const emoji = prompt("输入 emoji:");
    if (emoji) {
      const range = quill.getSelection();
      quill.insertText(range?.index || 0, emoji);
    }
  };
  row1.appendChild(emojiBtn);

  const imageBtn = document.createElement("button");
  imageBtn.className = "ql-image";
  imageBtn.type = "button";
  imageBtn.innerHTML = renderIcon(Image);
  imageBtn.onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const range = quill.getSelection();
          quill.insertEmbed(range?.index || 0, "image", result);
        };
        reader.readAsDataURL(file);
      }
    };
  };
  row1.appendChild(imageBtn);

  // Video 按钮
  const videoBtn = document.createElement("button");
  videoBtn.className = "ql-video";
  videoBtn.type = "button";
  videoBtn.innerHTML = renderIcon(Video);
  videoBtn.onclick = onVideoClick;
  row1.appendChild(videoBtn);

  // 更多下拉菜单 - 点击显示
  const moreDiv = document.createElement("div");
  moreDiv.className = "relative inline-flex";
  const moreBtn = document.createElement("button");
  moreBtn.className =
    "flex w-full! items-center justify-center rounded-full bg-primary text-primary";
  moreBtn.type = "button";
  moreBtn.innerHTML = renderIcon(Plus, "w-3 h-3", 22);
  moreDiv.appendChild(moreBtn);

  const moreDropdown = document.createElement("div");
  moreDropdown.className =
    "absolute top-full left-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg py-2 px-1 min-w-24 flex flex-col hidden";
  moreDropdown.id = "dropdown-more";
  moreOptions.forEach(({ name, label, Icon }) => {
    const item = document.createElement("button");
    item.className =
      "w-full! hover:bg-primary/20! px-3 py-2! rounded-md text-left flex! items-center gap-2 text-sm hover:text-primary!  transition-colors";
    item.type = "button";
    item.innerHTML = `${Icon ? renderIcon(Icon, "w-4 h-4!") : ""}<span>${label}</span>`;
    if (name === "link") {
      item.onclick = () => {
        const linkValue = prompt("请输入链接地址:");
        if (linkValue) quill.format("link", linkValue);
        moreDropdown.classList.add("hidden");
      };
    } else if (name === "video") {
      item.onclick = () => {
        onVideoClick();
        moreDropdown.classList.add("hidden");
      };
    } else if (name === "clean") {
      item.onclick = () => {
        const format = quill.getFormat();
        Object.keys(format).forEach((key) => quill.format(key, false));
        moreDropdown.classList.add("hidden");
      };
    }
    moreDropdown.appendChild(item);
  });
  moreDiv.appendChild(moreDropdown);
  moreBtn.onclick = (e) => {
    toggleDropdown("dropdown-more", e);
  };
  row1.appendChild(moreDiv);

  toolbar.appendChild(row1);

  // 第二行：bold italic strike underline | 字号
  const row2 = document.createElement("div");
  row2.className = "ql-formats flex! items-center gap-3";

  const formatBtns = [
    { name: "bold", Icon: Bold },
    { name: "italic", Icon: Italic },
    { name: "strike", Icon: Strikethrough },
    { name: "underline", Icon: Underline },
  ];
  formatBtns.forEach(({ name, Icon }) => {
    const button = document.createElement("button");
    button.className = `ql-${name}`;
    button.type = "button";
    button.innerHTML = renderIcon(Icon);
    button.onclick = () => {
      quill.format(name, !quill.getFormat()[name]);
    };
    row2.appendChild(button);
  });

  // 分隔符
  const divider2 = document.createElement("span");
  divider2.className = "w-px h-4 bg-border mx-1";
  row2.appendChild(divider2);

  // 字号下拉
  const sizeDiv = document.createElement("div");
  sizeDiv.className = "relative inline-flex";
  const sizeTrigger = document.createElement("button");
  sizeTrigger.className =
    "flex items-center justify-between px-2 rounded border bg-background text-sm hover:bg-accent relative";
  sizeTrigger.type = "button";
  sizeTrigger.innerHTML = `<span class="flex items-center gap-1">${renderIcon(Type)}</span><span class="flex items-center absolute top-full -right-2 -translate-y-full -rotate-45 text-secondary">${renderIcon(ChevronDown, "w-3! h-3!", 12)}</span>`;
  sizeDiv.appendChild(sizeTrigger);

  const sizeMenu = document.createElement("div");
  sizeMenu.className =
    "absolute top-full left-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg py-2! px-1! min-w-24 flex flex-col hidden";
  sizeMenu.id = "dropdown-size";
  fontSizes.forEach(({ value, label }) => {
    const item = document.createElement("button");
    item.className =
      "w-full! hover:bg-primary/20! px-3 py-2! rounded-md text-left flex! items-center gap-2 text-sm hover:text-primary! transition-colors";
    item.type = "button";
    item.textContent = label;
    item.onclick = () => {
      quill.format("size", value);
      sizeMenu.classList.add("hidden");
    };
    sizeMenu.appendChild(item);
  });
  sizeDiv.appendChild(sizeMenu);
  sizeTrigger.onclick = (e) => {
    toggleDropdown("dropdown-size", e);
  };
  row2.appendChild(sizeDiv);

  toolbar.appendChild(row2);

  // 第三行：color bgcolor
  const row3 = document.createElement("div");
  row3.className = "ql-formats flex! items-center gap-3";

  const colorBtn = document.createElement("button");
  colorBtn.className = "ql-color";
  colorBtn.type = "button";
  colorBtn.innerHTML = renderIcon(Palette);
  colorBtn.onclick = () => {
    const colors = [
      "#000000",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
    ];
    const color = prompt(`选择颜色 (${colors.join(", ")}):`);
    if (color && colors.includes(color)) {
      quill.format("color", color);
    }
  };
  row3.appendChild(colorBtn);

  const bgColorBtn = document.createElement("button");
  bgColorBtn.className = "ql-background";
  bgColorBtn.type = "button";
  bgColorBtn.innerHTML = renderIcon(Highlighter);
  bgColorBtn.onclick = () => {
    const colors = [
      "transparent",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
    ];
    const color = prompt(`选择背景颜色 (${colors.join(", ")}):`);
    if (color && colors.includes(color)) {
      quill.format("background", color);
    }
  };
  row3.appendChild(bgColorBtn);

  toolbar.appendChild(row3);

  // 第四行：align 下拉
  const row4 = document.createElement("div");
  row4.className = "ql-formats flex! items-center gap-3";

  const alignDiv = document.createElement("div");
  alignDiv.className = "relative inline-flex";
  const alignTrigger = document.createElement("button");
  alignTrigger.className =
    "flex items-center justify-between px-2 rounded border bg-background text-sm hover:bg-accent relative";
  alignTrigger.type = "button";
  alignTrigger.innerHTML = `<span class="flex items-center gap-1">${renderIcon(AlignLeft)}</span><span class="flex items-center absolute top-full -right-2 -translate-y-full -rotate-45 text-secondary">${renderIcon(ChevronDown, "w-3! h-3!", 12)}</span>`;
  alignDiv.appendChild(alignTrigger);

  const alignMenu = document.createElement("div");
  alignMenu.className =
    "absolute top-full left-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg py-2! px-1! min-w-24 flex flex-col hidden";
  alignMenu.id = "dropdown-align";
  alignOptions.forEach(({ value, label, Icon }) => {
    const item = document.createElement("button");
    item.className =
      "w-full! hover:bg-primary/20! px-3 py-2! rounded-md text-left flex! items-center gap-2 text-sm hover:text-primary! transition-colors";
    item.type = "button";
    item.innerHTML = `${Icon ? renderIcon(Icon, "w-3.5 h-3.5") : ""}<span>${label}</span>`;
    item.onclick = () => {
      quill.format("align", value);
      alignMenu.classList.add("hidden");
    };
    alignMenu.appendChild(item);
  });
  alignDiv.appendChild(alignMenu);
  alignTrigger.onclick = (e) => {
    toggleDropdown("dropdown-align", e);
  };
  row4.appendChild(alignDiv);

  toolbar.appendChild(row4);

  // 第五行：list
  const row5 = document.createElement("div");
  row5.className = "ql-formats flex! items-center gap-3";

  const listBtns = [
    { value: "ordered", Icon: ListOrdered },
    { value: "bullet", Icon: List },
  ];
  listBtns.forEach(({ value, Icon }) => {
    const button = document.createElement("button");
    button.className = "ql-list";
    button.type = "button";
    button.setAttribute("data-value", value);
    button.innerHTML = renderIcon(Icon);
    button.onclick = () => {
      quill.format("list", quill.getFormat().list === value ? false : value);
    };
    row5.appendChild(button);
  });

  toolbar.appendChild(row5);

  // 第六行：header 下拉
  const row6 = document.createElement("div");
  row6.className = "ql-formats flex! items-center gap-3";

  const headerDiv = document.createElement("div");
  headerDiv.className = "relative inline-flex";
  const headerTrigger = document.createElement("button");
  headerTrigger.className =
    "flex items-center justify-between px-2 rounded border bg-background text-sm hover:bg-accent relative";
  headerTrigger.type = "button";
  headerTrigger.innerHTML = `<span class="flex items-center gap-1">${renderIcon(Heading1)}</span><span class="flex items-center absolute top-full -right-2 -translate-y-full -rotate-45 text-secondary">${renderIcon(ChevronDown, "w-3! h-3!", 12)}</span>`;
  headerDiv.appendChild(headerTrigger);

  const headerMenu = document.createElement("div");
  headerMenu.className =
    "absolute top-full left-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg py-2! px-1! min-w-24 flex flex-col hidden";
  headerMenu.id = "dropdown-header";
  headerOptions.forEach(({ value, label, Icon }) => {
    const item = document.createElement("button");
    item.className =
      "w-full! hover:bg-primary/20! px-3 py-2! rounded-md text-left flex! items-center gap-2 text-sm hover:text-primary! transition-colors";
    item.type = "button";
    item.innerHTML = `${Icon ? renderIcon(Icon, "w-3.5 h-3.5") : ""}<span>${label}</span>`;
    item.onclick = () => {
      quill.format("header", value);
      headerMenu.classList.add("hidden");
    };
    headerMenu.appendChild(item);
  });
  headerDiv.appendChild(headerMenu);
  headerTrigger.onclick = (e) => {
    toggleDropdown("dropdown-header", e);
  };
  row6.appendChild(headerDiv);

  toolbar.appendChild(row6);

  // 插入 toolbar
  const editorContainer = container.querySelector(".editor-container");
  if (editorContainer) {
    container.insertBefore(toolbar, editorContainer);
  }
};

/**
 * 富文本编辑器组件
 * 基于 Quill.js
 */
export const Editor = forwardRef<Quill | null, EditorProps>(
  (
    {
      value,
      onChange,
      placeholder = "请输入内容",
      className,
      readOnly = false,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [videoUrl, setVideoUrl] = useState("");
    const quillRef = useRef<Quill | null>(null);

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
          },
          formats: defaultFormats,
          placeholder,
          readOnly,
        });

        quillRef.current = quill;

        // 渲染自定义 toolbar
        renderToolbar(quill, container, () => setShowVideoModal(true));

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

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: quillOverrideStyles }} />
        <div
          className={cn(
            "bg-card border border-border rounded-lg overflow-hidden",
            "[&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-muted/50 [&_.ql-toolbar]:rounded-t-lg",
            "[&_.ql-toolbar_.ql-formats]:flex [&_.ql-toolbar_.ql-formats]:gap-1 [&_.ql-toolbar]:flex-wrap [&_.ql-toolbar]:p-2",
            "[&_.ql-toolbar button]:w-8 [&_.ql-toolbar button]:h-8 [&_.ql-toolbar button]:p-1 [&_.ql-toolbar button]:rounded [&_.ql-toolbar button]:flex [&_.ql-toolbar button]:items-center [&_.ql-toolbar button]:justify-center [&_.ql-toolbar button]:border-0 [&_.ql-toolbar button]:bg-transparent [&_.ql-toolbar button svg]:h-[auto]! [&_.ql-toolbar button svg]:!h-auto",
            "[&_.ql-toolbar button:hover]:bg-accent [&_.ql-toolbar button:hover]:text-accent-foreground",
            "[&_.ql-toolbar button.ql-active]:bg-primary [&_.ql-toolbar button.ql-active]:text-primary-foreground",
            "[&_.ql-container]:border-0 [&_.ql-container]:rounded-b-lg [&_.ql-container]:min-h-50",
            "[&_.ql-editor]:min-h-50 [&_.ql-editor]:text-sm",
            "[&_.ql-editor.ql-blank::before]:text-muted-foreground [&_.ql-editor.ql-blank::before]:italic",
            className,
          )}
        >
          <div ref={containerRef} />

          {/* Video Modal */}
          <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>插入视频</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="请输入视频链接"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInsertVideo();
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVideoModal(false)}
                    className="px-4 py-2 text-sm rounded-lg border border-input hover:bg-accent"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertVideo}
                    className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    插入
                  </button>
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
