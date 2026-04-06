"use client";

import { prepareRichTextHtmlForDisplay } from "@/lib";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageViewer } from "./ImageViewer";

type ArticleRichContentProps = {
  html: string;
};

export function ArticleRichContent({ html }: ArticleRichContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const locale = useLocale();

  const safeHtml = useMemo(() => {
    return prepareRichTextHtmlForDisplay(html, locale);
  }, [html, locale]);

  const handleCloseViewer = useCallback(() => {
    setViewerVisible(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const imageNodes = container.querySelectorAll<HTMLImageElement>(
      ".ql-image-wrapper > img.ql-image:not(.ql-emoji-embed__img)",
    );

    const nextImages: string[] = [];
    imageNodes.forEach((img, index) => {
      img.dataset.viewerIndex = String(index);
      img.loading = index === 0 ? "eager" : "lazy";
      img.fetchPriority = index === 0 ? "high" : "auto";
      img.decoding = "async";

      const src = img.getAttribute("src");
      if (src) {
        nextImages.push(src);
      }
    });

    setImages(nextImages);

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      let image = target.closest("img.ql-image") as HTMLImageElement | null;

      if (!image && target.closest(".ql-image-wrapper")) {
        image = target
          .closest(".ql-image-wrapper")
          ?.querySelector("img.ql-image") as HTMLImageElement | null;
      }

      if (!image) return;
      if (image.classList.contains("ql-emoji-embed__img")) return;

      // 实时计算索引，不依赖 dataset（避免 React 重渲染导致 dataset 丢失）
      const allImages = container.querySelectorAll<HTMLImageElement>(
        ".ql-image-wrapper > img.ql-image:not(.ql-emoji-embed__img)",
      );
      const index = Array.from(allImages).indexOf(image);

      setActiveIndex(index >= 0 ? index : 0);
      setViewerVisible(true);
    };

    container.addEventListener("click", handleClick);
    return () => {
      container.removeEventListener("click", handleClick);
    };
  }, [safeHtml]);

  return (
    <>
      <div
        ref={containerRef}
        className="ql-editor px-0! *:cursor-auto! [&_.ql-image]:cursor-zoom-in"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
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
