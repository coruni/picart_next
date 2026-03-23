"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { SizeClass, SizeStyle } from "quill/formats/size";

// 注册自定义字号
SizeClass.whitelist = ["12px", "14px", "16px", "18px", "20px", "24px", "32px"];
SizeStyle.whitelist = ["12px", "14px", "16px", "18px", "20px", "24px", "32px"];
Quill.register(SizeStyle, true);
Quill.register(SizeClass, true);

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
  /* 下拉菜单隐藏滚动条但允许溢出 */
  .ql-toolbar [id^="dropdown-"] {
    overflow: visible !important;
  }
  .ql-toolbar [id^="dropdown-"]::-webkit-scrollbar {
    display: none !important;
  }
  .ql-toolbar [id^="dropdown-"] {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  /* Tooltip 样式 */
  .ql-toolbar .tooltip-wrapper {
    position: relative;
    display: inline-flex;
  }
  .ql-toolbar .tooltip-wrapper .tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    padding: 6px 10px;
    background: #333;
    color: white;
    font-size: 12px;
    white-space: nowrap;
    border-radius: 6px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
    pointer-events: none;
    z-index: 100;
  }
  .ql-toolbar .tooltip-wrapper .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #333;
  }
  .ql-toolbar .tooltip-wrapper:hover .tooltip {
    opacity: 1;
    visibility: visible;
  }
  /* 下拉菜单打开时隐藏按钮tooltip */
  .ql-toolbar .tooltip-wrapper:has([id^="dropdown-"]:not(.hidden)):hover .tooltip {
    opacity: 0 !important;
    visibility: hidden !important;
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
// 字号选项
const fontSizes = [
  { value: "12px", label: "12px" },
  { value: "14px", label: "14px" },
  { value: "16px", label: "16px" },
  { value: "18px", label: "18px" },
  { value: "24px", label: "24px" },
  { value: "32px", label: "32px" },
];

// 更多选项
const moreOptions = [
  { name: "link", label: "链接", Icon: Link },
  { name: "video", label: "视频", Icon: Video },
  { name: "clean", label: "清除", Icon: RemoveFormatting },
];

// 颜色面板 - 72个颜色
const colorPalette = [
  "rgba(0, 0, 0, 0.85)",
  "rgb(230, 230, 230)",
  "rgb(217, 217, 217)",
  "rgb(191, 191, 191)",
  "rgb(166, 166, 166)",
  "rgb(140, 140, 140)",
  "rgb(115, 115, 115)",
  "rgb(89, 89, 89)",
  "rgb(213, 255, 191)",
  "rgb(196, 255, 166)",
  "rgb(160, 251, 113)",
  "rgb(122, 216, 76)",
  "rgb(59, 177, 0)",
  "rgb(50, 150, 0)",
  "rgb(37, 112, 0)",
  "rgb(30, 89, 0)",
  "rgb(191, 255, 248)",
  "rgb(166, 255, 244)",
  "rgb(109, 242, 227)",
  "rgb(76, 217, 200)",
  "rgb(45, 178, 162)",
  "rgb(21, 143, 129)",
  "rgb(0, 102, 90)",
  "rgb(0, 77, 68)",
  "rgb(191, 232, 255)",
  "rgb(166, 222, 255)",
  "rgb(115, 204, 255)",
  "rgb(85, 185, 242)",
  "rgb(57, 166, 229)",
  "rgb(28, 128, 186)",
  "rgb(0, 81, 128)",
  "rgb(0, 65, 102)",
  "rgb(229, 191, 255)",
  "rgb(219, 166, 255)",
  "rgb(199, 115, 255)",
  "rgb(170, 80, 229)",
  "rgb(131, 21, 204)",
  "rgb(112, 12, 178)",
  "rgb(92, 0, 153)",
  "rgb(76, 0, 128)",
  "rgb(255, 191, 223)",
  "rgb(255, 166, 211)",
  "rgb(255, 115, 186)",
  "rgb(229, 80, 156)",
  "rgb(204, 51, 128)",
  "rgb(178, 27, 103)",
  "rgb(152, 0, 76)",
  "rgb(128, 0, 64)",
  "rgb(255, 196, 191)",
  "rgb(255, 173, 166)",
  "rgb(255, 111, 99)",
  "rgb(239, 34, 12)",
  "rgb(204, 71, 51)",
  "rgb(178, 41, 27)",
  "rgb(153, 18, 0)",
  "rgb(128, 15, 0)",
  "rgb(255, 219, 191)",
  "rgb(255, 192, 140)",
  "rgb(255, 164, 43)",
  "rgb(255, 122, 0)",
  "rgb(226, 100, 0)",
  "rgb(199, 89, 0)",
  "rgb(159, 72, 0)",
  "rgb(128, 57, 0)",
  "rgb(255, 238, 191)",
  "rgb(246, 214, 122)",
  "rgb(245, 201, 73)",
  "rgb(230, 179, 34)",
  "rgb(204, 159, 30)",
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

  // 创建带tooltip的按钮
  const createTooltipButton = (
    button: HTMLButtonElement,
    tooltipText: string,
  ) => {
    const wrapper = document.createElement("span");
    wrapper.className = "tooltip-wrapper";
    button.style.position = "relative";
    const tooltip = document.createElement("span");
    tooltip.className = "tooltip";
    tooltip.textContent = tooltipText;
    wrapper.appendChild(button);
    wrapper.appendChild(tooltip);
    return wrapper;
  };

  // 创建颜色下拉菜单
  const createColorDropdown = (
    triggerBtn: HTMLButtonElement,
    title: string,
    onSelect: (color: string | false) => void,
  ) => {
    const container = document.createElement("div");
    container.className = "relative inline-flex tooltip-wrapper";

    const dropdown = document.createElement("div");
    dropdown.className =
      "absolute top-full left-0 z-50 mt-2 bg-card border border-border rounded-xl shadow-lg p-3 hidden";
    dropdown.id = `dropdown-${title}`;

    // 标题
    const titleEl = document.createElement("div");
    titleEl.className = "text-sm font-medium mb-2";
    titleEl.textContent = title;
    dropdown.appendChild(titleEl);

    // 颜色网格
    const colorGrid = document.createElement("div");
    colorGrid.className = "grid grid-cols-8 gap-1.5";

    // 第一个是取消/移除颜色
    const removeBtn = document.createElement("button");
    removeBtn.className =
      "w-5! h-5! flex-none rounded flex items-center justify-center bg-muted hover:bg-accent border border-border";
    removeBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    removeBtn.onclick = () => {
      onSelect(false);
      dropdown.classList.add("hidden");
    };
    colorGrid.appendChild(removeBtn);

    // 添加颜色
    colorPalette.forEach((color) => {
      const colorBtn = document.createElement("button");
      colorBtn.className =
        "w-5! h-5! flex-none rounded hover:ring-2 hover:ring-primary/50";
      colorBtn.style.backgroundColor = color;
      colorBtn.onclick = () => {
        onSelect(color);
        dropdown.classList.add("hidden");
      };
      colorGrid.appendChild(colorBtn);
    });

    dropdown.appendChild(colorGrid);

    // 分割线
    const divider = document.createElement("div");
    divider.className = "border-t border-border my-2";
    dropdown.appendChild(divider);

    // 十六进制输入
    const hexInputContainer = document.createElement("div");
    hexInputContainer.className = "flex items-center gap-1";
    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.placeholder = "输入十六进制颜色";
    hexInput.className =
      "flex h-6 flex-1 rounded-md border bg-card px-2 py-1 text-sm placeholder:text-gray-400 focus:outline-none transition-colors duration-200 border-gray-300 hover:border-primary focus:border-primary";
    hexInput.maxLength = 7;
    const hexBtn = document.createElement("button");
    hexBtn.className =
      "inline-flex items-center justify-center gap-2 rounded-md border! border-primary! font-medium transition-all duration-200 focus:outline-none bg-primary text-primary! hover:bg-primary/20! px-3 h-6! text-sm";
    hexBtn.textContent = "确定";
    hexBtn.onclick = () => {
      const hex = hexInput.value.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        onSelect(hex);
        dropdown.classList.add("hidden");
      }
    };
    hexInputContainer.appendChild(hexInput);
    hexInputContainer.appendChild(hexBtn);
    dropdown.appendChild(hexInputContainer);

    container.appendChild(triggerBtn);
    container.appendChild(dropdown);

    // 添加tooltip
    const tooltip = document.createElement("span");
    tooltip.className = "tooltip";
    tooltip.textContent = title;
    container.appendChild(tooltip);

    triggerBtn.onclick = (e) => {
      toggleDropdown(`dropdown-${title}`, e);
    };

    return container;
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
  row1.appendChild(createTooltipButton(undoBtn, "撤销"));

  const redoBtn = document.createElement("button");
  redoBtn.className = "ql-redo";
  redoBtn.type = "button";
  redoBtn.innerHTML = renderIcon(Redo2);
  redoBtn.onclick = () => quill.history.redo();
  row1.appendChild(createTooltipButton(redoBtn, "重做"));

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
  row1.appendChild(createTooltipButton(emojiBtn, "表情"));

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
  row1.appendChild(createTooltipButton(imageBtn, "图片"));

  // Video 按钮
  const videoBtn = document.createElement("button");
  videoBtn.className = "ql-video";
  videoBtn.type = "button";
  videoBtn.innerHTML = renderIcon(Video);
  videoBtn.onclick = onVideoClick;
  row1.appendChild(createTooltipButton(videoBtn, "视频"));

  // 更多下拉菜单 - 点击显示
  const moreDiv = document.createElement("div");
  moreDiv.className = "relative inline-flex tooltip-wrapper";
  const moreBtn = document.createElement("button");
  moreBtn.className =
    "flex w-full! items-center justify-center rounded-full bg-primary text-primary";
  moreBtn.type = "button";
  moreBtn.innerHTML = renderIcon(Plus, "w-3 h-3", 22);
  moreDiv.appendChild(moreBtn);
  const moreTooltip = document.createElement("span");
  moreTooltip.className = "tooltip";
  moreTooltip.textContent = "更多";
  moreDiv.appendChild(moreTooltip);

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
    { name: "bold", Icon: Bold, tooltip: "粗体" },
    { name: "italic", Icon: Italic, tooltip: "斜体" },
    { name: "strike", Icon: Strikethrough, tooltip: "删除线" },
    { name: "underline", Icon: Underline, tooltip: "下划线" },
  ];
  formatBtns.forEach(({ name, Icon, tooltip }) => {
    const button = document.createElement("button");
    button.className = `ql-${name}`;
    button.type = "button";
    button.innerHTML = renderIcon(Icon);
    button.onclick = () => {
      quill.format(name, !quill.getFormat()[name]);
    };
    row2.appendChild(createTooltipButton(button, tooltip));
  });

  // 分隔符
  const divider2 = document.createElement("span");
  divider2.className = "w-px h-4 bg-border mx-1";
  row2.appendChild(divider2);

  // 字号下拉
  const sizeDiv = document.createElement("div");
  sizeDiv.className = "relative inline-flex tooltip-wrapper";
  const sizeTrigger = document.createElement("button");
  sizeTrigger.className =
    "flex items-center justify-between px-2 rounded border bg-background text-sm hover:bg-accent relative";
  sizeTrigger.type = "button";
  sizeTrigger.innerHTML = `<span class="flex items-center gap-1">${renderIcon(Type)}</span><span class="flex items-center absolute top-full -right-1 -translate-y-full -rotate-45 text-secondary">${renderIcon(ChevronDown, "w-3! h-3!", 12)}</span>`;
  sizeDiv.appendChild(sizeTrigger);
  const sizeTooltip = document.createElement("span");
  sizeTooltip.className = "tooltip";
  sizeTooltip.textContent = "字号";
  sizeDiv.appendChild(sizeTooltip);

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
  colorBtn.onclick = (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById("dropdown-文字颜色");
    closeAllDropdowns();
    dropdown?.classList.toggle("hidden");
  };

  const bgColorBtn = document.createElement("button");
  bgColorBtn.className = "ql-background";
  bgColorBtn.type = "button";
  bgColorBtn.innerHTML = renderIcon(Highlighter);
  bgColorBtn.onclick = (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById("dropdown-背景颜色");
    closeAllDropdowns();
    dropdown?.classList.toggle("hidden");
  };

  // 创建颜色下拉
  const colorDropdown = createColorDropdown(colorBtn, "文字颜色", (color) => {
    quill.format("color", color);
  });

  const bgColorDropdown = createColorDropdown(
    bgColorBtn,
    "背景颜色",
    (color) => {
      quill.format("background", color);
    },
  );

  row3.appendChild(colorDropdown);
  row3.appendChild(bgColorDropdown);

  toolbar.appendChild(row3);

  // 第四行：align 下拉
  const row4 = document.createElement("div");
  row4.className = "ql-formats flex! items-center gap-3";

  const alignDiv = document.createElement("div");
  alignDiv.className = "relative inline-flex tooltip-wrapper";
  const alignTrigger = document.createElement("button");
  alignTrigger.className =
    "flex items-center justify-between px-2 rounded border bg-background text-sm hover:bg-accent relative";
  alignTrigger.type = "button";
  alignTrigger.innerHTML = `<span class="flex items-center gap-1">${renderIcon(AlignLeft)}</span><span class="flex items-center absolute top-full -right-1 -translate-y-full -rotate-45 text-secondary">${renderIcon(ChevronDown, "w-3! h-3!", 12)}</span>`;
  alignDiv.appendChild(alignTrigger);
  const alignTooltip = document.createElement("span");
  alignTooltip.className = "tooltip";
  alignTooltip.textContent = "对齐";
  alignDiv.appendChild(alignTooltip);

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

  // 第五行：list 下拉
  const row5 = document.createElement("div");
  row5.className = "ql-formats flex! items-center gap-3";

  const listOptions = [
    { value: "ordered", label: "有序", Icon: ListOrdered },
    { value: "bullet", label: "无序", Icon: List },
  ];

  const listDiv = document.createElement("div");
  listDiv.className = "relative inline-flex tooltip-wrapper";
  const listTrigger = document.createElement("button");
  listTrigger.className =
    "flex items-center justify-between px-2 rounded border bg-background text-sm hover:bg-accent relative";
  listTrigger.type = "button";
  listTrigger.innerHTML = `<span class="flex items-center gap-1">${renderIcon(List)}</span><span class="flex items-center absolute top-full -right-1 -translate-y-full -rotate-45 text-secondary">${renderIcon(ChevronDown, "w-3! h-3!", 12)}</span>`;
  listDiv.appendChild(listTrigger);
  const listTooltip = document.createElement("span");
  listTooltip.className = "tooltip";
  listTooltip.textContent = "列表";
  listDiv.appendChild(listTooltip);

  const listMenu = document.createElement("div");
  listMenu.className =
    "absolute top-full left-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg py-2! px-1! min-w-24 flex flex-col hidden";
  listMenu.id = "dropdown-list";
  listOptions.forEach(({ value, label, Icon }) => {
    const item = document.createElement("button");
    item.className =
      "w-full! hover:bg-primary/20! px-3 py-2! rounded-md text-left flex! items-center gap-2 text-sm hover:text-primary! transition-colors";
    item.type = "button";
    item.innerHTML = `${Icon ? renderIcon(Icon, "w-4 h-4!") : ""}<span>${label}</span>`;
    item.onclick = () => {
      quill.format("list", quill.getFormat().list === value ? false : value);
      listMenu.classList.add("hidden");
    };
    listMenu.appendChild(item);
  });
  listDiv.appendChild(listMenu);
  listTrigger.onclick = (e) => {
    toggleDropdown("dropdown-list", e);
  };
  row5.appendChild(listDiv);

  toolbar.appendChild(row5);

  // 第六行：header 下拉
  const row6 = document.createElement("div");
  row6.className = "ql-formats flex! items-center gap-3";

  const headerDiv = document.createElement("div");
  headerDiv.className = "relative inline-flex tooltip-wrapper";
  const headerTrigger = document.createElement("button");
  headerTrigger.className =
    "flex items-center justify-between px-2 rounded border bg-background text-sm hover:bg-accent relative";
  headerTrigger.type = "button";
  headerTrigger.innerHTML = `<span class="flex items-center gap-1">${renderIcon(Heading1)}</span><span class="flex items-center absolute top-full -right-1 -translate-y-full -rotate-45 text-secondary">${renderIcon(ChevronDown, "w-3! h-3!", 12)}</span>`;
  headerDiv.appendChild(headerTrigger);
  const headerTooltip = document.createElement("span");
  headerTooltip.className = "tooltip";
  headerTooltip.textContent = "标题";
  headerDiv.appendChild(headerTooltip);

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
            "bg-card border border-border rounded-lg",
            "[&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-muted/50 [&_.ql-toolbar]:rounded-t-lg",
            "[&_.ql-toolbar_.ql-formats]:flex [&_.ql-toolbar_.ql-formats]:gap-1 [&_.ql-toolbar]:flex-wrap [&_.ql-toolbar]:p-2",
            "[&_.ql-toolbar button]:w-8 [&_.ql-toolbar button]:h-8 [&_.ql-toolbar button]:p-1 [&_.ql-toolbar button]:rounded [&_.ql-toolbar button]:flex [&_.ql-toolbar button]:items-center [&_.ql-toolbar button]:justify-center [&_.ql-toolbar button]:border-0 [&_.ql-toolbar button]:bg-transparent [&_.ql-toolbar button svg]:h-[auto]! [&_.ql-toolbar button svg]:!h-auto",
            "[&_.ql-toolbar button:hover]:bg-accent [&_.ql-toolbar button:hover]:text-accent-foreground",
            "[&_.ql-toolbar button.ql-active]:bg-primary [&_.ql-toolbar button.ql-active]:text-primary-foreground",
            "[&_.ql-container]:border-0 [&_.ql-container]:rounded-b-lg [&_.ql-container]:min-h-50 [&_.ql-container]:overflow-visible",
            "[&_.ql-editor]:min-h-50 [&_.ql-editor]:text-sm [&_.ql-editor]:overflow-visible",
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
