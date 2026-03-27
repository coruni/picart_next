"use client";

import { RefObject, useEffect, useRef } from "react";

type UseInfiniteScrollObserverOptions = {
  targetRef: RefObject<Element | null>;
  onIntersect: () => void;
  enabled?: boolean;
  root?: Element | null;
  rootRef?: RefObject<Element | null>;
  rootMargin?: string;
  threshold?: number | number[];
};

export function useInfiniteScrollObserver({
  targetRef,
  onIntersect,
  enabled = true,
  root = null,
  rootRef,
  rootMargin = "100px",
  threshold = 0.1,
}: UseInfiniteScrollObserverOptions) {
  const onIntersectRef = useRef(onIntersect);

  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !enabled) return;

    const observerRoot = rootRef?.current ?? root;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          onIntersectRef.current();
        }
      },
      {
        root: observerRoot,
        rootMargin,
        threshold,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [enabled, root, rootRef, rootMargin, targetRef, threshold]);
}
