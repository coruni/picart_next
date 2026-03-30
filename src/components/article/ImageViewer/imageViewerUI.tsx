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
    closeButton.className =
      "custom-close-btn absolute left-5 top-5 z-[9999] flex size-11 items-center justify-center rounded-full border-0 bg-black/50 text-white transition-colors hover:bg-black/70";
    closeButton.innerHTML = renderIcon(X);

    closeButton.addEventListener("click", () => {
      viewer.hide();
    });

    container.appendChild(closeButton);
  }

  if (enableSidePanel && !container.querySelector(".custom-panel-toggle-btn")) {
    const panelToggleBtn = document.createElement("button");
    panelToggleBtn.className = "custom-panel-toggle-btn p-0";

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
    prevButton.className =
      "custom-prev-btn absolute left-28 top-1/2 z-[9999] flex size-12 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-black/50 text-white transition-colors hover:bg-black/70";
    prevButton.innerHTML = renderIcon(ChevronLeft, "", 28);

    prevButton.addEventListener("click", () => {
      const currentIndex = getCurrentIndex();
      const targetIndex =
        currentIndex <= 0 ? totalImages - 1 : currentIndex - 1;
      viewer.view(targetIndex);
    });

    container.appendChild(prevButton);
  }

  if (hasMultipleImages && !container.querySelector(".custom-next-btn")) {
    const nextButton = document.createElement("button");
    nextButton.className =
      "custom-next-btn absolute right-28 top-1/2 z-[9999] flex size-12 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-black/50 text-white transition-colors hover:bg-black/70";
    nextButton.innerHTML = renderIcon(ChevronRight, "", 28);

    nextButton.addEventListener("click", () => {
      const currentIndex = getCurrentIndex();
      const targetIndex =
        currentIndex >= totalImages - 1 ? 0 : currentIndex + 1;
      viewer.view(targetIndex);
    });

    container.appendChild(nextButton);
  }

  if (hasMultipleImages && !container.querySelector(".custom-thumbnail-column")) {
    const thumbnailColumn = document.createElement("div");
    thumbnailColumn.className =
      "custom-thumbnail-column absolute right-4 top-1/2 z-[9998] flex max-h-83 -translate-y-1/2 flex-col items-center gap-3 overflow-y-auto rounded-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
    const currentIndex = getCurrentIndex();

    images.forEach((src, idx) => {
      const thumbWrapper = document.createElement("div");
      thumbWrapper.className =
        "custom-thumbnail-item box-border size-15 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 border-solid transition-all";
      thumbWrapper.setAttribute("data-index", String(idx));
      thumbWrapper.style.borderColor =
        idx === currentIndex ? "var(--color-primary)" : "rgba(255, 255, 255, 0.3)";
      thumbWrapper.style.opacity = idx === currentIndex ? "1" : "0.6";

      const thumbImg = document.createElement("img");
      thumbImg.src = src;
      thumbImg.alt = `${alt} ${idx + 1}`;
      thumbImg.className = "block size-full object-cover";

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
          () => {
            const currentIndex = getCurrentIndex();
            const targetIndex =
              currentIndex <= 0 ? totalImages - 1 : currentIndex - 1;
            viewer.view(targetIndex);
          },
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
          () => {
            const currentIndex = getCurrentIndex();
            const targetIndex =
              currentIndex >= totalImages - 1 ? 0 : currentIndex + 1;
            viewer.view(targetIndex);
          },
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
