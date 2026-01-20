"use client";

import { useEffect, useState } from "react";

/**
 * 监听滚动是否超过指定阈值
 * @param threshold 滚动阈值（像素）
 * @param enabled 是否启用监听
 * @returns 是否已滚动超过阈值
 */
export function useScrollThreshold(threshold: number = 300, enabled: boolean = true) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setScrolled(false);
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY >= threshold);
    };

    // 初始检查
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold, enabled]);

  return scrolled;
}
