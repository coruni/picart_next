"use client";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib";
import Image from "next/image";
import { type MouseEvent, useState } from "react";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { ResolvedBannerItem } from "./Banner";

type BannerCarouselProps = {
  banners: ResolvedBannerItem[];
  className?: string;
  autoplayDelay?: number;
};

function BannerImage({ banner }: { banner: ResolvedBannerItem }) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextX = ((event.clientX - rect.left) / rect.width) * 100;
    const nextY = ((event.clientY - rect.top) / rect.height) * 100;

    setPosition({
      x: Math.max(0, Math.min(100, nextX)),
      y: Math.max(0, Math.min(100, nextY)),
    });
  };

  return (
    <div
      className="relative h-full w-full cursor-pointer overflow-hidden bg-border"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setPosition({ x: 50, y: 50 });
      }}
      onMouseMove={handleMouseMove}
    >
      <Image
        src={banner.image}
        alt={banner.title}
        fill
        sizes="(max-width: 768px) 100vw, 320px"
        className={cn("object-cover")}
        style={{
          objectPosition: `${position.x}% ${position.y}%`,
        }}
      />
    </div>
  );
}

export function BannerCarousel({
  banners,
  className,
  autoplayDelay = 4000,
}: BannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-xl",
        className,
      )}
    >
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
          const content = <BannerImage banner={banner} />;

          return (
            <SwiperSlide key={`${banner.image}-${index}`}>
              {banner.href && banner.hrefType === "external" ? (
                <a
                  href={banner.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block h-full w-full transition-opacity hover:opacity-90"
                >
                  {content}
                </a>
              ) : banner.href && banner.hrefType === "internal" ? (
                <Link
                  href={banner.href}
                  className="block h-full w-full transition-opacity hover:opacity-90"
                >
                  {content}
                </Link>
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
