"use client";

import ImageBlock from "@/assets/images/placeholder/image_blocked.webp";
import imageError from "@/assets/images/placeholder/image_error.webp";
import ImagePending from "@/assets/images/placeholder/image_pending.webp";
import imagePlaceholder from "@/assets/images/placeholder/image_placeholder.webp";
import { cn } from "@/lib";
import type { StaticImageData } from "next/image";
import Image, { type ImageProps } from "next/image";
import type StaticImport from "next/image.js";
import { useCallback, useEffect, useRef, useState } from "react";

// StaticRequire is not exported by next/image, reconstruct it inline
type StaticRequire = { default: StaticImageData };
type AnySrc =
  | string
  | StaticImageData
  | StaticRequire
  | typeof StaticImport
  | undefined;

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_PLACEHOLDER = imagePlaceholder;
const DEFAULT_ERROR = imageError;
const UNOPTIMIZED_HOSTS = new Set(["cf-s3.coslark.org"]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSrcString(src: AnySrc): string {
  if (!src) return "";
  if (typeof src === "string") return src;
  // StaticRequire: { default: StaticImageData }
  if ("default" in (src as object)) return (src as StaticRequire).default.src;
  // StaticImageData: { src: string }
  if ("src" in (src as object)) return (src as StaticImageData).src;
  return "";
}

function normalizeSrc(raw: AnySrc): string {
  const s = toSrcString(raw);
  if (s.includes("/images/blocked.webp")) return ImageBlock.src;
  if (s.includes("/images/pending.webp")) return ImagePending.src;
  return s;
}

function shouldDisableOptimize(src: AnySrc): boolean {
  if (!src || typeof src !== "string") return true; // local image → skip optimize
  try {
    const parsed = new URL(src, "http://localhost");
    return (
      parsed.searchParams.has("url") || UNOPTIMIZED_HOSTS.has(parsed.hostname)
    );
  } catch {
    return false;
  }
}

// ─── Global image status cache ───────────────────────────────────────────────

type CacheStatus = "loaded" | "error";
const imageCache = new Map<string, CacheStatus>();

// ─── Types ───────────────────────────────────────────────────────────────────

type LoadStatus = "idle" | "loading" | "loaded" | "error";

type ImageWithFallbackProps = Omit<ImageProps, "onError"> & {
  wrapperClassName?: string;
  placeholderSrc?: AnySrc;
  errorSrc?: AnySrc;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  /** 是否启用懒加载（当图片进入视口时才加载） */
  lazy?: boolean;
  /** 懒加载的根边距 */
  lazyRootMargin?: string;
  /** 懒加载的阈值 */
  lazyThreshold?: number;
};

// ─── Component ───────────────────────────────────────────────────────────────

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
  const srcString = normalizeSrc(src);
  const placeholderUrl = toSrcString(placeholderSrc);
  const errorUrl = toSrcString(errorSrc);
  const unoptimized = shouldDisableOptimize(src);

  // ── Lazy load visibility ──────────────────────────────────────────────────
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(!lazy);

  useEffect(() => {
    if (!lazy || inView) return;
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: lazyRootMargin, threshold: lazyThreshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy, inView, lazyRootMargin, lazyThreshold]);

  // ── Load status ───────────────────────────────────────────────────────────
  const cached = imageCache.get(srcString);
  const [status, setStatus] = useState<LoadStatus>(
    cached ? cached : inView ? "loading" : "idle",
  );

  // When inView flips to true, kick off loading if not already cached
  useEffect(() => {
    if (!inView) return;
    if (imageCache.has(srcString)) {
      setStatus(imageCache.get(srcString)!);
      return;
    }
    setStatus("loading");
  }, [inView, srcString]);

  // Reset status when src changes
  useEffect(() => {
    if (imageCache.has(srcString)) {
      setStatus(imageCache.get(srcString)!);
    } else if (inView) {
      setStatus("loading");
    } else {
      setStatus("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcString]);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      imageCache.set(srcString, "loaded");
      setStatus("loaded");
      onLoad?.(e);
    },
    [srcString, onLoad],
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      imageCache.set(srcString, "error");
      setStatus("error");
      onError?.(e);
    },
    [srcString, onError],
  );

  // ── Derived values ────────────────────────────────────────────────────────
  const isLoaded = status === "loaded";
  const fallbackUrl = status === "error" ? errorUrl : placeholderUrl;

  const widthNum = typeof width === "number" ? width : Number(width) || 0;
  const heightNum = typeof height === "number" ? height : Number(height) || 0;
  const hasDimensions = widthNum > 0 && heightNum > 0;

  // ── Render ────────────────────────────────────────────────────────────────

  /**
   * FallbackLayer — absolutely fills the wrapper, fades out once real image is loaded.
   * Uses its own <img> tag so it always fills the container regardless of the
   * real image's intrinsic size or the fill/width/height props passed to it.
   */
  const FallbackLayer = (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 select-none overflow-hidden",
        "transition-opacity duration-300",
        isLoaded ? "opacity-0" : "opacity-100",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fallbackUrl} alt="" className="h-full w-full object-cover" />
    </span>
  );

  // ── fill mode ─────────────────────────────────────────────────────────────
  if (fill) {
    return (
      <span
        ref={wrapperRef}
        className={cn(
          "absolute inset-0 block overflow-hidden",
          wrapperClassName,
        )}
      >
        {FallbackLayer}
        {inView && (
          <Image
            {...rest}
            src={srcString}
            alt={alt}
            fill
            unoptimized={unoptimized}
            className={cn(
              "transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
              className,
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </span>
    );
  }

  // ── fixed dimensions mode ─────────────────────────────────────────────────
  if (hasDimensions) {
    return (
      <span
        ref={wrapperRef}
        className={cn(
          "relative inline-block overflow-hidden align-top",
          wrapperClassName,
        )}
        style={{ width: widthNum, height: heightNum }}
      >
        {FallbackLayer}
        {inView && (
          <Image
            {...rest}
            src={srcString}
            alt={alt}
            width={width}
            height={height}
            unoptimized={unoptimized}
            style={style}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
              className,
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </span>
    );
  }

  // ── fluid / no dimensions mode ────────────────────────────────────────────
  // Width fills container; height is intrinsic to the image.
  // Fallback uses a 16:9 aspect ratio as a reasonable placeholder height.
  return (
    <span
      ref={wrapperRef}
      className={cn("relative block w-full overflow-hidden", wrapperClassName)}
    >
      {/* Placeholder: holds space with 16:9 ratio until real image loads */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 select-none overflow-hidden",
          "transition-opacity duration-300",
          isLoaded ? "opacity-0" : "opacity-100",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fallbackUrl} alt="" className="h-full w-full object-cover" />
      </span>

      {/* Invisible spacer that keeps 16:9 aspect until the real image loads */}
      {!isLoaded && (
        <span
          aria-hidden
          className="block w-full"
          style={{ paddingBottom: "56.25%" }}
        />
      )}

      {inView && (
        <Image
          {...rest}
          src={srcString}
          alt={alt}
          width={1}
          height={1}
          unoptimized
          style={style}
          className={cn(
            "w-full h-auto transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className,
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </span>
  );
}

// ─── Cache utilities ──────────────────────────────────────────────────────────

export function clearImageCache(src?: string): void {
  if (src) {
    imageCache.delete(src);
  } else {
    imageCache.clear();
  }
}

export function getImageCacheStatus(src: string): CacheStatus | undefined {
  return imageCache.get(src);
}

export function preloadImageToCache(src: string): Promise<void> {
  if (imageCache.get(src) === "loaded") return Promise.resolve();
  return new Promise<void>((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      imageCache.set(src, "loaded");
      resolve();
    };
    img.onerror = () => {
      imageCache.set(src, "error");
      resolve(); // resolve anyway so callers don't need to catch
    };
    img.src = src;
  });
}
