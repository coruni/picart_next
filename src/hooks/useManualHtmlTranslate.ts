"use client";

import { isContentMatchingLocale } from "@/lib/translate";
import { useTranslateStore } from "@/stores";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TRANSLATE_LOCAL_LANGUAGE = "chinese_simplified";
const TRANSLATE_LANGUAGE_MAP: Record<string, string> = {
  zh: "chinese_simplified",
  en: "english",
};
const MANUAL_TRANSLATE_SELECTOR = "[data-manual-translate-comment]";
const TRANSLATE_TIMEOUT_MS = 1800;
const TRANSLATE_SETTLE_MS = 160;

async function translateHtmlContent(
  html: string,
  targetLanguage: string,
): Promise<string> {
  const translate = window.translate;
  if (!translate) {
    return html;
  }

  const host = document.createElement("div");
  host.className = "pointer-events-none fixed -top-[9999px] left-0 opacity-0";
  host.setAttribute("aria-hidden", "true");
  host.innerHTML = `<div data-manual-translate-comment="true">${html}</div>`;
  document.body.appendChild(host);

  const documents = Array.from(
    host.querySelectorAll<HTMLElement>(MANUAL_TRANSLATE_SELECTOR),
  );
  const documentNode = documents[0] ?? null;
  if (!documentNode || documents.length === 0) {
    host.remove();
    return html;
  }

  const translatedHtml = await new Promise<string>((resolve) => {
    let finished = false;
    let settleTimer: number | null = null;
    let timeoutTimer: number | null = null;

    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;

      if (settleTimer !== null) {
        window.clearTimeout(settleTimer);
      }
      if (timeoutTimer !== null) {
        window.clearTimeout(timeoutTimer);
      }

      observer.disconnect();
      resolve(documentNode.innerHTML || html);
    };

    const observer = new MutationObserver(() => {
      if (settleTimer !== null) {
        window.clearTimeout(settleTimer);
      }
      settleTimer = window.setTimeout(finish, TRANSLATE_SETTLE_MS);
    });

    observer.observe(documentNode, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    timeoutTimer = window.setTimeout(finish, TRANSLATE_TIMEOUT_MS);

    translate.service?.use?.("client.edge");
    translate.language?.setLocal?.(TRANSLATE_LOCAL_LANGUAGE);
    translate.setDocuments?.(documents);
    translate.listener?.start?.();
    translate.execute(documents);

    window.requestAnimationFrame(() => {
      translate.changeLanguage?.(targetLanguage);
    });
  });

  translate.reset?.();
  host.remove();
  return translatedHtml;
}

type UseManualHtmlTranslateOptions = {
  html: string;
  resetKey?: string | number;
};

export function useManualHtmlTranslate({
  html,
  resetKey,
}: UseManualHtmlTranslateOptions) {
  const locale = useLocale();
  const autoTranslateContent = useTranslateStore(
    (state) => state.autoTranslateContent,
  );
  const [manualMode, setManualMode] = useState<
    "follow-auto" | "original" | "translated"
  >("follow-auto");
  const [translatedHtml, setTranslatedHtml] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const previousAutoTranslateRef = useRef(autoTranslateContent);

  // Detect if content language matches current locale
  const contentMatchesLocale = useMemo(() => {
    return isContentMatchingLocale(html, locale);
  }, [html, locale]);

  const toggleTranslate = useCallback(async () => {
    const targetLanguage = TRANSLATE_LANGUAGE_MAP[locale];
    if (!targetLanguage || isTranslating) {
      return;
    }

    if (autoTranslateContent) {
      setManualMode((currentMode) =>
        currentMode === "follow-auto" ? "original" : "follow-auto",
      );
      return;
    }

    if (manualMode === "translated") {
      setManualMode("original");
      return;
    }

    if (translatedHtml) {
      setManualMode("translated");
      return;
    }

    setIsTranslating(true);
    try {
      const nextTranslatedHtml = await translateHtmlContent(html, targetLanguage);
      setTranslatedHtml(nextTranslatedHtml);
      setManualMode("translated");
    } finally {
      setIsTranslating(false);
    }
  }, [
    autoTranslateContent,
    html,
    isTranslating,
    locale,
    manualMode,
    translatedHtml,
  ]);

  useEffect(() => {
    setManualMode("follow-auto");
    setTranslatedHtml(null);
    setIsTranslating(false);
  }, [resetKey]);

  useEffect(() => {
    const previousAutoTranslate = previousAutoTranslateRef.current;
    previousAutoTranslateRef.current = autoTranslateContent;

    if (
      !previousAutoTranslate &&
      autoTranslateContent &&
      manualMode === "translated"
    ) {
      setManualMode("follow-auto");
    }
  }, [autoTranslateContent, manualMode]);

  const isFollowingAuto = manualMode === "follow-auto";
  // Don't auto translate if content matches current locale
  const shouldAutoTranslate = autoTranslateContent && isFollowingAuto && !contentMatchesLocale;
  const isTranslated =
    manualMode === "translated" ||
    (autoTranslateContent && manualMode === "follow-auto" && !contentMatchesLocale);
  const renderMode = shouldAutoTranslate ? "auto" : "static";

  return {
    displayHtml:
      manualMode === "translated" && translatedHtml ? translatedHtml : html,
    isTranslated,
    isTranslating,
    renderKey: `${String(resetKey ?? html)}-${manualMode}-${renderMode}`,
    shouldAutoTranslate,
    toggleTranslate,
    contentMatchesLocale,
  };
}
