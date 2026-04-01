"use client";

import { useEffect, useRef, useState } from "react";

import { NavigationTabs, TabItem } from "@/components/shared";
import { cn } from "@/lib/utils";
import { CategoryDetail } from "@/types";

type ChannelTabsProps = {
  children: CategoryDetail["children"];
  parentId: string;
};

export function ChannelTabs({ children, parentId }: ChannelTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const tabs: TabItem[] = (children || []).map((child) => ({
    label: child.name,
    value: child.id.toString(),
    href: `/channel/${parentId}/${child.id}`,
  }));

  const updateScrollState = () => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = element;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();

    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const handleScroll = () => updateScrollState();
    const resizeObserver = new ResizeObserver(() => updateScrollState());

    element.addEventListener("scroll", handleScroll, { passive: true });
    resizeObserver.observe(element);
    window.addEventListener("resize", updateScrollState);

    return () => {
      element.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [tabs.length]);

  const isActive = (currentPath: string, tabHref: string) => {
    const normalizedPath = currentPath.replace(/^\/(zh|en)/, "");
    const normalizedHref = tabHref.replace(/^\/(zh|en)/, "");
    return normalizedPath === normalizedHref;
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="relative min-w-0 flex-1">
      <div
        ref={scrollRef}
        className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <NavigationTabs
          tabs={tabs}
          isActive={isActive}
          className="min-w-max whitespace-nowrap"
        />
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-8 transition-opacity duration-200",
          "bg-linear-to-r from-card via-card/85 to-transparent",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-8 transition-opacity duration-200",
          "bg-linear-to-l from-card via-card/85 to-transparent",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
