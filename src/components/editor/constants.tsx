"use client";

import ReactDOMServer from "react-dom/server";
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
  Replace,
  ZoomIn,
  Copy,
  Trash2,
  Unlink,
  Pencil,
} from "lucide-react";

// 渲染图标组件为 HTML 字符串
export const renderIcon = (
  Icon: React.ComponentType<{ size?: number; className?: string }>,
  className?: string,
  size: number = 22,
) => {
  return ReactDOMServer.renderToStaticMarkup(
    <Icon size={size} className={className} />,
  );
};

// blotFormatter2 自定义图标
export const customIcons = {
  replace: renderIcon(Replace, "bg-transparent! size-4", 16),
  view: renderIcon(ZoomIn, "bg-transparent! size-4", 16),
  copy: renderIcon(Copy, "bg-transparent! size-4", 16),
  delete: renderIcon(Trash2, "bg-transparent! size-4", 16),
  left: renderIcon(AlignLeft, "bg-transparent! size-4", 16),
  center: renderIcon(AlignCenter, "bg-transparent! size-4", 16),
  right: renderIcon(AlignRight, "bg-transparent! size-4", 16),
  "edit-link": renderIcon(Pencil, "bg-transparent! size-4", 16),
  "remove-link": renderIcon(Unlink, "bg-transparent! size-4", 16),
};

export const defaultFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "code-block",
  "list",
  "link",
  "image",
  "emoji",
  "video",
  "align",
  "color",
  "background",
  "font",
  "size",
];

// 字号选项
export const fontSizes = [
  { value: "12px", label: "12px" },
  { value: "14px", label: "14px" },
  { value: "16px", label: "16px" },
  { value: "18px", label: "18px" },
  { value: "24px", label: "24px" },
  { value: "32px", label: "32px" },
];

// 更多选项
export const moreOptions = [
  { name: "link", label: "Link", Icon: Link },
  { name: "video", label: "Video", Icon: Video },
  { name: "clean", label: "Clear", Icon: RemoveFormatting },
];

// 颜色面板 - 72个颜色
export const colorPalette = [
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
  "rgb(179, 140, 0)",
  "rgb(153, 102, 0)",
];

// 对齐选项
export const alignOptions = [
  { value: false, label: "Default", Icon: AlignLeft },
  { value: "center", label: "Center", Icon: AlignCenter },
  { value: "right", label: "Right", Icon: AlignRight },
];

// 标题选项
export const headerOptions = [
  { value: 1, label: "H1", Icon: Heading1 },
  { value: 2, label: "H2", Icon: Heading2 },
  { value: 3, label: "H3", Icon: Heading3 },
  { value: 4, label: "H4", Icon: Heading4 },
];

// 导出需要的图标组件
export const icons = {
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
  Plus,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Link,
  RemoveFormatting,
};
