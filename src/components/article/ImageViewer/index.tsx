"use client";

/* eslint-disable @next/next/no-img-element */

import { cn } from "@/lib";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ComponentType, useCallback, useEffect, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import Viewer from "viewerjs";
import "viewerjs/dist/viewer.css";
import { customViewerStyles } from "./imageViewerStyles";
import { cleanupViewerCustomUI, setupViewerCustomUI } from "./imageViewerUI";

type ImageViewerProps = {
  images: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
  onChange?: (index: number) => void;
  alt?: string;
  enableSidePanel?: boolean;
};

const renderIcon = (
  Icon: ComponentType<{ size?: number; className?: string }>,
  className?: string,
  size: number = 24,
) => {
  return ReactDOMServer.renderToStaticMarkup(
    <Icon size={size} className={className} />,
  );
};

export function ImageViewer({
  images,
  initialIndex = 0,
  visible,
  onClose,
  onChange,
  alt = "Image",
  enableSidePanel = true,
}: ImageViewerProps) {
  const t = useTranslations("imageViewer");
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const viewerRef = useRef<Viewer | null>(null);
  const isShownRef = useRef(false);
  const pendingIndexRef = useRef(initialIndex);
  const panelExpandedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const onChangeRef = useRef(onChange);
  const resizeFrameRef = useRef<number | null>(null);

  const [panelExpanded, setPanelExpanded] = useState(false);
  const [viewerMounted, setViewerMounted] = useState(visible);
  const totalImages = images.length;

  const isMobileViewport = () => window.innerWidth < 768;

  const getSafeIndex = useCallback(
    (index: number) => {
      if (totalImages <= 0) return 0;
      return Math.min(Math.max(index, 0), totalImages - 1);
    },
    [totalImages],
  );

  useEffect(() => {
    panelExpandedRef.current = panelExpanded;
  }, [panelExpanded]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const getCurrentIndex = useCallback(() => {
    const viewer = viewerRef.current as Viewer & { index?: number };
    return typeof viewer?.index === "number" ? viewer.index : 0;
  }, []);

  const openViewerInstance = useCallback(
    (index: number) => {
      const safeIndex = getSafeIndex(index);
      pendingIndexRef.current = safeIndex;

      requestAnimationFrame(() => {
        setViewerMounted(true);

        if (!viewerRef.current) return;

        requestAnimationFrame(() => {
          if (!viewerRef.current) return;

          if (!isShownRef.current) {
            viewerRef.current.show();
          } else {
            viewerRef.current.view(safeIndex);
          }
        });
      });
    },
    [getSafeIndex],
  );

  const applyCanvasLayout = useCallback(() => {
    const container = viewerContainerRef.current;
    if (!container) return;

    const canvas = container.querySelector(
      ".viewer-canvas",
    ) as HTMLElement | null;
    if (!canvas) return;

    const isMobile = isMobileViewport();
    const leftOffset = isMobile ? 24 : 130;
    const rightOffset = isMobile
      ? 24
      : enableSidePanel && panelExpandedRef.current
        ? 486
        : 96;

    Object.assign(canvas.style, {
      left: `${leftOffset}px`,
      right: `${rightOffset}px`,
      width: "auto",
    });
  }, [enableSidePanel]);

  const applyNavigationButtonLayout = useCallback(() => {
    const container = viewerContainerRef.current;
    if (!container) return;

    const offset = isMobileViewport() ? "24px" : "112px";
    const prevButton = container.querySelector(
      ".custom-prev-btn",
    ) as HTMLButtonElement | null;
    const nextButton = container.querySelector(
      ".custom-next-btn",
    ) as HTMLButtonElement | null;

    if (prevButton) prevButton.style.left = offset;
    if (nextButton) nextButton.style.right = offset;
  }, []);

  const updateIndexDisplay = useCallback(
    (index: number) => {
      const viewerContainer = viewerContainerRef.current;
      if (!viewerContainer) return;

      const indexDisplay = viewerContainer.querySelector(
        ".custom-index-display span",
      ) as HTMLSpanElement | null;

      if (indexDisplay) {
        indexDisplay.textContent = `${index + 1}/${totalImages}`;
      }

      const thumbnails = viewerContainer.querySelectorAll(
        ".custom-thumbnail-item",
      );
      thumbnails.forEach((thumb, i) => {
        const el = thumb as HTMLElement;
        if (i === index) {
          el.style.borderColor = "var(--color-primary)";
          el.style.opacity = "1";
        } else {
          el.style.borderColor = "rgba(255, 255, 255, 0.3)";
          el.style.opacity = "0.6";
        }
      });

      const activeThumbnail = viewerContainer.querySelector(
        `.custom-thumbnail-item[data-index="${index}"]`,
      ) as HTMLElement | null;

      activeThumbnail?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    },
    [totalImages],
  );

  const getZoomPercentage = useCallback(() => {
    const viewer = viewerRef.current as Viewer & {
      imageData?: { ratio?: number };
    };
    const ratio = viewer?.imageData?.ratio ?? 1;
    return `${Math.round(ratio * 100)}%`;
  }, []);

  const syncToolbarState = useCallback(() => {
    const container = viewerContainerRef.current;
    if (!container) return;

    const zoomDisplay = container.querySelector(
      ".custom-zoom-display span",
    ) as HTMLSpanElement | null;

    if (zoomDisplay) {
      zoomDisplay.textContent = getZoomPercentage();
    }
  }, [getZoomPercentage]);

  const syncPanelToggleButton = useCallback(() => {
    if (!enableSidePanel) return;

    const container = viewerContainerRef.current;
    if (!container) return;

    const panelToggleBtn = container.querySelector(
      ".custom-panel-toggle-btn",
    ) as HTMLButtonElement | null;

    if (!panelToggleBtn) return;

    panelToggleBtn.innerHTML = renderIcon(
      panelExpandedRef.current ? ChevronRight : ChevronLeft,
      "",
      18,
    );
    panelToggleBtn.setAttribute(
      "aria-label",
      panelExpandedRef.current ? t("collapsePanel") : t("expandPanel"),
    );
  }, [enableSidePanel, t]);

  const cleanupCustomUI = useCallback(() => {
    const container = viewerContainerRef.current;
    if (!container) return;
    cleanupViewerCustomUI(container);
  }, []);

  const disposeViewerInstance = useCallback(() => {
    cleanupCustomUI();

    if (viewerRef.current) {
      viewerRef.current.destroy();
      viewerRef.current = null;
    }

    isShownRef.current = false;
  }, [cleanupCustomUI]);

  const destroyViewerInstance = useCallback(() => {
    disposeViewerInstance();
    panelExpandedRef.current = false;
    setPanelExpanded(false);
    setViewerMounted(false);
  }, [disposeViewerInstance]);

  const setupCustomUI = useCallback(() => {
    if (!viewerRef.current || !viewerContainerRef.current) return;

    setupViewerCustomUI({
      viewer: viewerRef.current,
      container: viewerContainerRef.current,
      images,
      totalImages,
      alt,
      getCurrentIndex,
      getZoomPercentage,
      applyCanvasLayout,
      applyNavigationButtonLayout,
      updateIndexDisplay,
      syncPanelToggleButton,
      syncToolbarState,
      setPanelExpanded,
      enableSidePanel,
      labels: {
        currentImage: t("currentImage"),
        zoomRatio: t("zoomRatio"),
        prev: t("prev"),
        next: t("next"),
        zoomOut: t("zoomOut"),
        zoomIn: t("zoomIn"),
        fitWidth: t("fitWidth"),
        rotateLeft90: t("rotateLeft90"),
      },
    });
  }, [
    images,
    totalImages,
    alt,
    getCurrentIndex,
    getZoomPercentage,
    applyCanvasLayout,
    applyNavigationButtonLayout,
    updateIndexDisplay,
    syncPanelToggleButton,
    syncToolbarState,
    enableSidePanel,
    t,
  ]);

  useEffect(() => {
    if (enableSidePanel) return;
    panelExpandedRef.current = false;
    setPanelExpanded(false);
  }, [enableSidePanel]);

  useEffect(() => {
    if (!visible) {
      requestAnimationFrame(() => {
        destroyViewerInstance();
      });
      return;
    }

    if (!containerRef.current || !viewerContainerRef.current) return;

    disposeViewerInstance();

    viewerRef.current = new Viewer(containerRef.current, {
      inline: false,
      button: false,
      navbar: false,
      title: false,
      toolbar: {
        zoomIn: 0,
        zoomOut: 0,
        reset: false,
        prev: 0,
        play: 0,
        next: 0,
        oneToOne: 0,
        rotateLeft: 0,
        rotateRight: 0,
        flipHorizontal: 0,
        flipVertical: 0,
      },
      tooltip: false,
      movable: true,
      zoomable: true,
      rotatable: true,
      scalable: true,
      transition: true,
      fullscreen: true,
      keyboard: true,
      loop: true,
      url: "data-src",
      container: viewerContainerRef.current,

      shown() {
        isShownRef.current = true;
        setViewerMounted(true);
        setupCustomUI();
        applyCanvasLayout();

        const safeIndex = getSafeIndex(pendingIndexRef.current ?? initialIndex);
        requestAnimationFrame(() => {
          if (!viewerRef.current) return;
          viewerRef.current.view(safeIndex);
          updateIndexDisplay(safeIndex);
        });
      },

      hide() {
        onCloseRef.current();
      },

      hidden() {
        destroyViewerInstance();
      },

      view(event) {
        const index = getSafeIndex(event.detail.index);
        pendingIndexRef.current = index;
        updateIndexDisplay(index);
        syncToolbarState();
        onChangeRef.current?.(index);
      },

      zoom() {
        syncToolbarState();
      },
    });

    openViewerInstance(pendingIndexRef.current ?? initialIndex);

    return () => {
      destroyViewerInstance();
    };
  }, [
    visible,
    images,
    alt,
    initialIndex,
    openViewerInstance,
    setupCustomUI,
    disposeViewerInstance,
    destroyViewerInstance,
    applyCanvasLayout,
    getSafeIndex,
    syncToolbarState,
    updateIndexDisplay,
  ]);

  useEffect(() => {
    if (!viewerRef.current || !visible) return;
    openViewerInstance(initialIndex);
  }, [visible, initialIndex, openViewerInstance]);

  useEffect(() => {
    if (!enableSidePanel) return;
    if (!visible || !isShownRef.current) return;

    applyCanvasLayout();
    applyNavigationButtonLayout();
    syncPanelToggleButton();

    const panelEl = panelRef.current;
    if (!panelEl) return;

    const handleTransitionEnd = () => {
      applyCanvasLayout();
      applyNavigationButtonLayout();
      updateIndexDisplay(getSafeIndex(getCurrentIndex()));
      window.dispatchEvent(new Event("resize"));
    };

    panelEl.addEventListener("transitionend", handleTransitionEnd);

    return () => {
      panelEl.removeEventListener("transitionend", handleTransitionEnd);
    };
  }, [
    enableSidePanel,
    panelExpanded,
    visible,
    applyCanvasLayout,
    applyNavigationButtonLayout,
    getCurrentIndex,
    getSafeIndex,
    syncPanelToggleButton,
    updateIndexDisplay,
  ]);

  useEffect(() => {
    if (!visible || !viewerRef.current) return;

    const handleResize = () => {
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        applyCanvasLayout();
        applyNavigationButtonLayout();
        updateIndexDisplay(getSafeIndex(getCurrentIndex()));
      });
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [
    visible,
    applyCanvasLayout,
    applyNavigationButtonLayout,
    getCurrentIndex,
    getSafeIndex,
    updateIndexDisplay,
  ]);

  return (
    <>
      <div ref={containerRef} style={{ display: "none" }}>
        {images.map((src, index) => (
          <img
            key={`${src}-${index}`}
            src={src}
            data-src={src}
            alt={`${alt} ${index + 1}`}
          />
        ))}
      </div>

      <div
        className="custom-viewer-wrapper fixed inset-0 flex h-full w-full"
        style={{
          zIndex: 998,
          opacity: viewerMounted ? 1 : 0,
          pointerEvents: viewerMounted ? "auto" : "none",
          visibility: viewerMounted ? "visible" : "hidden",
        }}
      >
        <style>{customViewerStyles}</style>
        <div
          ref={viewerContainerRef}
          className="relative flex-1"
          id="left-panel"
        />

        {enableSidePanel ? (
          <div
            ref={panelRef}
            className={cn(
              "custom-panel relative flex h-full shrink-0 flex-col overflow-hidden bg-card transition-[width] duration-300",
              panelExpanded ? "w-97.5" : "w-0",
            )}
            id="right-panel"
          >
            <div className="border-b border-white/10 p-4">
              <h3 className="text-lg font-medium text-white">{t("panelTitle")}</h3>
            </div>
            <div className="flex-1 overflow-auto p-4 text-white">
              {/* panel content */}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
