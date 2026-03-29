"use client";

import { cn } from "@/lib";
import Image from "next/image";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { ResolvedBannerItem } from "./Banner";

type BannerCarouselProps = {
  banners: ResolvedBannerItem[];
  className?: string;
};

export function BannerCarousel({ banners, className }: BannerCarouselProps) {
  return (
    <div className={cn("h-full w-full overflow-hidden rounded-xl", className)}>
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop={banners.length > 1}
        autoplay={
          banners.length > 1
            ? {
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
            : false
        }
        pagination={{
          clickable: true,
        }}
        className="h-full w-full"
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
    </div>
  );
}
