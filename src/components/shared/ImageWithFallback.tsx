"use client";

import imageError from "@/assets/images/placeholder/image_error.webp";
import imagePlaceholder from "@/assets/images/placeholder/image_placeholder.webp";
import { cn } from "@/lib";
import type { StaticImageData } from "next/image";
import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
const DEFAULT_PLACEHOLDER = imagePlaceholder;
const DEFAULT_ERROR = imageError;
const UNOPTIMIZED_HOSTS = new Set(["cf-s3.coslark.org"]);

type ImageWithFallbackProps = Omit<ImageProps, "onError"> & {
  wrapperClassName?: string;
  placeholderSrc?: string | StaticImageData;
  errorSrc?: string | StaticImageData;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
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
  ...rest
}: ImageWithFallbackProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const wrapperRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    setStatus("loading");
  }, [src]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const rafId = requestAnimationFrame(() => {
      const img = wrapper.querySelector("img") as HTMLImageElement | null;
      if (img?.complete && img.naturalWidth > 0) {
        setStatus("loaded");
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [src]);

  const handleLoad: ImageProps["onLoad"] = (event) => {
    setStatus("loaded");
    onLoad?.(event);
  };

  const handleError: ImageProps["onError"] = (event) => {
    setStatus("error");
    onError?.(event);
  };

  const fallbackSrc = status === "error" ? errorSrc : placeholderSrc;
  const imageClassName = cn(className, status === "loaded" ? "" : "opacity-0");
  const shouldDisableOptimization =
    typeof src === "string" &&
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
    })();

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
          {...rest}
          src={src}
          alt={alt}
          fill
          unoptimized={shouldDisableOptimization}
          className={imageClassName}
          onLoad={handleLoad}
          onError={handleError}
        />
        {status !== "loaded" && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 block select-none bg-cover bg-center"
            style={{ backgroundImage: `url(${fallbackSrc})` }}
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
          src={src}
          alt={alt}
          width={1}
          height={1}
          unoptimized={true}
          className={cn("w-full h-auto", imageClassName)}
          onLoad={handleLoad}
          onError={handleError}
        />
        {status !== "loaded" && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 block select-none bg-cover bg-center"
            style={{ backgroundImage: `url(${fallbackSrc})` }}
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
        src={src}
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
      {status !== "loaded" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 block select-none bg-cover bg-center"
          style={{ backgroundImage: `url(${fallbackSrc})` }}
        />
      )}
    </span>
  );
}
