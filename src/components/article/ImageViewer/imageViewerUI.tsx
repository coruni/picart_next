import ReactDOMServer from "react-dom/server";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcwSquare,
  Square,
  X,
} from "lucide-react";
import Viewer from "viewerjs";
import { ComponentType, Dispatch, SetStateAction } from "react";

const renderIcon = (
  Icon: ComponentType<{ size?: number; className?: string }>,
  className?: string,
  size: number = 24,
) => {
  return ReactDOMServer.renderToStaticMarkup(
    <Icon size={size} className={className} />,
  );
};

export function cleanupViewerCustomUI(container: HTMLElement) {
  const selectors = [
    ".custom-close-btn",
    ".custom-panel-toggle-btn",
    ".custom-prev-btn",
    ".custom-next-btn",
    ".custom-thumbnail-column",
    ".custom-index-display",
    ".custom-viewer-toolbar",
  ];

  selectors.forEach((selector) => {
    container.querySelectorAll(selector).forEach((node) => node.remove());
  });
}

type SetupViewerCustomUIOptions = {
  viewer: Viewer;
  container: HTMLElement;
  images: string[];
  totalImages: number;
  alt: string;
  getCurrentIndex: () => number;
  getZoomPercentage: () => string;
  applyCanvasLayout: () => void;
  applyNavigationButtonLayout: () => void;
  updateIndexDisplay: (index: number) => void;
  syncPanelToggleButton: () => void;
  syncToolbarState: () => void;
  setPanelExpanded: Dispatch<SetStateAction<boolean>>;
  enableSidePanel: boolean;
  labels: {
    currentImage: string;
    zoomRatio: string;
    prev: string;
    next: string;
    zoomOut: string;
    zoomIn: string;
    fitWidth: string;
    rotateLeft90: string;
  };
};

export function setupViewerCustomUI(options: SetupViewerCustomUIOptions) {
  const {
    viewer,
    container,
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
    labels,
  } = options;

  applyCanvasLayout();
  applyNavigationButtonLayout();
  const hasMultipleImages = totalImages > 1;

  if (!container.querySelector(".custom-close-btn")) {
    const closeButton = document.createElement("button");
    closeButton.className = "custom-close-btn";
    closeButton.innerHTML = renderIcon(X);

    Object.assign(closeButton.style, {
      position: "absolute",
      top: "20px",
      left: "20px",
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

  if (enableSidePanel && !container.querySelector(".custom-panel-toggle-btn")) {
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

  if (enableSidePanel) {
    syncPanelToggleButton();
  }
  syncToolbarState();

  if (!hasMultipleImages) {
    container
      .querySelectorAll(
        ".custom-prev-btn, .custom-next-btn, .custom-thumbnail-column",
      )
      .forEach((node) => node.remove());
  }

  if (hasMultipleImages && !container.querySelector(".custom-prev-btn")) {
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

  if (hasMultipleImages && !container.querySelector(".custom-next-btn")) {
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

  if (hasMultipleImages && !container.querySelector(".custom-thumbnail-column")) {
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
          idx === currentIndex ? "var(--color-primary)" : "rgba(255, 255, 255, 0.3)",
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

  if (!container.querySelector(".custom-viewer-toolbar")) {
    const toolbar = document.createElement("div");
    toolbar.className = "custom-viewer-toolbar";

    const createToolbarButton = (
      className: string,
      tooltip: string,
      icon: string,
      onClick: () => void,
    ) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `custom-toolbar-button ${className}`;
      button.setAttribute("aria-label", tooltip);
      button.dataset.tooltip = tooltip;
      button.innerHTML = icon;
      button.addEventListener("click", onClick);
      return button;
    };

    const indexDisplay = document.createElement("div");
    indexDisplay.className = "custom-toolbar-value custom-index-display";
    indexDisplay.dataset.tooltip = labels.currentImage;
    indexDisplay.innerHTML = `<span>1/${totalImages}</span>`;

    const zoomDisplay = document.createElement("div");
    zoomDisplay.className = "custom-toolbar-value custom-zoom-display";
    zoomDisplay.dataset.tooltip = labels.zoomRatio;
    zoomDisplay.innerHTML = `<span>${getZoomPercentage()}</span>`;

    if (hasMultipleImages) {
      toolbar.appendChild(
        createToolbarButton(
          "custom-toolbar-prev",
          labels.prev,
          renderIcon(ChevronLeft, "", 18),
          () => viewer.prev(),
        ),
      );
    }
    toolbar.appendChild(indexDisplay);
    if (hasMultipleImages) {
      toolbar.appendChild(
        createToolbarButton(
          "custom-toolbar-next",
          labels.next,
          renderIcon(ChevronRight, "", 18),
          () => viewer.next(),
        ),
      );
    }
    toolbar.appendChild(
      createToolbarButton(
        "custom-toolbar-zoom-out",
        labels.zoomOut,
        renderIcon(Minus, "", 18),
        () => viewer.zoom(-0.1),
      ),
    );
    toolbar.appendChild(zoomDisplay);
    toolbar.appendChild(
      createToolbarButton(
        "custom-toolbar-zoom-in",
        labels.zoomIn,
        renderIcon(Plus, "", 18),
        () => viewer.zoom(0.1),
      ),
    );
    toolbar.appendChild(
      createToolbarButton(
        "custom-toolbar-one-to-one",
        labels.fitWidth,
        renderIcon(Square, "", 16),
        () => {
          const currentViewer = viewer as Viewer & {
            initialImageData?: { ratio?: number };
          };
          viewer.zoomTo(currentViewer?.initialImageData?.ratio ?? 1);
        },
      ),
    );
    toolbar.appendChild(
      createToolbarButton(
        "custom-flip-btn",
        labels.rotateLeft90,
        renderIcon(RotateCcwSquare, "", 18),
        () => viewer.rotate(-90),
      ),
    );
    container.appendChild(toolbar);
  }

  updateIndexDisplay(getCurrentIndex());
  syncToolbarState();
}
