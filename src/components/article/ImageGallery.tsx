"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs, FreeMode } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import Image from "next/image";
import { Fullscreen } from "lucide-react";
import  {ImageViewer}  from "./ImageViewer";

// 导入 Swiper 样式
import "swiper/css";
import "swiper/css/thumbs";
import "swiper/css/free-mode";

type ImageGalleryProps = {
    images: string[];
    alt?: string;
};

export function ImageGallery({ images, alt = "Gallery image" }: ImageGalleryProps) {
    const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
    const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    // 确保 images 是有效数组
    if (!images || !Array.isArray(images) || images.length === 0) return null;

    // 单张图片直接显示
    if (images.length === 1) {
        return (
            <>
                <div
                    className="relative w-full rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => {
                        setActiveIndex(0);
                        setViewerVisible(true);
                    }}
                >
                    <Image
                        src={images[0]}
                        width={1280}
                        quality={95}
                        height={800}
                        className="w-full h-auto transition-transform group-hover:scale-105"
                        alt={alt}
                        sizes="(max-width: 1280px) 100vw, 1280px"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                            <Fullscreen size={16} />
                            <span className="text-sm">点击查看</span>
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
            <div className="w-full space-y-2">
                {/* 缩略图 Swiper - 上方，横向滚动 */}
                <div className="max-w-[920px]">
                    <Swiper
                        onSwiper={setThumbsSwiper}
                        modules={[FreeMode, Thumbs]}
                        spaceBetween={8}
                        slidesPerView="auto"
                        freeMode={true}
                        watchSlidesProgress={true}
                        className="thumbs-swiper"
                    >
                        {images.map((image, index) => (
                            <SwiperSlide key={`thumb-${index}`} style={{ width: '128px', height: '128px' }} className="shrink-0">
                                <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors cursor-pointer">
                                    <Image
                                        src={image}
                                        fill
                                        quality={95}
                                        sizes="(max-width: 768px) 100px, 128px"
                                        className="object-cover"
                                        alt={`${alt} thumbnail ${index + 1}`}
                                    />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
                {/* 主图 Swiper - 下方，高度自适应 */}
                <div className="w-full overflow-hidden rounded-xl">
                    <Swiper
                        onSwiper={setMainSwiper}
                        modules={[Thumbs]}
                        thumbs={{
                            swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null
                        }}
                        autoHeight={true}
                        className="main-swiper w-full"
                        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                    >
                        {images.map((image, index) => (
                            <SwiperSlide key={`main-${index}`} className="h-auto! relative group">
                                <div
                                    className="cursor-pointer"
                                    onClick={() => setViewerVisible(true)}
                                >
                                    <Image
                                        src={image}
                                        width={0}
                                        quality={95}
                                        height={0}
                                        className="w-full h-auto object-cover block max-h-[1066px]"
                                        alt={`${alt} ${index + 1}`}
                                        sizes="(max-width: 1280px) 100vw, 1920px"
                                        priority={index === 0}
                                        onLoad={(e) => {
                                            const img = e.currentTarget;
                                            const slide = img.closest('.swiper-slide');
                                            const indicator = slide?.querySelector('.overflow-indicator');
                                            if (indicator && img.naturalHeight > 1066) {
                                                indicator.classList.remove('hidden');
                                            }
                                        }}
                                    />
                                </div>
                                <div className="overflow-indicator absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur-sm hidden [&:not(.hidden)]:flex items-center gap-1.5 pointer-events-none">
                                    <Fullscreen size={14} />
                                    <span>查看完整图片</span>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
            <ImageViewer
                images={images}
                initialIndex={activeIndex}
                visible={viewerVisible}
                onClose={() => setViewerVisible(false)}
                alt={alt}
            />
        </>
    );
}
