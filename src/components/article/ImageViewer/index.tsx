"use client";

/* eslint-disable @next/next/no-img-element */

import { cn } from "@/lib";
import { ArticleDetail, ArticleList } from "@/types";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { ComponentType, useCallback, useEffect, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import Viewer from "viewerjs";
import "viewerjs/dist/viewer.css";
import { ImageComment } from "./imageComment";
import { cleanupViewerCustomUI, setupViewerCustomUI } from "./imageViewerUI";

// Global stack to track active ImageViewer instances for ESC key handling
const viewerStack: number[] = [];
let viewerIdCounter = 0;

type Article = ArticleList[number] | ArticleDetail;
type ImageViewerProps = {
  article?: Article;
  images: string[];
  initialIndex?: number;
  initialPanelExpanded?: boolean;
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
  article,
  images,
  initialIndex = 0,
  initialPanelExpanded = false,
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
  const viewerIdRef = useRef<number>(0);
  const mobileHistoryTokenRef = useRef<string | null>(null);
  const mobilePopStateHandlerRef = useRef<(() => void) | null>(null);
  const isClosingFromPopStateRef = useRef(false);

  // Sync pendingIndexRef with initialIndex prop changes
  useEffect(() => {
    pendingIndexRef.current = initialIndex;
  }, [initialIndex]);

  const [panelExpanded, setPanelExpanded] = useState(initialPanelExpanded);
  const [viewerMounted, setViewerMounted] = useState(visible);
  const [panelContentVisible, setPanelContentVisible] = useState(false);
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
    if (!visible) {
      setPanelExpanded(initialPanelExpanded);
      panelExpandedRef.current = initialPanelExpanded;
    }
  }, [initialPanelExpanded, visible]);

  // Defer panel content rendering until panel is expanded
  useEffect(() => {
    if (panelExpanded) {
      setPanelContentVisible(true);
    }
  }, [panelExpanded]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!isMobileViewport()) {
      return;
    }

    if (visible && !mobileHistoryTokenRef.current) {
      const token =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      mobileHistoryTokenRef.current = token;
      window.history.pushState(
        { ...(window.history.state ?? {}), __imageViewerToken: token },
        "",
      );

      const handlePopState = () => {
        if (!mobileHistoryTokenRef.current) {
          return;
        }

        mobileHistoryTokenRef.current = null;
        isClosingFromPopStateRef.current = true;
        onCloseRef.current();

        window.setTimeout(() => {
          isClosingFromPopStateRef.current = false;
        }, 0);
      };

      mobilePopStateHandlerRef.current = handlePopState;
      window.addEventListener("popstate", handlePopState);
      return;
    }

    if (!visible && mobileHistoryTokenRef.current) {
      const handlePopState = mobilePopStateHandlerRef.current;
      if (handlePopState) {
        window.removeEventListener("popstate", handlePopState);
        mobilePopStateHandlerRef.current = null;
      }

      const tokenInHistory = mobileHistoryTokenRef.current;
      if (
        tokenInHistory &&
        !isClosingFromPopStateRef.current &&
        window.history.state?.__imageViewerToken === tokenInHistory
      ) {
        mobileHistoryTokenRef.current = null;
        window.history.back();
      }

      return;
    }

    return () => {
      const handlePopState = mobilePopStateHandlerRef.current;
      if (handlePopState) {
        window.removeEventListener("popstate", handlePopState);
        mobilePopStateHandlerRef.current = null;
      }
    };
  }, [visible]);

  const getCurrentIndex = useCallback(() => {
    const viewer = viewerRef.current as Viewer & { index?: number };
    return typeof viewer?.index === "number" ? viewer.index : 0;
  }, []);

  const openViewerInstance = useCallback(
    (index: number) => {
      const safeIndex = getSafeIndex(index);
      pendingIndexRef.current = safeIndex;

      // Defer state update to avoid blocking
      setTimeout(() => {
        setViewerMounted(true);

        if (!viewerRef.current) return;

        requestAnimationFrame(() => {
          if (!viewerRef.current) return;

          if (!isShownRef.current) {
            // First time showing - show() will trigger shown() callback
            // which sets up UI. We need to wait for it to complete before
            // calling view() to switch to the correct image.
            viewerRef.current.show();

            // Defer view() to next-next frame to ensure shown() has completed
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (!viewerRef.current) return;
                viewerRef.current.view(safeIndex);
              });
            });
          } else {
            // Already shown - just switch to the image
            viewerRef.current.view(safeIndex);
          }
        });
      }, 0);
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
    const leftOffset = isMobile ? 0 : 130;
    const rightOffset = isMobile
      ? 0
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

    const offset = isMobileViewport() ? "0px" : "112px";
    const prevButton = container.querySelector(
      ".custom-prev-btn",
    ) as HTMLButtonElement | null;
    const nextButton = container.querySelector(
      ".custom-next-btn",
    ) as HTMLButtonElement | null;

    if (prevButton) prevButton.style.left = offset;
    if (nextButton) nextButton.style.right = offset;
  }, []);

  // Track last active index to avoid updating all thumbnails
  const lastActiveIndexRef = useRef<number>(-1);

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

      // Only update previous and current active thumbnails instead of all
      const lastIndex = lastActiveIndexRef.current;
      if (lastIndex !== -1 && lastIndex !== index) {
        const prevThumbnail = viewerContainer.querySelector(
          `.custom-thumbnail-item[data-index="${lastIndex}"]`,
        ) as HTMLElement | null;
        if (prevThumbnail) {
          prevThumbnail.style.borderColor = "rgba(255, 255, 255, 0.3)";
          prevThumbnail.style.opacity = "0.6";
        }
      }

      const activeThumbnail = viewerContainer.querySelector(
        `.custom-thumbnail-item[data-index="${index}"]`,
      ) as HTMLElement | null;

      if (activeThumbnail) {
        activeThumbnail.style.borderColor = "var(--color-primary)";
        activeThumbnail.style.opacity = "1";

        // Defer scrollIntoView to avoid forced reflow
        requestAnimationFrame(() => {
          activeThumbnail.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        });
      }

      lastActiveIndexRef.current = index;
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

    // Defer DOM update to avoid forced reflow
    requestAnimationFrame(() => {
      const zoomDisplay = container.querySelector(
        ".custom-zoom-display span",
      ) as HTMLSpanElement | null;

      if (zoomDisplay) {
        zoomDisplay.textContent = getZoomPercentage();
      }
    });
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
      ChevronLeft,
      cn(
        "transition-transform ease-out",
        panelExpandedRef.current && "rotate-180",
      ),
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

  const destroyViewerInstance = useCallback((skipHistoryBack = false) => {
    // Remove this viewer from the stack
    if (viewerIdRef.current > 0) {
      const index = viewerStack.indexOf(viewerIdRef.current);
      if (index > -1) {
        viewerStack.splice(index, 1);
      }
      viewerIdRef.current = 0;
    }
    void skipHistoryBack;
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
    if (!visible) return;

    // Store original body styles
    const originalPaddingRight = document.body.style.paddingRight;
    const originalPaddingLeft = document.body.style.paddingLeft;
    const originalOverflow = document.body.style.overflow;

    // Remove padding styles that viewerjs might add
    const observer = new MutationObserver(() => {
      if (document.body.style.paddingRight) {
        document.body.style.paddingRight = "";
      }
      if (document.body.style.paddingLeft) {
        document.body.style.paddingLeft = "";
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      observer.disconnect();
      // Restore original styles
      document.body.style.paddingRight = originalPaddingRight;
      document.body.style.paddingLeft = originalPaddingLeft;
      document.body.style.overflow = originalOverflow;
    };
  }, [visible]);

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
      backdrop: "static",
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
      keyboard: false, // Disable built-in keyboard to handle ESC ourselves
      loop: true,
      url: "data-src",
      container: viewerContainerRef.current,

      shown() {
        isShownRef.current = true;
        setViewerMounted(true);

        // Push this viewer to the stack when shown
        if (viewerIdRef.current === 0) {
          viewerIdCounter += 1;
          viewerIdRef.current = viewerIdCounter;
        }
        const viewerId = viewerIdRef.current;
        if (viewerStack[viewerStack.length - 1] !== viewerId) {
          viewerStack.push(viewerId);
        }

        // Defer non-critical UI setup to next frame
        requestAnimationFrame(() => {
          setupCustomUI();
          applyCanvasLayout();
          // Note: viewer.view() is called by openViewerInstance, not here
          // to avoid duplicate calls and race conditions
        });
      },

      hide() {
        onCloseRef.current();
      },

      hidden() {
        // Remove this viewer from the stack when hidden
        const index = viewerStack.indexOf(viewerIdRef.current);
        if (index > -1) {
          viewerStack.splice(index, 1);
        }
        // Skip history.back() since we're already responding to a hide event
        destroyViewerInstance(true);
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

    openViewerInstance(pendingIndexRef.current);

    // Custom keyboard handler - only react if this viewer is at the top of the stack
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewerStack[viewerStack.length - 1] !== viewerIdRef.current) {
        return;
      }

      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === "ArrowLeft") {
        e.stopPropagation();
        e.preventDefault();
        const currentIndex = getCurrentIndex();
        viewerRef.current?.view(currentIndex <= 0 ? totalImages - 1 : currentIndex - 1);
        return;
      }

      if (e.key === "ArrowRight") {
        e.stopPropagation();
        e.preventDefault();
        const currentIndex = getCurrentIndex();
        viewerRef.current?.view(currentIndex >= totalImages - 1 ? 0 : currentIndex + 1);
        return;
      }

      if (e.key === "ArrowUp") {
        e.stopPropagation();
        e.preventDefault();
        viewerRef.current?.zoom(0.1);
        return;
      }

      if (e.key === "ArrowDown") {
        e.stopPropagation();
        e.preventDefault();
        viewerRef.current?.zoom(-0.1);
      }
    };

    // Add capture phase listener to intercept before viewerjs
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      destroyViewerInstance();
    };
  }, [
    visible,
    images,
    alt,
    openViewerInstance,
    setupCustomUI,
    disposeViewerInstance,
    destroyViewerInstance,
    applyCanvasLayout,
    getSafeIndex,
    getCurrentIndex,
    syncToolbarState,
    totalImages,
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
      <div ref={containerRef} className="hidden">
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
        className={cn(
          "custom-viewer-wrapper fixed inset-0 z-200 flex h-full w-full transition-opacity",
          viewerMounted
            ? "visible opacity-100"
            : "invisible opacity-0",
        )}
      >
        <div
          ref={viewerContainerRef}
          className="relative flex-1 z-1"
          id="left-panel"
        />

        {enableSidePanel && article && (
          <div
            ref={panelRef}
            className={cn(
              "custom-panel relative flex h-screen shrink-0 flex-col overflow-hidden bg-card transition-[width] duration-300 pointer-events-auto z-200",
              panelExpanded ? "w-97.5" : "w-0",
            )}
            id="right-panel"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {panelContentVisible && <ImageComment article={article} commentAvatarClassName="size-8"/>}
          </div>
        )}
      </div>
    </>
  );
}
