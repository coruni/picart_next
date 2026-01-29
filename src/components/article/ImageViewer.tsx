"use client";

import { useEffect, useRef, useState } from "react";
import Viewer from "viewerjs";
import "viewerjs/dist/viewer.css";

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
    const customToolbar = () => {
        // 上一张按钮
        const prevButtonLi = document.createElement('li');
        const prevButton = document.createElement('button');
    }
    useEffect(() => {
        if (!containerRef.current) return;

        // 初始化 Viewer.js
        viewerRef.current = new Viewer(containerRef.current, {
            inline: false,
            button: false, // 禁用默认的关闭按钮
            navbar: false,
            title: false,
            toolbar: {
                zoomIn: true,
                zoomOut: true,
                reset: false,
                prev: true,
                play: 0,
                next: true,
                oneToOne:true,
                rotateLeft: true,
                rotateRight: 0,
                flipHorizontal: 0,
                flipVertical: 0
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
            viewed() {
                console.log(viewerRef)
                // 图片加载完成后，补偿 right-30 的偏移量
                if (viewerRef.current) {
                    const viewer = viewerRef.current;
                    if (viewer) {
                        // right-30 = 120px，需要将图片向左移动 60px 来居中
                        const offsetX = -120; // 向左偏移 60px (120px / 2)
                        const offsetY = 0;   // 垂直方向不需要偏移

                        // 移动图片来补偿 right-30 的影响
                        viewer.move(offsetX, offsetY);
                    }
                }
            },
            ready() {
                // Viewer 准备就绪
            },
            show() {
                // Viewer 显示时
            },
            shown() {
                // Viewer 显示完成后，添加自定义关闭按钮
                if (viewerRef.current) {
                    const viewer = viewerRef.current;
                    const viewerContainer = viewer?.viewer;

                    // 检查是否已经添加了自定义关闭按钮
                    if (!viewerContainer.querySelector('.custom-close-btn')) {
                        // 创建自定义关闭按钮
                        const closeButton = document.createElement('button');
                        closeButton.className = 'custom-close-btn';
                        closeButton.innerHTML = `
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        `;

                        // 设置按钮样式
                        Object.assign(closeButton.style, {
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            width: '44px',
                            height: '44px',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            border: 'none',
                            borderRadius: '50%',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: '9999',
                            transition: 'background-color 0.2s'
                        });

                        // 添加悬停效果
                        closeButton.addEventListener('mouseenter', () => {
                            closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                        });

                        closeButton.addEventListener('mouseleave', () => {
                            closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                        });

                        // 添加点击事件
                        closeButton.addEventListener('click', () => {
                            viewer.hide();
                        });

                        // 将按钮添加到 viewer 容器
                        viewerContainer.appendChild(closeButton);
                    }
                }
            },
            hide() {
                // Viewer 隐藏时
                onClose();
            },
            hidden() {
                // Viewer 隐藏完成，清理自定义关闭按钮
                if (viewerRef.current) {
                    const viewer = viewerRef.current;
                    const viewerContainer = viewer?.viewer;
                    const customCloseBtn = viewerContainer?.querySelector('.custom-close-btn');
                    if (customCloseBtn) {
                        customCloseBtn.remove();
                    }
                }
                viewerRef.current?.destroy();
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
        </>
    );
}