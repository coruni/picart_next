"use client";

import { cn } from "@/lib";
import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

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
      className={cn(
        "relative inline-block max-w-full overflow-hidden align-top",
        wrapperClassName,
      )}
    >
      <Image
        {...rest}
        src={src}
        alt={alt}
        width={width ?? 0}
        height={height ?? 0}
        unoptimized={shouldDisableOptimization}
        className={cn("h-auto w-auto", imageClassName)}
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
