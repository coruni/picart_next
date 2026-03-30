"use client";

import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";

const TRANSLATE_LOCAL_LANGUAGE = "chinese_simplified";
const TRANSLATE_LANGUAGE_MAP: Record<string, string> = {
  zh: "chinese_simplified",
  en: "english",
};
const TRANSLATE_TIMEOUT_MS = 1800;
const TRANSLATE_SETTLE_MS = 160;

function disableTranslateLanguageSelector() {
  const translate = window.translate;

  if (translate?.selectLanguageTag) {
    translate.selectLanguageTag.show = false;
  }

  document.getElementById("translateSelectLanguage")?.remove();
}

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
  host.innerHTML = `<div>${html}</div>`;
  document.body.appendChild(host);

  const documentNode = host.firstElementChild as HTMLElement | null;
  if (!documentNode) {
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
    disableTranslateLanguageSelector();
    translate.setDocuments?.([documentNode]);
    translate.listener?.start?.();
    translate.execute([documentNode]);

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
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedHtml, setTranslatedHtml] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const toggleTranslate = useCallback(async () => {
    const targetLanguage = TRANSLATE_LANGUAGE_MAP[locale];
    if (!targetLanguage || isTranslating) {
      return;
    }

    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    if (translatedHtml) {
      setIsTranslated(true);
      return;
    }

    setIsTranslating(true);
    try {
      const nextTranslatedHtml = await translateHtmlContent(html, targetLanguage);
      setTranslatedHtml(nextTranslatedHtml);
      setIsTranslated(true);
    } finally {
      setIsTranslating(false);
    }
  }, [html, isTranslated, isTranslating, locale, translatedHtml]);

  useEffect(() => {
    setIsTranslated(false);
    setTranslatedHtml(null);
    setIsTranslating(false);
  }, [resetKey]);

  return {
    displayHtml: isTranslated && translatedHtml ? translatedHtml : html,
    isTranslated,
    isTranslating,
    toggleTranslate,
  };
}
