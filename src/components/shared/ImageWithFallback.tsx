"use client";

import ImageBlock from "@/assets/images/placeholder/image_block.webp";
import imageError from "@/assets/images/placeholder/image_error.webp";
import imagePlaceholder from "@/assets/images/placeholder/image_placeholder.webp";
import { cn } from "@/lib";
import type { StaticImageData } from "next/image";
import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

const DEFAULT_PLACEHOLDER = imagePlaceholder;
const DEFAULT_ERROR = imageError;
const UNOPTIMIZED_HOSTS = new Set(["cf-s3.coslark.org"]);

// Helper to extract string URL from src (string or StaticImageData)
const getSrcString = (src: string | StaticImageData | undefined): string => {
  if (!src) return "";
  if (typeof src === "string") return src;
  return src.src;
};

// 全局图片缓存 - 存储已加载成功的图片URL
const imageCache = new Map<string, "loaded" | "error">();

// 预加载图片并返回Promise
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = src;
  });
};

type ImageWithFallbackProps = Omit<ImageProps, "onError"> & {
  wrapperClassName?: string;
  placeholderSrc?: string | StaticImageData;
  errorSrc?: string | StaticImageData;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  /** 是否启用懒加载（当图片进入视口时才加载） */
  lazy?: boolean;
  /** 懒加载的根边距 */
  lazyRootMargin?: string;
  /** 懒加载的阈值 */
  lazyThreshold?: number;
};

export function ImageWithFallback({
  alt,
  className,
  wrapperClassName,
  placeholderSrc = DEFAULT_PLACEHOLDER,
  errorSrc = DEFAULT_ERROR,
  src,
  onLoad,
  onError,
  fill,
  width,
  height,
  style,
  lazy = false,
  lazyRootMargin = "50px",
  lazyThreshold = 0,
  ...rest
}: ImageWithFallbackProps) {
  // Handle src as string or StaticImageData object
  let srcString: string;
  if (typeof src === "string") {
    srcString = src;
  } else if (src && typeof src === "object" && "src" in src) {
    // StaticImageData object
    srcString = (src as StaticImageData).src;
  } else {
    srcString = String(src ?? "");
  }

  // 如果图片被屏蔽，使用错误占位图
  if (srcString === "/images/blocked.webp") {
    srcString = ImageBlock.src;
  }

  // 从缓存获取初始状态
  const cachedStatus = imageCache.get(srcString);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    cachedStatus || "loading",
  );
  // 实际图片是否已渲染（用于缓存命中时的淡入效果）
  const [imageRendered, setImageRendered] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);

  // 懒加载：使用 Intersection Observer
  useEffect(() => {
    if (!lazy) return;
    if (shouldLoad) return;

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: lazyRootMargin,
        threshold: lazyThreshold,
      },
    );

    observer.observe(wrapper);

    return () => {
      observer.disconnect();
    };
  }, [lazy, shouldLoad, lazyRootMargin, lazyThreshold]);

  // 图片加载逻辑
  useEffect(() => {
    if (!shouldLoad) return;

    // 如果已有缓存，直接使用缓存状态
    if (imageCache.has(srcString)) {
      const cached = imageCache.get(srcString)!;
      setStatus(cached);
      // 缓存命中且已成功加载时，标记为已渲染
      if (cached === "loaded") {
        setImageRendered(true);
      }
      return;
    }

    // 重置为加载中状态
    setStatus("loading");
    setImageRendered(false);

    // 预加载图片并更新缓存
    preloadImage(srcString)
      .then(() => {
        imageCache.set(srcString, "loaded");
        setStatus("loaded");
      })
      .catch(() => {
        imageCache.set(srcString, "error");
        setStatus("error");
      });
  }, [srcString, shouldLoad]);

  const handleLoad: ImageProps["onLoad"] = (event) => {
    imageCache.set(srcString, "loaded");
    setStatus("loaded");
    setImageRendered(true);
    onLoad?.(event);
  };

  const handleError: ImageProps["onError"] = (event) => {
    imageCache.set(srcString, "error");
    setStatus("error");
    onError?.(event);
  };

  const fallbackSrc = status === "error" ? errorSrc : placeholderSrc;
  const fallbackSrcString = getSrcString(fallbackSrc);
  const placeholderSrcString = getSrcString(placeholderSrc);
  // 图片真正显示的条件：状态为 loaded 且实际已渲染
  const isImageVisible = status === "loaded" && imageRendered;
  // 添加过渡动画类，避免加载图到实际图的闪烁
  const imageClassName = cn(
    className,
    "transition-opacity duration-300",
    isImageVisible ? "opacity-100" : "opacity-0",
  );
  const placeholderClassName = cn(
    "pointer-events-none absolute inset-0 block select-none bg-cover bg-center transition-opacity duration-300",
    isImageVisible ? "opacity-0" : "opacity-100",
  );

  // 判断是否为本地图片（StaticImageData）
  const isLocalImage = typeof src !== "string";

  const shouldDisableOptimization =
    isLocalImage ||
    (typeof src === "string" &&
      (() => {
        try {
          const parsed = new URL(src, "http://localhost");
          return (
            parsed.searchParams.has("url") ||
            UNOPTIMIZED_HOSTS.has(parsed.hostname)
          );
        } catch {
          return false;
        }
      })());

  // 未开始加载时显示占位符
  if (!shouldLoad) {
    return (
      <span
        ref={wrapperRef}
        className={cn(
          fill
            ? "absolute inset-0 block overflow-hidden"
            : "relative block w-full overflow-hidden",
          wrapperClassName,
        )}
        style={
          fill
            ? undefined
            : {
                aspectRatio: width && height ? `${width}/${height}` : undefined,
              }
        }
      >
        <span
          aria-hidden
          className={cn(placeholderClassName)}
          style={{ backgroundImage: `url(${placeholderSrcString})` }}
        />
      </span>
    );
  }

  // fill 模式：wrapper 使用 absolute 定位覆盖父元素
  if (fill) {
    return (
      <span
        ref={wrapperRef}
        className={cn(
          "absolute inset-0 block overflow-hidden",
          wrapperClassName,
        )}
      >
        <Image
          src={srcString}
          alt={alt}
          fill
          unoptimized={shouldDisableOptimization}
          className={imageClassName}
          onLoad={handleLoad}
          onError={handleError}
          {...rest}
        />
        {!isImageVisible && (
          <span
            aria-hidden
            className={cn(placeholderClassName)}
            style={{ backgroundImage: `url(${fallbackSrcString})` }}
          />
        )}
      </span>
    );
  }

  // 无尺寸判断
  const widthNum = typeof width === "number" ? width : Number(width) || 0;
  const heightNum = typeof height === "number" ? height : Number(height) || 0;
  const hasDimensions = widthNum > 0 && heightNum > 0;

  // 无尺寸时：宽度填充容器，高度由图片比例决定
  if (!hasDimensions) {
    return (
      <span
        ref={wrapperRef}
        className={cn(
          "relative block w-full overflow-hidden",
          wrapperClassName,
        )}
      >
        <Image
          {...rest}
          src={srcString}
          alt={alt}
          width={1}
          height={1}
          unoptimized={true}
          className={cn("w-full h-auto", imageClassName)}
          onLoad={handleLoad}
          onError={handleError}
        />
        {!isImageVisible && (
          <span
            aria-hidden
            className={cn(placeholderClassName)}
            style={{ backgroundImage: `url(${fallbackSrcString})` }}
          />
        )}
      </span>
    );
  }

  // 有明确尺寸的情况
  return (
    <span
      ref={wrapperRef}
      className={cn(
        "relative inline-block max-w-full overflow-hidden align-top",
        wrapperClassName,
      )}
    >
      <Image
        {...rest}
        src={srcString}
        alt={alt}
        width={width}
        height={height}
        unoptimized={shouldDisableOptimization}
        className={cn("h-auto max-w-full", imageClassName)}
        style={{
          width: "auto",
          height: "auto",
          ...style,
        }}
        onLoad={handleLoad}
        onError={handleError}
      />
      {!isImageVisible && (
        <span
          aria-hidden
          className={cn(placeholderClassName)}
          style={{ backgroundImage: `url(${fallbackSrc})` }}
        />
      )}
    </span>
  );
}

// 导出缓存工具函数，供外部使用
export function clearImageCache(src?: string): void {
  if (src) {
    imageCache.delete(src);
  } else {
    imageCache.clear();
  }
}

export function getImageCacheStatus(
  src: string,
): "loaded" | "error" | undefined {
  return imageCache.get(src);
}

export function preloadImageToCache(src: string): Promise<void> {
  if (imageCache.get(src) === "loaded") {
    return Promise.resolve();
  }
  return preloadImage(src)
    .then(() => {
      imageCache.set(src, "loaded");
    })
    .catch(() => {
      imageCache.set(src, "error");
    });
}
