"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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

const renderIcon = (
  Icon: React.ComponentType<{ size?: number; className?: string }>,
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
}: ImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const viewerRef = useRef<Viewer | null>(null);
  const isShownRef = useRef(false);
  const pendingIndexRef = useRef(initialIndex);
  const panelExpandedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const onChangeRef = useRef(onChange);

  const [panelExpanded, setPanelExpanded] = useState(false);
  const [viewerMounted, setViewerMounted] = useState(visible);
  const totalImages = images.length;
  const customViewerStyles = `
    .viewer-transition {
      transition: all 0.15s !important;
    }

    .custom-panel-toggle-btn {
      position: absolute;
      top: 20px;
      right: 0;
      width: 28px;
      height: 48px;
      background: #ffffff;
      border: none;
      border-radius: 999px 0 0 999px;
      color: #1f2937;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
      padding: 0;
      z-index: 9999;
      transition: background-color 0.2s, color 0.2s, transform 0.2s;
    }

    .custom-panel-toggle-btn::before,
    .custom-panel-toggle-btn::after {
      content: "";
      position: absolute;
      right: 0;
      width: 18px;
      height: 18px;
      pointer-events: none;
    }

    .custom-panel-toggle-btn::before {
      top: -16px;
      background: radial-gradient(
        circle at 100% 100%,
        transparent 18px,
        #ffffff 19px
      );
      transform: rotate(180deg);
    }

    .custom-panel-toggle-btn::after {
      bottom: -16px;
      background: radial-gradient(
        circle at 100% 0,
        transparent 18px,
        #ffffff 19px
      );
      transform: rotate(180deg);
    }

    .custom-panel-toggle-btn:focus,
    .custom-panel-toggle-btn:focus-visible {
      outline: none;
      box-shadow: -4px 8px 18px rgba(0, 0, 0, 0.18);
    }



    .custom-panel-toggle-btn:hover::before {
      background: radial-gradient(
        circle at 100% 100%,
        transparent 18px,
        #f8fafc 19px
      );
      transform: rotate(180deg);
    }

    .custom-panel-toggle-btn:hover::after {
      background: radial-gradient(
        circle at 100% 0,
        transparent 18px,
        #f8fafc 19px
      );
      transform: rotate(180deg);
    }
  `;

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

  const openViewerInstance = useCallback((index: number) => {
    pendingIndexRef.current = index;

    requestAnimationFrame(() => {
      setViewerMounted(true);

      if (!viewerRef.current) return;

      requestAnimationFrame(() => {
        if (!viewerRef.current) return;

        if (!isShownRef.current) {
          viewerRef.current.show();
        } else {
          viewerRef.current.view(index);
        }
      });
    });
  }, []);

  const applyCanvasLayout = useCallback(() => {
    const container = viewerContainerRef.current;
    if (!container) return;

    const canvas = container.querySelector(".viewer-canvas") as HTMLElement | null;
    if (!canvas) return;

    const leftOffset = 130;
    const rightOffset = panelExpandedRef.current ? 486 : 96;

    Object.assign(canvas.style, {
      left: `${leftOffset}px`,
      right: `${rightOffset}px`,
      width: "auto",
    });
  }, []);

  const updateIndexDisplay = useCallback(
    (index: number) => {
      if (!viewerContainerRef.current) return;

      const viewerContainer = viewerContainerRef.current;
      const indexDisplay = viewerContainer.querySelector(
        ".custom-index-display span",
      );

      if (indexDisplay) {
        indexDisplay.textContent = `${index + 1}/${totalImages}`;
      }

      const thumbnails = viewerContainer.querySelectorAll(
        ".custom-thumbnail-item",
      );

      thumbnails.forEach((thumb, i) => {
        const el = thumb as HTMLElement;
        if (i === index) {
          el.style.borderColor = "#3b82f6";
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

  const syncPanelToggleButton = useCallback(() => {
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
      panelExpandedRef.current ? "收起图片信息面板" : "展开图片信息面板",
    );
  }, []);

  const cleanupCustomUI = useCallback(() => {
    const container = viewerContainerRef.current;
    if (!container) return;

    const selectors = [
      ".custom-close-btn",
      ".custom-panel-toggle-btn",
      ".custom-prev-btn",
      ".custom-next-btn",
      ".custom-thumbnail-column",
      ".custom-index-display",
    ];

    selectors.forEach((selector) => {
      container.querySelectorAll(selector).forEach((node) => node.remove());
    });
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

    const viewer = viewerRef.current;
    const container = viewerContainerRef.current;

    applyCanvasLayout();

    if (!container.querySelector(".custom-close-btn")) {
      const closeButton = document.createElement("button");
      closeButton.className = "custom-close-btn";
      closeButton.innerHTML = renderIcon(X);

      Object.assign(closeButton.style, {
        position: "absolute",
        top: "20px",
        right: "112px",
        width: "44px",
        height: "44px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        border: "none",
        borderRadius: "50%",
        color: "white",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "9999",
        transition: "background-color 0.2s",
      });

      closeButton.addEventListener("mouseenter", () => {
        closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      });

      closeButton.addEventListener("mouseleave", () => {
        closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      });

      closeButton.addEventListener("click", () => {
        viewer.hide();
      });

      container.appendChild(closeButton);
    }

    if (!container.querySelector(".custom-panel-toggle-btn")) {
      const panelToggleBtn = document.createElement("button");
      panelToggleBtn.className = "custom-panel-toggle-btn";

      Object.assign(panelToggleBtn.style, {
        padding: "0",
      });

      panelToggleBtn.addEventListener("click", () => {
        setPanelExpanded((prev) => !prev);
      });

      container.appendChild(panelToggleBtn);
    }

    syncPanelToggleButton();

    if (!container.querySelector(".custom-prev-btn")) {
      const prevButton = document.createElement("button");
      prevButton.className = "custom-prev-btn";
      prevButton.innerHTML = renderIcon(ChevronLeft, "", 28);

      Object.assign(prevButton.style, {
        position: "absolute",
        left: "112px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "48px",
        height: "48px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        border: "none",
        borderRadius: "50%",
        color: "white",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "9999",
        transition: "background-color 0.2s",
      });

      prevButton.addEventListener("mouseenter", () => {
        prevButton.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      });

      prevButton.addEventListener("mouseleave", () => {
        prevButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      });

      prevButton.addEventListener("click", () => {
        viewer.prev();
      });

      container.appendChild(prevButton);
    }

    if (!container.querySelector(".custom-next-btn")) {
      const nextButton = document.createElement("button");
      nextButton.className = "custom-next-btn";
      nextButton.innerHTML = renderIcon(ChevronRight, "", 28);

      Object.assign(nextButton.style, {
        position: "absolute",
        right: "112px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "48px",
        height: "48px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        border: "none",
        borderRadius: "50%",
        color: "white",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "9999",
        transition: "background-color 0.2s",
      });

      nextButton.addEventListener("mouseenter", () => {
        nextButton.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      });

      nextButton.addEventListener("mouseleave", () => {
        nextButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      });

      nextButton.addEventListener("click", () => {
        viewer.next();
      });

      container.appendChild(nextButton);
    }

    if (!container.querySelector(".custom-thumbnail-column")) {
      const thumbnailColumn = document.createElement("div");
      thumbnailColumn.className = "custom-thumbnail-column";

      Object.assign(thumbnailColumn.style, {
        position: "absolute",
        right: "16px",
        top: "50%",
        transform: "translateY(-50%)",
        maxHeight: "332px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "12px 8px",
        gap: "12px",
        overflowY: "auto",
        zIndex: "9998",
        scrollbarWidth: "none",
      });

      const size = 60;
      const currentIndex = getCurrentIndex();

      images.forEach((src, idx) => {
        const thumbWrapper = document.createElement("div");
        thumbWrapper.className = "custom-thumbnail-item";
        thumbWrapper.setAttribute("data-index", String(idx));

        Object.assign(thumbWrapper.style, {
          width: `${size}px`,
          height: `${size}px`,
          flexShrink: "0",
          cursor: "pointer",
          borderRadius: "6px",
          overflow: "hidden",
          border: "2px solid",
          borderColor:
            idx === currentIndex ? "#3b82f6" : "rgba(255, 255, 255, 0.3)",
          opacity: idx === currentIndex ? "1" : "0.6",
          transition: "all 0.2s",
          boxSizing: "border-box",
        });

        const thumbImg = document.createElement("img");
        thumbImg.src = src;
        thumbImg.alt = `${alt} ${idx + 1}`;

        Object.assign(thumbImg.style, {
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        });

        thumbWrapper.appendChild(thumbImg);

        thumbWrapper.addEventListener("click", () => {
          viewer.view(idx);
        });

        thumbWrapper.addEventListener("mouseenter", () => {
          const currentIdx = getCurrentIndex();
          if (idx !== currentIdx) {
            thumbWrapper.style.opacity = "0.9";
            thumbWrapper.style.borderColor = "rgba(255, 255, 255, 0.5)";
          }
        });

        thumbWrapper.addEventListener("mouseleave", () => {
          const currentIdx = getCurrentIndex();
          if (idx !== currentIdx) {
            thumbWrapper.style.opacity = "0.6";
            thumbWrapper.style.borderColor = "rgba(255, 255, 255, 0.3)";
          }
        });

        thumbnailColumn.appendChild(thumbWrapper);
      });

      container.appendChild(thumbnailColumn);
    }

    const toolbarList = container.querySelector(".viewer-toolbar ul");
    if (toolbarList && !container.querySelector(".custom-index-display")) {
      const prevBtn = toolbarList.querySelector(".viewer-prev");
      if (prevBtn) {
        const indexDisplay = document.createElement("li");
        indexDisplay.className = "custom-index-display";
        indexDisplay.innerHTML = `<span>1/${totalImages}</span>`;

        Object.assign(indexDisplay.style, {
          width: "auto",
          minWidth: "50px",
          padding: "0 12px",
          color: "white",
          fontSize: "14px",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "default",
          opacity: "1",
        });

        prevBtn.insertAdjacentElement("afterend", indexDisplay);
      }
    }

    updateIndexDisplay(getCurrentIndex());
  }, [
    alt,
    applyCanvasLayout,
    getCurrentIndex,
    images,
    syncPanelToggleButton,
    totalImages,
    updateIndexDisplay,
  ]);

  useEffect(() => {
    if (!visible) {
      requestAnimationFrame(() => {
        destroyViewerInstance();
      });
      return;
    }

    if (!containerRef.current || !viewerContainerRef.current) return;

    disposeViewerInstance();

    const viewerContainer = viewerContainerRef.current;

    viewerRef.current = new Viewer(containerRef.current, {
      inline: false,
      button: false,
      navbar: false,
      title: false,
      toolbar: {
        zoomIn: true,
        zoomOut: true,
        reset: false,
        prev: true,
        play: 0,
        next: true,
        oneToOne: true,
        rotateLeft: true,
        rotateRight: 0,
        flipHorizontal: 0,
        flipVertical: 0,
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
      container: viewerContainer,

      shown() {
        isShownRef.current = true;
        setViewerMounted(true);
        setupCustomUI();
        applyCanvasLayout();

        const index = pendingIndexRef.current ?? initialIndex;

        requestAnimationFrame(() => {
          if (!viewerRef.current) return;
          viewerRef.current.view(index);
          updateIndexDisplay(index);
        });
      },

      hide() {
        onCloseRef.current();
      },

      hidden() {
        destroyViewerInstance();
      },

      view(event) {
        const index = event.detail.index;
        pendingIndexRef.current = index;
        updateIndexDisplay(index);
        onChangeRef.current?.(index);
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
    updateIndexDisplay,
  ]);

  useEffect(() => {
    if (!viewerRef.current || !visible) return;

    openViewerInstance(initialIndex);
  }, [visible, initialIndex, openViewerInstance]);

  useEffect(() => {
    if (!visible || !isShownRef.current) return;

    applyCanvasLayout();
    syncPanelToggleButton();

    const panelEl = panelRef.current;
    if (!panelEl) return;

    const handleTransitionEnd = () => {
      applyCanvasLayout();
      window.dispatchEvent(new Event("resize"));

      const currentIndex = getCurrentIndex();
      requestAnimationFrame(() => {
        viewerRef.current?.view(currentIndex);
        updateIndexDisplay(currentIndex);
      });
    };

    panelEl.addEventListener("transitionend", handleTransitionEnd);

    return () => {
      panelEl.removeEventListener("transitionend", handleTransitionEnd);
    };
  }, [
    panelExpanded,
    visible,
    applyCanvasLayout,
    getCurrentIndex,
    syncPanelToggleButton,
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

        <div
          ref={panelRef}
          className="custom-panel relative flex h-full shrink-0 flex-col overflow-hidden bg-card transition-[width] duration-300"
          id="right-panel"
          style={{ width: panelExpanded ? "390px" : "0" }}
        >
          <div className="border-b border-white/10 p-4">
            <h3 className="text-lg font-medium text-white">图片信息</h3>
          </div>
          <div className="flex-1 overflow-auto p-4 text-white">
            {/* panel content */}
          </div>
        </div>
      </div>
    </>
  );
}
