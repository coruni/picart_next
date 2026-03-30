"use client";

import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { cn } from "@/lib";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";

type CommentImageGalleryProps = {
  images: string[];
  imageAltPrefix: string;
  className?: string;
  singleImageClassName?: string;
  multiImageClassName?: string;
  onOpenImageViewer: (images: string[], index?: number) => void;
};

export function CommentImageGallery({
  images,
  imageAltPrefix,
  className,
  singleImageClassName,
  multiImageClassName,
  onOpenImageViewer,
}: CommentImageGalleryProps) {
  const tImageViewer = useTranslations("imageViewer");
  const swiperRef = useRef<SwiperType | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const syncSwiperNavState = (swiper: SwiperType) => {
    const wrapperWidth = swiper.wrapperEl?.scrollWidth || 0;
    const containerWidth = swiper.el?.clientWidth || swiper.width || 0;
    const hasOverflow = wrapperWidth > containerWidth + 1;

    setCanScrollPrev(hasOverflow && !swiper.isBeginning);
    setCanScrollNext(hasOverflow && !swiper.isEnd);
  };

  if (!images.length) {
    return null;
  }

  if (images.length === 1) {
    return (
      <div className={className}>
        <button
          type="button"
          className="inline-block max-w-full cursor-pointer overflow-hidden rounded-2xl bg-muted"
          onClick={() => onOpenImageViewer(images, 0)}
        >
          <ImageWithFallback
            fill
            src={images[0]}
            alt={`${imageAltPrefix} 1`}
            className={cn(
              "block h-auto max-h-45 max-w-full object-contain",
              singleImageClassName,
            )}
          />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("group relative", className)}>
      <Swiper
        modules={[FreeMode]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          requestAnimationFrame(() => {
            syncSwiperNavState(swiper);
          });
        }}
        freeMode={{
          enabled: true,
          sticky: true,
          momentumBounce: false,
        }}
        slidesPerView="auto"
        spaceBetween={12}
        onSlideChange={syncSwiperNavState}
        onResize={syncSwiperNavState}
        onUpdate={syncSwiperNavState}
        onAfterInit={syncSwiperNavState}
        onSetTranslate={syncSwiperNavState}
        onTransitionEnd={syncSwiperNavState}
        onTouchEnd={syncSwiperNavState}
        onSliderMove={syncSwiperNavState}
        onFromEdge={(swiper) => {
          syncSwiperNavState(swiper);
        }}
      >
        {images.map((image, index) => (
          <SwiperSlide
            key={`${imageAltPrefix}-${index}`}
            className="w-auto!"
          >
            <div className="overflow-hidden rounded-2xl bg-muted">
              <button
                type="button"
                className="block cursor-pointer"
                onClick={() => onOpenImageViewer(images, index)}
              >
                <ImageWithFallback
                  src={image}
                  alt={`${imageAltPrefix} ${index + 1}`}
                  width={320}
                  height={180}
                  wrapperClassName="relative block"
                  className={cn(
                    "block h-auto max-h-45 w-auto max-w-none object-contain",
                    multiImageClassName,
                  )}
                />
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      {canScrollPrev ? (
        <button
          type="button"
          className="absolute left-2 top-1/2 z-8 hidden size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 md:group-hover:flex md:group-hover:opacity-100"
          onClick={() => swiperRef.current?.slidePrev()}
          aria-label={tImageViewer("prev")}
        >
          <ChevronLeft className="size-4" />
        </button>
      ) : null}
      {canScrollNext ? (
        <button
          type="button"
          className="absolute right-2 top-1/2 z-8 hidden size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 md:group-hover:flex md:group-hover:opacity-100"
          onClick={() => swiperRef.current?.slideNext()}
          aria-label={tImageViewer("next")}
        >
          <ChevronRight className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
