"use client";

import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { ArticleDetail } from "@/types";
import { getImageUrl, type ImageInfo } from "@/types/image";
import { ChevronLeft, ChevronRight, Fullscreen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { FreeMode, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ImageViewer } from "./ImageViewer";

import "swiper/css";
import "swiper/css/thumbs";

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
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbCanScrollPrev, setThumbCanScrollPrev] = useState(false);
  const [thumbCanScrollNext, setThumbCanScrollNext] = useState(false);
  const [thumbHasOverflow, setThumbHasOverflow] = useState(false);
  const [overflowingIndexes, setOverflowingIndexes] = useState<number[]>([]);

  // Convert images to URLs for display
  const imageUrls = images.map((img) =>
    typeof img === "string" ? img : getImageUrl(img, "original"),
  );
  const thumbnailUrls = images.map((img) =>
    typeof img === "string" ? img : getImageUrl(img, "small"),
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

  if (!images || !Array.isArray(images) || images.length === 0) return null;

  if (images.length === 1) {
    const imgUrl =
      typeof images[0] === "string"
        ? images[0]
        : getImageUrl(images[0], "large");

    return (
      <>
        <div
          className="relative w-full cursor-pointer overflow-hidden rounded-xl group"
          onClick={() => {
            setActiveIndex(0);
            setViewerVisible(true);
          }}
        >
          <ImageWithFallback
            src={imgUrl}
            fill
            quality={95}
            className="transition-transform group-hover:scale-105 object-cover"
            alt={alt}
            sizes="(max-width: 1280px) 100vw, 1280px"
            preload
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
            article={article}
            images={imageUrls}
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
      <div className="w-full min-w-0 space-y-2">
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
            {thumbnailUrls.map((imageUrl, index) => (
              <SwiperSlide
                key={`thumb-${index}`}
                style={{ width: "128px", height: "128px" }}
                className="shrink-0"
              >
                <div className="relative h-full w-full cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 transition-colors hover:border-primary">
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
            modules={[Thumbs]}
            thumbs={{
              swiper:
                thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
            }}
            autoHeight
            className="main-swiper w-full"
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
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
          images={imageUrls}
          initialIndex={activeIndex}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
          alt={alt}
        />
      )}
    </>
  );
}
