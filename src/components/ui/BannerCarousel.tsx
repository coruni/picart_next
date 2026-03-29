"use client";

import { cn } from "@/lib";
import Image from "next/image";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { ResolvedBannerItem } from "./Banner";

type BannerCarouselProps = {
  banners: ResolvedBannerItem[];
  className?: string;
  autoplayDelay?: number;
};

export function BannerCarousel({
  banners,
  className,
  autoplayDelay = 4000,
}: BannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-xl", className)}>
      <Swiper
        modules={[Autoplay]}
        slidesPerView={1}
        loop={banners.length > 1}
        autoplay={
          banners.length > 1
            ? {
                delay: autoplayDelay,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
            : false
        }
        onRealIndexChange={(swiper) => {
          setActiveIndex(swiper.realIndex);
        }}
        className="banner-swiper h-full w-full"
      >
        {banners.map((banner, index) => {
          const content = (
            <div className="relative h-full w-full overflow-hidden bg-border cursor-pointer">
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover"
              />
            </div>
          );

          return (
            <SwiperSlide key={`${banner.image}-${index}`}>
              {banner.href ? (
                <a
                  href={banner.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block h-full w-full transition-opacity hover:opacity-90"
                >
                  {content}
                </a>
              ) : (
                content
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>

      {banners.length > 1 ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-[8] flex -translate-x-1/2 items-center gap-2">
          {banners.map((banner, index) => {
            const isActive = index === activeIndex;

            return (
              <div
                key={`${banner.image}-indicator-${index}`}
                className={cn(
                  "relative h-2 overflow-hidden rounded-full transition-all duration-300",
                  isActive ? "w-8 bg-white/15" : "w-2 bg-white/55",
                )}
              >
                {isActive ? (
                  <div
                    key={`progress-${activeIndex}-${autoplayDelay}`}
                    className="absolute inset-0 origin-left rounded-full bg-primary"
                    style={{
                      animation: `bannerIndicatorProgress ${autoplayDelay}ms linear forwards`,
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
