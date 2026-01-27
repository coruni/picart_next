"use client";

import { useEffect, useRef, useState } from "react";
import Viewer from "viewerjs";
import "viewerjs/dist/viewer.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ImageViewerProps = {
    images: string[];
    initialIndex?: number;
    visible: boolean;
    onClose: () => void;
    onChange?: (index: number) => void;
    alt?: string;
};

export function ImageViewer({
    images,
    initialIndex = 0,
    visible,
    onClose,
    onChange,
    alt = "Image"
}: ImageViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<Viewer | null>(null);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        if (!containerRef.current) return;

        // 初始化 Viewer.js
        viewerRef.current = new Viewer(containerRef.current, {
            inline: false,
            button: true,
            navbar: true,
            title: [1, (_image: HTMLImageElement, imageData: { naturalWidth: number; naturalHeight: number }) => {
                return `${imageData.naturalWidth} × ${imageData.naturalHeight}`;
            }],
            toolbar: {
                zoomIn: true,
                zoomOut: true,
                oneToOne: true,
                reset: true,
                prev: true,
                play: {
                    show: true,
                    size: "large"
                },
                next: true,
                rotateLeft: true,
                rotateRight: true,
                flipHorizontal: true,
                flipVertical: true
            },
            tooltip: true,
            movable: true,
            zoomable: true,
            rotatable: true,
            scalable: true,
            transition: true,
            fullscreen: true,
            keyboard: true,
            loop: true,
            url: "data-src",
            ready() {
                // Viewer 准备就绪
            },
            show() {
                // Viewer 显示时
            },
            shown() {
                // Viewer 显示完成
            },
            hide() {
                // Viewer 隐藏时
                onClose();
            },
            hidden() {
                // Viewer 隐藏完成
            },
            view(event) {
                // 切换图片时
                const index = event.detail.index;
                setCurrentIndex(index);
                if (onChange) {
                    onChange(index);
                }
            }
        });

        return () => {
            // 清理 Viewer 实例
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, [onClose, onChange]);

    useEffect(() => {
        if (!viewerRef.current) return;

        if (visible) {
            // 显示 viewer 并跳转到指定图片
            setCurrentIndex(initialIndex);
            viewerRef.current.view(initialIndex);
        } else {
            // 隐藏 viewer
            viewerRef.current.hide();
        }
    }, [visible, initialIndex]);

    const handlePrevImage = () => {
        if (viewerRef.current) {
            viewerRef.current.prev();
        }
    };

    const handleNextImage = () => {
        if (viewerRef.current) {
            viewerRef.current.next();
        }
    };

    return (
        <>
            <div ref={containerRef} style={{ display: "none" }}>
                {images.map((src, index) => (
                    <img
                        key={index}
                        src={src}
                        data-src={src}
                        alt={`${alt} ${index + 1}`}
                    />
                ))}
            </div>

            {/* 自定义样式 */}
            <style jsx global>{`
                /* 自定义 viewerjs 样式 */
                .viewer-backdrop {
                    background-color: rgba(0, 0, 0, 0.9);
                }

                .viewer-toolbar {
                    background-color: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                }

                .viewer-toolbar > li {
                    background-color: transparent;
                    border-radius: 0.375rem;
                    transition: all 0.2s;
                }

                .viewer-toolbar > li:hover {
                    background-color: rgba(52, 55, 70, 0.8);
                }

                .viewer-button {
                    background-color: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    border-radius: 0.375rem;
                    transition: all 0.2s;
                }

                .viewer-button:hover {
                    background-color: rgba(0, 0, 0, 0.7);
                }

                .viewer-navbar {
                    background-color: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                }

                .viewer-title {
                    color: white;
                    font-weight: 600;
                }
            `}</style>

            {/* 图片上的左右导航按钮 */}
            {visible && images.length > 1 && (
                <>
                    <button
                        onClick={handlePrevImage}
                        className="fixed top-1/2 left-0 md:left-[120px] -translate-y-1/2 z-2001 cursor-pointer hover:bg-primary bg-black/50 text-white rounded-full p-3 transition-all duration-200 backdrop-blur-sm"
                        aria-label="Previous image"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={handleNextImage}
                        className="fixed top-1/2 -translate-y-1/2 right-0 md:right-[120px] z-2001 cursor-pointer hover:bg-primary bg-black/50 text-white rounded-full p-3 transition-all duration-200 backdrop-blur-sm"
                        aria-label="Next image"
                    >
                        <ChevronRight size={24} />
                    </button>
                </>
            )}
        </>
    );
}