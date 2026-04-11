"use client";

import { useEffect, useRef, useState } from "react";

type UseScrollThresholdOptions = {
  enabled?: boolean;
  hysteresis?: number;
};

/**
 * Listen for whether the page scroll position has crossed a threshold.
 * `hysteresis` adds a small buffer near the threshold to avoid flicker.
 */
export function useScrollThreshold(
  threshold: number = 300,
  enabledOrOptions: boolean | UseScrollThresholdOptions = true,
) {
  const options =
    typeof enabledOrOptions === "boolean"
      ? { enabled: enabledOrOptions, hysteresis: 0 }
      : enabledOrOptions;
  const enabled = options.enabled ?? true;
  const hysteresis = options.hysteresis ?? 0;

  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(scrolled);
  const thresholdRef = useRef(threshold);
  const hysteresisRef = useRef(hysteresis);

  useEffect(() => {
    scrolledRef.current = scrolled;
  }, [scrolled]);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  useEffect(() => {
    hysteresisRef.current = hysteresis;
  }, [hysteresis]);

  useEffect(() => {
    if (!enabled) {
      scrolledRef.current = false;
      setScrolled(false);
      return;
    }

    let frameId = 0;

    const evaluate = () => {
      frameId = 0;
      const currentThreshold = thresholdRef.current;
      const currentHysteresis = hysteresisRef.current;
      const scrollY = window.scrollY;
      const nextScrolled = scrolledRef.current
        ? scrollY >= currentThreshold - currentHysteresis
        : scrollY >= currentThreshold + currentHysteresis;

      if (nextScrolled !== scrolledRef.current) {
        scrolledRef.current = nextScrolled;
        setScrolled(nextScrolled);
      }
    };

    const requestEvaluate = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(evaluate);
    };

    evaluate();
    window.addEventListener("scroll", requestEvaluate, { passive: true });
    window.addEventListener("resize", requestEvaluate, { passive: true });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", requestEvaluate);
      window.removeEventListener("resize", requestEvaluate);
    };
  }, [enabled]);

  return scrolled;
}
