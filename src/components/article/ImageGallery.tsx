"use client";

import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { ChevronLeft, ChevronRight, Fullscreen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { FreeMode, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ImageViewer } from "./ImageViewer";

import "swiper/css";
import "swiper/css/thumbs";

type ImageGalleryProps = {
  images: string[];
  alt?: string;
};

export function ImageGallery({
  images,
  alt = "Gallery image",
}: ImageGalleryProps) {
  const t = useTranslations("imageGallery");
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbCanScrollPrev, setThumbCanScrollPrev] = useState(false);
  const [thumbCanScrollNext, setThumbCanScrollNext] = useState(false);

  const syncThumbNavState = (swiper: SwiperType) => {
    setThumbCanScrollPrev(!swiper.isBeginning);
    setThumbCanScrollNext(!swiper.isEnd);
  };

  if (!images || !Array.isArray(images) || images.length === 0) return null;

  if (images.length === 1) {
    return (
      <>
        <div
          className="relative w-full cursor-pointer overflow-hidden rounded-xl group aspect-[4/3]"
          onClick={() => {
            setActiveIndex(0);
            setViewerVisible(true);
          }}
        >
          <ImageWithFallback
            src={images[0]}
            fill
            quality={95}
            className="transition-transform group-hover:scale-105 object-cover"
            alt={alt}
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
            <div className="flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Fullscreen size={16} />
              <span className="text-sm">{t("clickToView")}</span>
            </div>
          </div>
        </div>
        {viewerVisible && (
          <ImageViewer
            images={images}
            initialIndex={activeIndex}
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
      <div className="w-full min-w-0 space-y-2">
        <div className="relative mx-auto w-full min-w-0 overflow-hidden">
          <button
            type="button"
            aria-label={t("scrollThumbnailsLeft")}
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-opacity hover:bg-black/70 disabled:pointer-events-none disabled:opacity-35"
            onClick={() => thumbsSwiper?.slidePrev()}
            disabled={!thumbCanScrollPrev}
          >
            <ChevronLeft size={18} />
          </button>
          <Swiper
            onSwiper={(swiper) => {
              setThumbsSwiper(swiper);
              syncThumbNavState(swiper);
            }}
            modules={[FreeMode, Thumbs]}
            spaceBetween={8}
            slidesPerView="auto"
            freeMode
            watchSlidesProgress
            onSlideChange={syncThumbNavState}
            onReachBeginning={syncThumbNavState}
            onReachEnd={syncThumbNavState}
            onFromEdge={syncThumbNavState}
            className="thumbs-swiper w-full min-w-0 max-w-full overflow-hidden!"
          >
            {images.map((image, index) => (
              <SwiperSlide
                key={`thumb-${index}`}
                style={{ width: "128px", height: "128px" }}
                className="shrink-0"
              >
                <div className="relative h-full w-full cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 transition-colors hover:border-blue-500">
                  <ImageWithFallback
                    src={image}
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
          <button
            type="button"
            aria-label={t("scrollThumbnailsRight")}
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-opacity hover:bg-black/70 disabled:pointer-events-none disabled:opacity-35"
            onClick={() => thumbsSwiper?.slideNext()}
            disabled={!thumbCanScrollNext}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="w-full min-w-0 overflow-hidden rounded-xl">
          <Swiper
            modules={[Thumbs]}
            thumbs={{
              swiper:
                thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
            }}
            autoHeight
            className="main-swiper w-full"
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          >
            {images.map((image, index) => (
              <SwiperSlide
                key={`main-${index}`}
                className="relative h-auto! group"
              >
                <div
                  className="relative max-h-226 cursor-pointer overflow-hidden"
                  onClick={() => setViewerVisible(true)}
                >
                  <ImageWithFallback
                    src={image}
                    width={0}
                    height={0}
                    quality={95}
                    loading="eager"
                    fetchPriority={index === 0 ? "high" : "auto"}
                    className="object-cover"
                    alt={`${alt} ${index + 1}`}
                    sizes="(max-width: 1280px) 100vw, 1920px"
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      const slide = img.closest(".swiper-slide");
                      const indicator = slide?.querySelector(
                        ".overflow-indicator",
                      );
                      if (indicator && img.naturalHeight > 1066) {
                        indicator.classList.remove("hidden");
                      }
                    }}
                  />
                </div>
                <div className="overflow-indicator pointer-events-none absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm [&:not(.hidden)]:flex">
                  <Fullscreen size={14} />
                  <span>{t("viewFullImage")}</span>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      {viewerVisible && (
        <ImageViewer
          images={images}
          initialIndex={activeIndex}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
          alt={alt}
        />
      )}
    </>
  );
}
