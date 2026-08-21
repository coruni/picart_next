import { franc } from "franc-min";

// Locale to translate.js language code mapping
export const TRANSLATE_LANGUAGE_MAP: Record<string, string> = {
  zh: "chinese_simplified",
  en: "english",
  ja: "japanese",
  ko: "korean",
  fr: "french",
  es: "spanish",
  de: "german",
  ru: "russian",
  it: "italian",
  pt: "portuguese",
};

// franc language code mapping to our locale
const FRANC_TO_LOCALE: Record<string, string> = {
  cmn: "zh", // Chinese (Mandarin)
  eng: "en", // English
  jpn: "ja", // Japanese
  kor: "ko", // Korean
  fra: "fr", // French
  spa: "es", // Spanish
  deu: "de", // German
  rus: "ru", // Russian
  ita: "it", // Italian
  por: "pt", // Portuguese
};

// Clean text for language detection by removing common non-language content
function cleanTextForDetection(value: string): string {
  return (
    value
      // Strip HTML
      .replace(/<[^>]+>/g, " ")
      // Remove URLs
      .replace(/https?:\/\/\S+/g, " ")
      // Remove @mentions
      .replace(/@\w+/g, " ")
      // Remove hashtags
      .replace(/#\w+/g, " ")
      // Remove email addresses
      .replace(/\S+@\S+\.\S+/g, " ")
      // Remove extra whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Check if text contains Japanese characters (Hiragana or Katakana)
function containsJapaneseCharacters(value: string): boolean {
  // Hiragana: \u3040-\u309F, Katakana: \u30A0-\u30FF
  const japaneseMatches = value.match(/[\u3040-\u309F\u30A0-\u30FF]/g);
  return (japaneseMatches?.length ?? 0) > 0;
}

// Check if text contains Korean characters (Hangul syllables)
function containsKoreanCharacters(value: string): boolean {
  // Hangul syllables: \uAC00-\uD7AF
  const koreanMatches = value.match(/[\uAC00-\uD7AF]/g);
  return (koreanMatches?.length ?? 0) > 0;
}

function isLikelyChineseContent(value: string): boolean {
  const text = value.replace(/\s+/g, "");
  if (!text) {
    return false;
  }

  const chineseMatches = text.match(
    /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g,
  );
  const letterMatches = text.match(/[A-Za-z]/g);
  const chineseCount = chineseMatches?.length ?? 0;
  const letterCount = letterMatches?.length ?? 0;

  // 评论常为中英混排（如 "Great! 太棒了"），中文字符不少于英文字母
  // 的一半即视为中文内容，避免交给 franc 后被误判为德语等语言。
  return chineseCount > 0 && chineseCount * 2 >= letterCount;
}

/**
 * Detect the language of a text using franc with pre-detection
 * @param text - The text to detect (may contain HTML)
 * @returns The detected locale code or null if undetermined
 */
export function detectContentLanguage(text: string): string | null {
  const cleanText = cleanTextForDetection(text);
  if (!cleanText || cleanText.length < 10) {
    return null;
  }

  // Pre-check: detect Japanese first (before Chinese, since Japanese uses kanji)
  // This is important because Japanese uses Chinese characters (kanji) plus hiragana/katakana
  if (containsJapaneseCharacters(cleanText)) {
    return "ja";
  }

  // Pre-check: if content is mostly Chinese, return zh directly
  // This is more reliable than franc for Chinese content
  if (isLikelyChineseContent(cleanText)) {
    return "zh";
  }

  // Use franc for other languages
  const langCode = franc(cleanText.slice(0, 1000));
  if (langCode === "und") {
    return null;
  }

  // 仅接受能映射到站内支持语种的代码；franc 偶发返回的
  // 未映射代码（如 zyb、kin）直接透传会导致 isContentMatchingLocale
  // 判定永远不相等，从而对匹配语种的内容错误显示翻译图标。
  return FRANC_TO_LOCALE[langCode] || null;
}

/**
 * Check if content language matches the current locale
 * @param text - The text to check (may contain HTML)
 * @param locale - The current locale
 * @returns true if content matches locale, false otherwise
 */
export function isContentMatchingLocale(
  text: string,
  locale: string,
): boolean {
  // Always use cleaned text
  const cleanText = cleanTextForDetection(text);
  const detectedLang = detectContentLanguage(cleanText);
  if (!detectedLang) {
    // Fallback: detect by character sets when franc cannot determine
    if (containsJapaneseCharacters(cleanText)) {
      return locale === "ja";
    }
    if (containsKoreanCharacters(cleanText)) {
      return locale === "ko";
    }
    // 纯数字/符号/emoji 等无语言特征的文本无需翻译，视为与当前语种匹配
    if (
      !/[A-Za-z\u00C0-\u024F\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(
        cleanText,
      )
    ) {
      return true;
    }
    return isLikelyChineseContent(cleanText) === (locale === "zh");
  }
  return detectedLang === locale;
}
