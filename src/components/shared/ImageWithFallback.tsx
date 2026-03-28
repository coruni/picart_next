"use client";

import { cn } from "@/lib";
import Image, { type ImageProps } from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

const DEFAULT_PLACEHOLDER = "/placeholder/image_placeholder.webp";
const DEFAULT_ERROR = "/placeholder/image_error.webp";
const UNOPTIMIZED_HOSTS = new Set(["cf-s3.coslark.org"]);

type ImageWithFallbackProps = ImageProps & {
  wrapperClassName?: string;
  placeholderSrc?: string;
  errorSrc?: string;
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
  ...rest
}: ImageWithFallbackProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const activeImgRef = useRef<HTMLImageElement | null>(null);

  useLayoutEffect(() => {
    setStatus("loading");
  }, [src]);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let rafId = 0;
    let stopped = false;

    const detachActiveImg = () => {
      if (!activeImgRef.current) return;
      activeImgRef.current.removeEventListener("load", handleNativeLoad);
      activeImgRef.current.removeEventListener("error", handleDomError);
      activeImgRef.current = null;
    };

    const syncLoadedState = (img?: HTMLImageElement | null) => {
      const target = img ?? activeImgRef.current;
      if (!target) return;
      if (target.complete && target.naturalWidth > 0) {
        setStatus("loaded");
      }
    };

    const handleDomError = () => {
      setStatus("error");
    };

    const handleNativeLoad = (event: Event) => {
      syncLoadedState(event.currentTarget as HTMLImageElement | null);
    };

    const attachToImage = () => {
      const img = wrapper.querySelector("img") as HTMLImageElement | null;
      if (!img) return false;

      if (activeImgRef.current !== img) {
        detachActiveImg();
        activeImgRef.current = img;
        img.addEventListener("load", handleNativeLoad);
        img.addEventListener("error", handleDomError);
      }

      syncLoadedState(img);
      return true;
    };

    const tryAttach = (attempt = 0) => {
      if (stopped) return;
      if (attachToImage()) return;

      if (attempt >= 1) return;

      rafId = requestAnimationFrame(() => tryAttach(attempt + 1));
    };

    tryAttach();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      detachActiveImg();
    };
  }, [src, fill, width, height]);

  const handleLoad: ImageProps["onLoad"] = (event) => {
    setStatus("loaded");
    onLoad?.(event);
  };

  const handleError: ImageProps["onError"] = (event) => {
    setStatus("error");
    onError?.(event);
  };

  const fallbackSrc = status === "error" ? errorSrc : placeholderSrc;
  const imageClassName = cn(
    className,
    status === "loaded" ? "" : "opacity-0",
  );
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

  if (fill) {
    return (
      <span ref={wrapperRef} className={cn("absolute inset-0 block", wrapperClassName)}>
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

  return (
    <span
      ref={wrapperRef}
      className={cn("relative block overflow-hidden", wrapperClassName)}
      style={
        width && height
          ? { width: Number(width), height: Number(height) }
          : undefined
      }
    >
      <Image
        {...rest}
        src={src}
        alt={alt}
        width={width ?? 0}
        height={height ?? 0}
        unoptimized={shouldDisableOptimization}
        className={cn("h-auto w-auto", imageClassName)}
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
