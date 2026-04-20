"use client";

import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { ArticleDetail } from "@/types";
import { getImageUrl, type ImageInfo } from "@/types/image";
import { ChevronLeft, ChevronRight, Fullscreen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ImageViewer } from "./ImageViewer";

import "swiper/css";

type ImageGalleryProps = {
  images: (string | ImageInfo)[];
  alt?: string;
  article?: ArticleDetail;
};

export function ImageGallery({
  images,
  alt = "Gallery image",
  article,
}: ImageGalleryProps) {
  const t = useTranslations("imageGallery");
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbCanScrollPrev, setThumbCanScrollPrev] = useState(false);
  const [thumbCanScrollNext, setThumbCanScrollNext] = useState(false);
  const [thumbHasOverflow, setThumbHasOverflow] = useState(false);
  const [overflowingIndexes, setOverflowingIndexes] = useState<number[]>([]);
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollAdjustTopRef = useRef<number | null>(null);

  // Convert images to URLs for display
  const imageUrls = images.map((img) =>
    typeof img === "string" ? img : getImageUrl(img, "large"),
  );
  const thumbnailUrls = images.map((img) =>
    typeof img === "string" ? img : getImageUrl(img, "thumb"),
  );
  // Original URLs for ImageViewer
  const originalUrls = images.map((img) =>
    typeof img === "string" ? img : getImageUrl(img, "original"),
  );

  const syncThumbNavState = (swiper: SwiperType) => {
    const wrapperWidth = swiper.wrapperEl?.scrollWidth || 0;
    const containerWidth = swiper.el?.clientWidth || swiper.width || 0;
    const hasOverflow = wrapperWidth > containerWidth + 1;

    setThumbHasOverflow(hasOverflow);
    setThumbCanScrollPrev(hasOverflow && !swiper.isBeginning);
    setThumbCanScrollNext(hasOverflow && !swiper.isEnd);
  };

  useEffect(() => {
    if (!thumbsSwiper || thumbsSwiper.destroyed) return;

    const updateOverflow = () => {
      syncThumbNavState(thumbsSwiper);
    };

    updateOverflow();
    thumbsSwiper.on("resize", updateOverflow);
    thumbsSwiper.on("update", updateOverflow);

    return () => {
      thumbsSwiper.off("resize", updateOverflow);
      thumbsSwiper.off("update", updateOverflow);
    };
  }, [thumbsSwiper]);

  useEffect(() => {
    setOverflowingIndexes([]);
  }, [images]);

  const captureGalleryViewportTop = () => {
    if (typeof window === "undefined") {
      return;
    }

    pendingScrollAdjustTopRef.current =
      galleryRef.current?.getBoundingClientRect().top ?? null;
  };

  const restoreGalleryViewportTop = () => {
    if (
      typeof window === "undefined" ||
      pendingScrollAdjustTopRef.current === null
    ) {
      return;
    }

    window.requestAnimationFrame(() => {
      const nextTop = galleryRef.current?.getBoundingClientRect().top;

      if (typeof nextTop === "number") {
        const delta = nextTop - pendingScrollAdjustTopRef.current!;

        if (Math.abs(delta) > 1) {
          window.scrollBy({ top: delta, left: 0, behavior: "auto" });
        }
      }

      pendingScrollAdjustTopRef.current = null;
    });
  };

  if (!images || !Array.isArray(images) || images.length === 0) return null;

  if (images.length === 1) {
    const imgUrl =
      typeof images[0] === "string"
        ? images[0]
        : getImageUrl(images[0], "small");

    return (
      <>
        <div
          className="relative w-full cursor-pointer overflow-hidden rounded-xl group [overflow-anchor:none]"
          onClick={() => {
            setActiveIndex(0);
            setViewerVisible(true);
          }}
        >
          <ImageWithFallback
            src={imgUrl}
            quality={95}
            className=" w-full h-auto"
            alt={alt}
            sizes="(max-width: 1280px) 100vw, 1280px"
            preload
          />
          <div className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white opacity-85 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <Fullscreen size={14} />
            <span>{t("viewFullImage")}</span>
          </div>
        </div>
        {viewerVisible && (
          <ImageViewer
            article={article}
            images={originalUrls}
            initialIndex={activeIndex}
            enableSidePanel={false}
            visible={viewerVisible}
            onClose={() => setViewerVisible(false)}
            alt={alt}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        ref={galleryRef}
        className="w-full min-w-0 space-y-2 [overflow-anchor:none]"
      >
        <div className="relative mx-auto w-full min-w-0 overflow-hidden">
          {thumbHasOverflow && thumbCanScrollPrev ? (
            <button
              type="button"
              aria-label={t("scrollThumbnailsLeft")}
              className="absolute left-2 top-1/2 z-8 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-opacity hover:bg-black/70"
              onClick={() => thumbsSwiper?.slidePrev()}
            >
              <ChevronLeft size={18} />
            </button>
          ) : null}
          <Swiper
            onSwiper={(swiper) => {
              setThumbsSwiper(swiper);
              syncThumbNavState(swiper);
            }}
            modules={[FreeMode]}
            spaceBetween={8}
            slidesPerView="auto"
            freeMode={{
              enabled: true,
              momentum: false,
              momentumBounce: false,
              sticky: false,
            }}
            resistanceRatio={0}
            watchSlidesProgress
            onSlideChange={syncThumbNavState}
            onReachBeginning={syncThumbNavState}
            onReachEnd={syncThumbNavState}
            onFromEdge={syncThumbNavState}
            className="thumbs-swiper w-full min-w-0 max-w-full overflow-hidden!"
          >
            {thumbnailUrls.map((imageUrl, index) => (
              <SwiperSlide
                key={`thumb-${index}`}
                className="shrink-0 size-26! md:size-32!"
              >
                <div
                  className="relative h-full w-full cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 transition-colors hover:border-primary"
                  onClick={() => mainSwiper?.slideTo(index)}
                >
                  <ImageWithFallback
                    src={imageUrl}
                    fill
                    quality={95}
                    loading="eager"
                    sizes="(max-width: 768px) 100px, 128px"
                    className="object-cover"
                    alt={`${alt} thumbnail ${index + 1}`}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {thumbHasOverflow && thumbCanScrollNext ? (
            <button
              type="button"
              aria-label={t("scrollThumbnailsRight")}
              className="absolute right-2 top-1/2 z-8 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-opacity hover:bg-black/70"
              onClick={() => thumbsSwiper?.slideNext()}
            >
              <ChevronRight size={18} />
            </button>
          ) : null}
        </div>

        <div className="w-full min-w-0 overflow-hidden rounded-xl">
          <Swiper
            autoHeight
            className="main-swiper w-full"
            onSwiper={setMainSwiper}
            onBeforeTransitionStart={captureGalleryViewportTop}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.activeIndex);
              if (thumbsSwiper && !thumbsSwiper.destroyed) {
                thumbsSwiper.slideTo(swiper.activeIndex);
                syncThumbNavState(thumbsSwiper);
              }
            }}
            onSlideChangeTransitionEnd={restoreGalleryViewportTop}
          >
            {imageUrls.map((imageUrl, index) => (
              <SwiperSlide
                key={`main-${index}`}
                className="relative h-auto! group"
              >
                <div
                  className="relative max-h-226 cursor-pointer overflow-hidden"
                  onClick={() => setViewerVisible(true)}
                >
                  <ImageWithFallback
                    src={imageUrl}
                    width={0}
                    height={0}
                    quality={95}
                    preload={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    className="h-auto w-full object-contain"
                    alt={`${alt} ${index + 1}`}
                    sizes="(max-width: 1280px) 100vw, 1920px"
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      const exceedsMaxHeight = img.clientHeight > 904;

                      setOverflowingIndexes((previous) => {
                        const hasIndex = previous.includes(index);
                        if (exceedsMaxHeight && !hasIndex) {
                          return [...previous, index];
                        }
                        if (!exceedsMaxHeight && hasIndex) {
                          return previous.filter((item) => item !== index);
                        }
                        return previous;
                      });
                    }}
                  />
                  {overflowingIndexes.includes(index) && (
                    <div className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white opacity-85 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <Fullscreen size={14} />
                      <span>{t("viewFullImage")}</span>
                    </div>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      {viewerVisible && (
        <ImageViewer
          article={article}
          images={originalUrls}
          initialIndex={activeIndex}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
          alt={alt}
        />
      )}
    </>
  );
}
