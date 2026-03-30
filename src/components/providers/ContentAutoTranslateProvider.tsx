"use client";

import { usePathname } from "@/i18n/routing";
import { useAppStore } from "@/stores";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

const AUTO_TRANSLATE_SELECTOR =
  "[data-auto-translate-content], [data-auto-translate-comment]";
const TRANSLATE_LOCAL_LANGUAGE = "chinese_simplified";
const LOCAL_TRANSLATE_SCRIPT_PATH = "/vendor/translate.js/3.18.66/translate.js";
const TRANSLATE_LANGUAGE_MAP: Record<string, string> = {
  zh: "chinese_simplified",
  en: "english",
};
const TRANSLATE_SCRIPT_ID = "local-translate-js";
const MUTATION_TRANSLATE_DEBOUNCE_MS = 180;

function getTranslateDocuments() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(AUTO_TRANSLATE_SELECTOR),
  );
}

function disableTranslateLanguageSelector() {
  const translate = window.translate;

  if (translate?.selectLanguageTag) {
    translate.selectLanguageTag.show = false;
  }

  document.getElementById("translateSelectLanguage")?.remove();

  const container = document.getElementById("translate");
  if (container?.childElementCount === 0) {
    container.remove();
  }
}

export function ContentAutoTranslateProvider() {
  const locale = useLocale();
  const pathname = usePathname();
  const [scriptReady, setScriptReady] = useState(false);
  const initializedRef = useRef(false);
  const translateObserverRef = useRef<MutationObserver | null>(null);
  const translateTimerRef = useRef<number | null>(null);
  const autoTranslateContent = useAppStore(
    (state) => state.autoTranslateContent,
  );

  useEffect(() => {
    if (window.translate) {
      disableTranslateLanguageSelector();
      setScriptReady(true);
      return;
    }

    const existingScript = document.getElementById(
      TRANSLATE_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      const handleLoad = () => {
        disableTranslateLanguageSelector();
        setScriptReady(true);
      };
      existingScript.addEventListener("load", handleLoad);

      return () => {
        existingScript.removeEventListener("load", handleLoad);
      };
    }

    const script = document.createElement("script");
    script.id = TRANSLATE_SCRIPT_ID;
    script.src = new URL(LOCAL_TRANSLATE_SCRIPT_PATH, window.location.origin).toString();
    script.async = true;
    script.onload = () => {
      disableTranslateLanguageSelector();
      setScriptReady(true);
    };
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, []);

  useEffect(() => {
    if (!scriptReady) {
      return;
    }

    const translate = window.translate;
    if (!translate) {
      return;
    }

    const targetLanguage = TRANSLATE_LANGUAGE_MAP[locale];
    const documents = getTranslateDocuments();

    if (documents.length === 0) {
      return;
    }

    translate.service?.use?.("client.edge");
    translate.language?.setLocal?.(TRANSLATE_LOCAL_LANGUAGE);
    disableTranslateLanguageSelector();

    if (!autoTranslateContent) {
      translate.reset?.();
      return;
    }

    if (!targetLanguage) {
      translate.reset?.();
      return;
    }

    if (!initializedRef.current) {
      translate.listener?.start?.();
      translate.setDocuments?.(documents);
      translate.execute(documents);
      initializedRef.current = true;
    } else {
      translate.setDocuments?.(documents);
    }

    window.requestAnimationFrame(() => {
      translate.changeLanguage?.(targetLanguage);
    });
  }, [autoTranslateContent, locale, pathname, scriptReady]);

  useEffect(() => {
    if (!scriptReady) {
      return;
    }

    return () => {
      initializedRef.current = false;
    };
  }, [scriptReady]);

  useEffect(() => {
    if (!scriptReady || !autoTranslateContent) {
      return;
    }

    const translate = window.translate;
    if (!translate) {
      return;
    }

    const documents = getTranslateDocuments();
    if (documents.length === 0) {
      return;
    }

    translate.setDocuments?.(documents);
    translate.execute(documents);
  }, [pathname, scriptReady, autoTranslateContent]);

  useEffect(() => {
    if (!scriptReady || !autoTranslateContent) {
      translateObserverRef.current?.disconnect();
      translateObserverRef.current = null;

      if (translateTimerRef.current !== null) {
        window.clearTimeout(translateTimerRef.current);
        translateTimerRef.current = null;
      }

      return;
    }

    const targetLanguage = TRANSLATE_LANGUAGE_MAP[locale];
    if (!targetLanguage) {
      translateObserverRef.current?.disconnect();
      translateObserverRef.current = null;

      if (translateTimerRef.current !== null) {
        window.clearTimeout(translateTimerRef.current);
        translateTimerRef.current = null;
      }

      return;
    }

    const translate = window.translate;
    if (!translate) {
      return;
    }

    const scheduleTranslate = () => {
      if (translateTimerRef.current !== null) {
        window.clearTimeout(translateTimerRef.current);
      }

      translateTimerRef.current = window.setTimeout(() => {
        const documents = getTranslateDocuments();
        if (documents.length === 0) {
          return;
        }

        translate.setDocuments?.(documents);
        translate.execute(documents);
        translate.changeLanguage?.(targetLanguage);
      }, MUTATION_TRANSLATE_DEBOUNCE_MS);
    };

    translateObserverRef.current?.disconnect();
    translateObserverRef.current = new MutationObserver((mutations) => {
      const hasTranslatableNodes = mutations.some((mutation) => {
        return Array.from(mutation.addedNodes).some((node) => {
          if (!(node instanceof Element)) {
            return false;
          }

          return (
            node.matches(AUTO_TRANSLATE_SELECTOR) ||
            !!node.querySelector(AUTO_TRANSLATE_SELECTOR)
          );
        });
      });

      if (hasTranslatableNodes) {
        scheduleTranslate();
      }
    });

    translateObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      translateObserverRef.current?.disconnect();
      translateObserverRef.current = null;

      if (translateTimerRef.current !== null) {
        window.clearTimeout(translateTimerRef.current);
        translateTimerRef.current = null;
      }
    };
  }, [autoTranslateContent, locale, scriptReady]);

  return null;
}
