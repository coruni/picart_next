"use client";

import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { prepareRichTextHtmlForDisplay } from "@/lib";
import { useLocale } from "next-intl";
import { parse } from "node-html-parser";
import {
  createElement,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ImageViewer } from "./ImageViewer";

type ArticleRichContentProps = {
  html: string;
};

interface ParseResult {
  content: ReactNode;
  images: string[];
}

// 将HTML字符串转换为React元素，将img.ql-image替换为ImageWithFallback
function parseHtmlToReact(html: string): ParseResult {
  const root = parse(html);
  const images: string[] = [];

  function convertNode(node: any, depth = 0): ReactNode {
    if (node.nodeType === 3) {
      // 文本节点
      return node.text;
    }

    if (node.nodeType !== 1) {
      return null;
    }

    const tagName = node.tagName?.toLowerCase();
    if (!tagName) return null;

    // 获取属性
    const props: Record<string, unknown> = { key: `${tagName}-${depth}-${Math.random()}` };
    const attributes = node.attributes || {};

    for (const [key, value] of Object.entries(attributes)) {
      if (key === "class") {
        props.className = value;
      } else if (key === "style") {
        props.style = value;
      } else if (key.startsWith("data-")) {
        props[key] = value;
      } else if (key === "src" || key === "alt" || key === "title" || key === "href" || key === "target" || key === "rel") {
        props[key] = value;
      }
    }

    // 处理图片：将img.ql-image替换为ImageWithFallback
    if (tagName === "img" && node.classList?.contains("ql-image") && !node.classList?.contains("ql-emoji-embed__img")) {
      const src = node.getAttribute("src") || "";
      const alt = node.getAttribute("alt") || "";
      const className = node.getAttribute("class") || "";
      const index = images.length;

      // 记录图片信息用于viewer
      images.push(src);

      return createElement(ImageWithFallback, {
        key: `img-${src}-${index}`,
        src,
        alt,
        className,
        lazy: index > 0,
        unoptimized: true,
        style: { maxWidth: "100%", height: "auto" },
        wrapperClassName: "ql-image-wrapper-inner", // 标记内部wrapper
      });
    }

    // 递归处理子节点
    const children = node.childNodes?.map((child: any, i: number) =>
      convertNode(child, depth + 1 + i)
    ).filter(Boolean);

    // 处理 ql-image-wrapper：如果子内容也包含 ql-image-wrapper，则不创建当前层（避免嵌套）
    if (tagName === "div" && node.classList?.contains("ql-image-wrapper")) {
      // 检查子内容是否包含 ql-image-wrapper
      const hasNestedWrapper = children?.some(
        (child: any) => child?.props?.className?.includes("ql-image-wrapper")
      );
      if (hasNestedWrapper) {
        // 直接返回子内容，不创建额外的 wrapper
        return children.length === 1 ? children[0] : createElement("div", { key: `merged-${depth}` }, ...children);
      }
      // 保留一层 wrapper
      return createElement("div", { key: `wrapper-${depth}`, className: "ql-image-wrapper" }, ...children);
    }

    // 创建元素
    if (tagName === "body" || tagName === "html") {
      return createElement("div", props, ...children);
    }

    return createElement(tagName, props, ...children);
  }

  const result = root.childNodes?.map((node: any, i: number) => convertNode(node, i)).filter(Boolean);

  // 直接返回子元素数组，避免创建额外的 div 包裹层
  const content = result?.length === 1 ? result[0] : createElement(Fragment, {}, ...result);

  return { content, images };
}

export function ArticleRichContent({ html }: ArticleRichContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const locale = useLocale();

  const safeHtml = useMemo(() => {
    return prepareRichTextHtmlForDisplay(html, locale);
  }, [html, locale]);

  // 解析HTML并收集图片信息
  const { content: parsedContent, images: parsedImages } = useMemo(() => {
    return parseHtmlToReact(safeHtml);
  }, [safeHtml]);

  // 同步图片列表到state（用于viewer）
  useEffect(() => {
    setImages(parsedImages);
  }, [parsedImages]);

  const handleCloseViewer = useCallback(() => {
    setViewerVisible(false);
  }, []);

  // 点击图片打开viewer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // 查找被点击的图片
      const image = target.closest("img.ql-image") as HTMLImageElement | null;
      if (!image) return;
      if (image.classList.contains("ql-emoji-embed__img")) return;

      // 计算索引
      const allImages = container.querySelectorAll<HTMLImageElement>(
        "img.ql-image:not(.ql-emoji-embed__img)"
      );
      const index = Array.from(allImages).indexOf(image);

      setActiveIndex(index >= 0 ? index : 0);
      setViewerVisible(true);
    };

    container.addEventListener("click", handleClick);
    return () => {
      container.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="ql-editor px-0! *:cursor-auto! [&_.ql-image]:cursor-zoom-in"
      >
        {parsedContent}
      </div>
      {viewerVisible && images.length > 0 && (
        <ImageViewer
          images={images}
          enableSidePanel={false}
          initialIndex={activeIndex}
          visible={viewerVisible}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
}
