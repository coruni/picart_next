"use client";

import { cn } from "@/lib";
import { ChevronLeft, ChevronRight, Fullscreen, RotateCcwSquare, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import Viewer from "react-viewer";
import { ToolbarConfig } from "react-viewer/lib/ViewerProps";

type ImageViewerProps = {
    images: string[];
    initialIndex?: number;
    visible: boolean;
    onClose: () => void;
    onChange?: (activeImage: any, index: number) => void;
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
    const viewerImages = images.map((src) => ({ src, alt }));
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [currentIndex, setCurrentIndex] = useState(initialIndex + 1);
    const [isFitScreen, setIsFitScreen] = useState(true);
    const scrollPositionRef = useRef(0);
    const isCleaningRef = useRef(false);

    // 彻底清理函数
    const cleanupViewer = useCallback(() => {
        if (isCleaningRef.current) return;
        isCleaningRef.current = true;

        // 恢复滚动
        const scrollY = scrollPositionRef.current;
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('position');
        document.body.style.removeProperty('top');
        document.body.style.removeProperty('width');
        
        if (scrollY > 0) {
            window.scrollTo(0, scrollY);
        }

        // 清理所有 react-viewer 相关的 DOM 元素
        requestAnimationFrame(() => {
            const selectors = [
                '.react-viewer-transition',
                '.react-viewer-canvas',
                '.react-viewer-backdrop',
                '.react-viewer-mask',
                '.react-viewer-footer',
                '.react-viewer-close',
                '.react-viewer-inline',
                '[class*="react-viewer"]'
            ];

            selectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        try {
                            // 只使用 remove() 方法，更安全
                            if (el && typeof el.remove === 'function') {
                                el.remove();
                            }
                        } catch (e) {
                            // 忽略单个元素的移除错误
                        }
                    });
                } catch (e) {
                    // 忽略 querySelectorAll 错误
                }
            });

            // 延迟重置清理标志
            setTimeout(() => {
                isCleaningRef.current = false;
            }, 100);
        });
    }, []);

    // 包装 onClose 函数
    const handleClose = useCallback(() => {
        // 先让 react-viewer 自己清理
        onClose();
        
        // 延迟进行额外清理，确保 react-viewer 完成自己的清理
        setTimeout(() => {
            cleanupViewer();
        }, 100);
    }, [onClose, cleanupViewer]);

    // 处理滚动锁定
    useEffect(() => {
        if (visible) {
            // 保存当前滚动位置
            scrollPositionRef.current = window.scrollY;
            
            // 禁用 body 滚动
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollPositionRef.current}px`;
            document.body.style.width = '100%';
            
            // 重置状态
            setActiveIndex(initialIndex);
            setCurrentIndex(initialIndex + 1);
            setIsFitScreen(true);
            isCleaningRef.current = false;
        }

        return () => {
            if (!visible) {
                cleanupViewer();
            }
        };
    }, [visible, initialIndex, cleanupViewer]);

    // 组件卸载时的最终清理
    useEffect(() => {
        return () => {
            cleanupViewer();
        };
    }, [cleanupViewer]);

    // 切换适应屏幕/恢复缩放
    const handleToggleFitScreen = () => {
        const img = document.querySelector('.react-viewer-image') as HTMLImageElement;
        if (!img) return;

        const resetBtn = document.querySelector('[data-key="reset"]') as HTMLElement;
        if (resetBtn) {
            resetBtn.click();
        }
        setIsFitScreen(!isFitScreen);
    };

    const handlePrevImage = () => {
        setActiveIndex(prev => {
            const newIndex = prev > 0 ? prev - 1 : images.length - 1;
            setCurrentIndex(newIndex + 1);
            return newIndex;
        });
    };

    const handleNextImage = () => {
        setActiveIndex(prev => {
            const newIndex = prev < images.length - 1 ? prev + 1 : 0;
            setCurrentIndex(newIndex + 1);
            return newIndex;
        });
    };

    const customToolbar = (defaultToolbars: ToolbarConfig[]): ToolbarConfig[] => {
        const getDefaultAction = (key: string) => {
            return defaultToolbars.find(t => t.key === key);
        };

        const baseClassName = "text-white flex items-center justify-center h-6 w-6 hover:bg-[#343746] rounded-md hover:text-primary"
        
        return [
            {
                key: 'prev',
                render: (
                    <div className={cn(baseClassName)}>
                        <ChevronLeft size={20} />
                    </div>
                ),
                onClick: handlePrevImage,
            },
            {
                key: 'index',
                render: (
                    <div className="w-auto h-6 text-center font-bold ">
                        <span className="leading-6">{currentIndex} / {images.length}</span>
                    </div>
                ),
            },
            {
                key: 'next',
                render: (
                    <div className={cn(baseClassName)}>
                        <ChevronRight size={20} />
                    </div>
                ),
                onClick: handleNextImage,
            },
            {
                key: 'zoomOut',
                actionType: getDefaultAction('zoomOut')?.actionType,
                render: (
                    <div className={cn(baseClassName)}>
                        <ZoomOut size={20} />
                    </div>
                ),
            },
            {
                key: 'reset',
                actionType: getDefaultAction('reset')?.actionType,
                render: (
                    <div className="w-auto h-6 text-center font-bold px-2" data-key="reset">
                        <span className="leading-6">100%</span>
                    </div>
                ),
            },
            {
                key: 'zoomIn',
                actionType: getDefaultAction('zoomIn')?.actionType,
                render: (
                    <div className={cn(baseClassName)}>
                        <ZoomIn size={20} />
                    </div>
                ),
            },
            {
                key: 'rotateLeft',
                actionType: getDefaultAction('rotateLeft')?.actionType,
                render: (
                    <div className={cn(baseClassName)}>
                        <RotateCcwSquare size={20} />
                    </div>
                ),
            },
            {
                key: 'fitScreen',
                render: (
                    <div className={cn(baseClassName)}>
                        <Fullscreen size={20} />
                    </div>
                ),
                onClick: handleToggleFitScreen,
            },
        ];
    };

    return (
        <>
            {visible && (
                <Viewer
                    visible={visible}
                    onClose={handleClose}
                    images={viewerImages}
                    activeIndex={activeIndex}
                    onChange={(activeImage, index) => {
                        setActiveIndex(index);
                        setCurrentIndex(index + 1);
                        onChange?.(activeImage, index);
                    }}
                    downloadable
                    downloadInNewWindow
                    zoomSpeed={0.3}
                    attribute={false}
                    noNavbar={false}
                    noImgDetails={false}
                    noToolbar={false}
                    showTotal={true}
                    rotatable={true}
                    scalable={true}
                    loop={true}
                    disableMouseZoom={false}
                    noClose={false}
                    defaultScale={1}
                    minScale={0.5}
                    maxScale={3}
                    customToolbar={customToolbar}
                />
            )}

            {/* 图片上的左右导航按钮 */}
            {visible && images.length > 1 && (
                <>
                    <button
                        onClick={handlePrevImage}
                        className="fixed top-1/2 left-[120px] -translate-y-1/2 z-1006  cursor-pointer hover:bg-primary bg-black/50 text-white rounded-full p-3 transition-all duration-200 backdrop-blur-sm"
                        aria-label="Previous image"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={handleNextImage}
                        className="fixed top-1/2 -translate-y-1/2 right-[120px] z-1006  cursor-pointer hover:bg-primary bg-black/50 text-white rounded-full p-3 transition-all duration-200 backdrop-blur-sm"
                        aria-label="Next image"
                    >
                        <ChevronRight size={24} />
                    </button>
                </>
            )}
        </>
    );
}