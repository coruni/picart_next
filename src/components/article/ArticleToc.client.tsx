"use client";

import { cn } from "@/lib";
import { ChevronDown, ChevronLeft, ListTree } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

export type ArticleTocItem = {
  id: string;
  level: number;
  title: string;
};

type ArticleTocProps = {
  items: ArticleTocItem[];
  title: string;
  openLabel: string;
};

const MOBILE_TOC_ANIMATION_MS = 300;
const TOC_SCROLL_OFFSET = 132;

function scrollToHeading(id: string, behavior: ScrollBehavior = "smooth") {
  const element = document.getElementById(id);
  if (!element) {
    return false;
  }

  const top =
    window.scrollY + element.getBoundingClientRect().top - TOC_SCROLL_OFFSET;

  window.scrollTo({
    top: Math.max(top, 0),
    behavior,
  });

  return true;
}

function TocNav({
  items,
  title,
  activeId,
  onItemClick,
  showTitle = true,
  collapsed = false,
  onToggleCollapsed,
  enableCollapse = true,
}: {
  items: ArticleTocItem[];
  title: string;
  activeId: string | null;
  onItemClick: (id: string) => void;
  showTitle?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  enableCollapse?: boolean;
}) {
  const lastTouchHandledRef = useRef<{
    id: string;
    timestamp: number;
  } | null>(null);
  const [collapsedItemIds, setCollapsedItemIds] = useState<string[]>([]);

  const childMap = useMemo(() => {
    const nextChildMap = new Map<string, boolean>();

    items.forEach((item, index) => {
      const nextItem = items[index + 1];
      nextChildMap.set(item.id, Boolean(nextItem && nextItem.level > item.level));
    });

    return nextChildMap;
  }, [items]);

  const hiddenItemIds = useMemo(() => {
    const collapsedStack: number[] = [];
    const hiddenIds = new Set<string>();

    items.forEach((item) => {
      while (
        collapsedStack.length > 0 &&
        item.level <= collapsedStack[collapsedStack.length - 1]
      ) {
        collapsedStack.pop();
      }

      const hidden = collapsedStack.length > 0;
      if (hidden) {
        hiddenIds.add(item.id);
        return;
      }

      if (collapsedItemIds.includes(item.id)) {
        collapsedStack.push(item.level);
      }
    });

    return hiddenIds;
  }, [collapsedItemIds, items]);

  useEffect(() => {
    setCollapsedItemIds((previous) =>
      previous.filter((id) => items.some((item) => item.id === id)),
    );
  }, [items]);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    id: string,
  ) => {
    event.preventDefault();
    lastTouchHandledRef.current = {
      id,
      timestamp: Date.now(),
    };
    onItemClick(id);
  };

  const handleKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    id: string,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onItemClick(id);
  };

  const handleClick = (id: string) => {
    const lastHandled = lastTouchHandledRef.current;
    if (
      lastHandled &&
      lastHandled.id === id &&
      Date.now() - lastHandled.timestamp < 500
    ) {
      return;
    }

    onItemClick(id);
  };

  const toggleItemCollapsed = (id: string) => {
    setCollapsedItemIds((previous) =>
      previous.includes(id)
        ? previous.filter((currentId) => currentId !== id)
        : [...previous, id],
    );
  };

  return (
    <div className="rounded-xl  bg-card ">
      {showTitle && (
        <div className="flex items-center justify-between p-3">
          <button
            type="button"
            onClick={enableCollapse ? onToggleCollapsed : undefined}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 text-left",
              enableCollapse &&
                "rounded-lg transition-colors hover:text-foreground",
            )}
          >
            <ListTree size={16} className="text-secondary" />
            <div className=" text-sm font-semibold text-foreground">{title}</div>
          </button>
          {enableCollapse && onToggleCollapsed ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={collapsed ? "Expand toc" : "Collapse toc"}
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  collapsed ? "-rotate-90" : "rotate-0",
                )}
              />
            </button>
          ) : null}
        </div>
      )}

      <nav
        className={cn(
          "space-y-1.5 overflow-y-auto px-3 transition-[max-height,opacity,padding] duration-200",
          enableCollapse && collapsed
            ? "max-h-0 pb-0 opacity-0"
            : "max-h-[70vh] pb-3 opacity-100",
        )}
      >
        {items.map((item) => {
          const hidden = hiddenItemIds.has(item.id);

          return (
          <div
            key={item.id}
            className={cn(
              "flex w-full items-start gap-2 overflow-hidden rounded-md px-3 text-sm transition-[max-height,opacity,padding,margin] duration-200 ease-out",
              item.level === 1 && "font-medium",
              item.level > 1 && "text-muted-foreground",
              item.level === 2 && "pl-6",
              item.level === 3 && "pl-9",
              item.level >= 4 && "pl-12",
              activeId === item.id && "bg-primary/15 text-primary",
              hidden
                ? "pointer-events-none max-h-0 py-0 opacity-0"
                : "max-h-16 py-2 opacity-100",
            )}
          >
            {childMap.get(item.id) ? (
              <button
                type="button"
                onClick={() => toggleItemCollapsed(item.id)}
                className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                aria-label={
                  collapsedItemIds.includes(item.id)
                    ? "Expand section"
                    : "Collapse section"
                }
              >
                <ChevronDown
                  className={cn(
                    "size-3 transition-transform duration-200",
                    collapsedItemIds.includes(item.id)
                      ? "-rotate-90"
                      : "rotate-0",
                  )}
                />
              </button>
            ) : (
              <span className="size-4 shrink-0" />
            )}
            <button
              type="button"
              onPointerDown={(event) => handlePointerDown(event, item.id)}
              onKeyDown={(event) => handleKeyDown(event, item.id)}
              onClick={() => handleClick(item.id)}
              className="flex min-w-0 flex-1 touch-manipulation items-start text-left hover:text-primary"
            >
              <span className="line-clamp-2">{item.title}</span>
            </button>
          </div>
          );
        })}
      </nav>
    </div>
  );
}

export function ArticleToc({ items, title, openLabel }: ArticleTocProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMounted, setMobileMounted] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const [resolvedItems, setResolvedItems] = useState(items);
  const resolveItemsFrameRef = useRef<number | null>(null);
  const ids = useMemo(() => items.map((item) => item.id), [items]);

  const resolveHeadingItems = useCallback(() => {
    setResolvedItems((previous) => {
      const nextItems = items.map((item) => {
        const element = document.getElementById(item.id);
        const nextTitle = element?.textContent?.replace(/\s+/g, " ").trim();

        return {
          ...item,
          title:
            nextTitle ||
            (previous.find((previousItem) => previousItem.id === item.id)
              ?.title ??
              item.title),
        };
      });

      const hasChanged = nextItems.some(
        (item, index) => item.title !== previous[index]?.title,
      );

      return hasChanged ? nextItems : previous;
    });
  }, [items]);

  useEffect(() => {
    setResolvedItems(items);
  }, [items]);

  useEffect(() => {
    if (mobileOpen) {
      setMobileMounted(true);
      let nextFrame = 0;
      const frame = window.requestAnimationFrame(() => {
        nextFrame = window.requestAnimationFrame(() => {
          setMobileVisible(true);
        });
      });

      return () => {
        window.cancelAnimationFrame(frame);
        if (nextFrame) {
          window.cancelAnimationFrame(nextFrame);
        }
      };
    }

    setMobileVisible(false);

    if (!mobileMounted) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMobileMounted(false);
    }, MOBILE_TOC_ANIMATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [mobileMounted, mobileOpen]);

  useEffect(() => {
    if (!mobileMounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMounted]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMobileOpen(false);
      }
    };

    if (mediaQuery.matches) {
      setMobileOpen(false);
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (!mobileMounted) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMounted]);

  useEffect(() => {
    if (items.length === 0 || typeof window === "undefined") {
      return;
    }

    resolveHeadingItems();

    const headingElements = ids
      .map((id) => document.getElementById(id))
      .filter(
        (element): element is HTMLElement => element instanceof HTMLElement,
      );

    const mutationObserver = new MutationObserver(() => {
      if (resolveItemsFrameRef.current !== null) {
        window.cancelAnimationFrame(resolveItemsFrameRef.current);
      }

      resolveItemsFrameRef.current = window.requestAnimationFrame(() => {
        resolveHeadingItems();
        resolveItemsFrameRef.current = null;
      });
    });
    headingElements.forEach((element) => {
      mutationObserver.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });

    const initialHash = decodeURIComponent(
      window.location.hash.replace(/^#/, ""),
    );
    if (initialHash) {
      setActiveId(initialHash);
      const frame = window.requestAnimationFrame(() => {
        scrollToHeading(initialHash, "auto");
      });

      return () => {
        mutationObserver.disconnect();
        if (resolveItemsFrameRef.current !== null) {
          window.cancelAnimationFrame(resolveItemsFrameRef.current);
          resolveItemsFrameRef.current = null;
        }
        window.cancelAnimationFrame(frame);
      };
    }

    setActiveId(items[0]?.id ?? null);
    return () => {
      mutationObserver.disconnect();
      if (resolveItemsFrameRef.current !== null) {
        window.cancelAnimationFrame(resolveItemsFrameRef.current);
        resolveItemsFrameRef.current = null;
      }
    };
  }, [ids, items, resolveHeadingItems]);

  useEffect(() => {
    if (resolvedItems.length === 0) {
      return;
    }

    const headings = ids
      .map((id) => document.getElementById(id))
      .filter(
        (element): element is HTMLElement => element instanceof HTMLElement,
      );

    if (headings.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (entryA, entryB) =>
              entryB.intersectionRatio - entryA.intersectionRatio,
          );

        if (visible[0]?.target instanceof HTMLElement) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-140px 0px -55% 0px",
        threshold: [0, 0.2, 0.4, 0.7, 1],
      },
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [ids, resolvedItems.length]);

  const handleItemClick = useCallback((id: string) => {
    const exists = document.getElementById(id);
    if (!exists) {
      return;
    }

    scrollToHeading(id);
    window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
    setActiveId(id);
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div className="hidden lg:block sticky top-header">
        <TocNav
          items={resolvedItems}
          title={title}
          activeId={activeId}
          onItemClick={handleItemClick}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((previous) => !previous)}
          enableCollapse
        />
      </div>

      <button
        type="button"
        aria-label={openLabel}
        onClick={() => setMobileOpen(true)}
        className="inline-flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
      >
        <ListTree className="size-4" />
      </button>

      {mobileMounted
        ? createPortal(
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                aria-label={openLabel}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "absolute inset-0 bg-black/50 transition-opacity duration-300",
                  mobileVisible ? "opacity-100" : "opacity-0",
                )}
              />
              <div
                className={cn(
                  "absolute left-0 top-0 h-dvh w-[min(20rem,calc(100vw-2rem))] overflow-hidden  border-r border-border bg-card shadow-xl transition-transform duration-300",
                  mobileVisible ? "translate-x-0" : "-translate-x-full",
                )}
              >
                <div className="flex h-full flex-col bg-card">
                  <div className="flex h-14 items-center justify-between border-b border-border px-4 mb-2">
                    <div className="text-sm font-semibold text-foreground">
                      {title}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <TocNav
                      items={resolvedItems}
                      title={title}
                      activeId={activeId}
                      onItemClick={handleItemClick}
                      showTitle={false}
                      enableCollapse={false}
                    />
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
