"use client";

import { useEffect, useRef, useState } from "react";
import { ImageViewer } from "./ImageViewer";

type ArticleRichContentProps = {
  html: string;
};

export function ArticleRichContent({ html }: ArticleRichContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const imageNodes = Array.from(
      container.querySelectorAll<HTMLImageElement>(
        '.ql-image-wrapper > img.ql-image, img.ql-image',
      ),
    );

    imageNodes.forEach((img, index) => {
      img.dataset.viewerIndex = String(index);
      img.style.cursor = "zoom-in";
      img.loading = index === 0 ? "eager" : "lazy";
      img.fetchPriority = index === 0 ? "high" : "auto";
      img.decoding = "async";
    });

    setImages(
      imageNodes
        .map((img) => img.getAttribute("src") || "")
        .filter(Boolean),
    );

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const image = target?.closest("img.ql-image") as HTMLImageElement | null;
      if (!image) return;

      setActiveIndex(Number(image.dataset.viewerIndex || 0));
      setViewerVisible(true);
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [html]);

  return (
    <>
      <div
        ref={containerRef}
        className="ql-editor px-0!"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {viewerVisible && images.length > 0 && (
        <ImageViewer
          images={images}
          initialIndex={activeIndex}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
        />
      )}
    </>
  );
}
