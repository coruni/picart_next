import { parse } from "node-html-parser";

const IMAGE_CAPTION_TAG =
  '<p class="ql-image-caption" contenteditable="true" data-placeholder="添加图片说明...">';

const ALLOWED_TAGS = new Set([
  "a",
  "blockquote",
  "br",
  "circle",
  "code",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "hr",
  "iframe",
  "img",
  "li",
  "line",
  "ol",
  "p",
  "path",
  "polyline",
  "pre",
  "rect",
  "s",
  "source",
  "span",
  "strong",
  "svg",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
  "video",
]);

const ALLOWED_CLASS_PREFIXES = ["ql-", "language-"];
const URL_PROTOCOL_PATTERN = /^(https?:|mailto:|tel:|\/|#|data:image\/|blob:)/i;

// SVG 安全属性白名单
const SVG_SAFE_ATTRIBUTES = new Set([
  "class",
  "viewbox",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
  "d",
  "cx",
  "cy",
  "r",
  "x",
  "y",
  "width",
  "height",
  "points",
  "x1",
  "y1",
  "x2",
  "y2",
  "opacity",
]);

// 安全 SVG 标签
const SVG_TAGS = new Set(["svg", "path", "circle", "rect", "polyline", "line"]);

const SAFE_CONTAINER_CLASSES = [
  "ql-divider",
  "ql-inline-article-list",
  "ql-video-wrapper",
  "ql-video-container",
  "ql-video-overlay",
] as const;

// =========================
// 预编译正则
// =========================
const RE_NBSP = /&nbsp;/gi;
const RE_LT = /&lt;/gi;
const RE_GT = /&gt;/gi;
const RE_QUOT = /&quot;/gi;
const RE_APOS = /&#39;/gi;
const RE_AMP = /&amp;/gi;

const RE_ATTR_AMP = /&/g;
const RE_ATTR_QUOT = /"/g;
const RE_ATTR_LT = /</g;
const RE_ATTR_GT = />/g;

const RE_IMAGE_WRAPPER = /<div class="ql-image-wrapper">([\s\S]*?)<\/div>/g;
const RE_IMAGE_CAPTION = /<p class="ql-image-caption"[^>]*>([\s\S]*?)<\/p>/i;
const RE_IMAGE_CAPTION_OPEN = /<p class="ql-image-caption"[^>]*>/g;
const RE_HTML_TAGS = /<[^>]+>/g;
const RE_MULTI_SPACE = /\s+/g;
const RE_IMG_TAG = /<img\b[^>]*>/i;
const RE_ALT_ATTR = /\salt=(["']).*?\1/i;
const RE_IMG_ALT_MATCH = /<img\b[^>]*\balt=(["'])(.*?)\1/i;

const RE_QL_CURSOR = /<span class="ql-cursor">.*?<\/span>/g;
const RE_FEFF = /&#xFEFF;|&#xfeff;|&#65279;|\uFEFF/g;
const RE_CONTENTEDITABLE = /\scontenteditable="(?:true|false)"/g;

const RE_COMMENTS = /<!--[\s\S]*?-->/g;
const RE_DANGEROUS_TAGS =
  /<\/?(script|style|object|embed|form|input|button|textarea|select|option|meta|link|base|math)[^>]*>/gi;
const RE_INLINE_EVENT = /\son[a-z-]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const RE_STYLE_ATTR = /\sstyle\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const RE_SRCDOC_ATTR = /\ssrcdoc\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const RE_JS_URL =
  /\s(href|src|poster)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi;
const RE_UNSAFE_DATA_URL =
  /\s(href|src|poster)\s*=\s*("data:(?!image\/)[^"]*"|'data:(?!image\/)[^']*'|data:(?!image\/)[^\s>]+)/gi;

const RE_P_IMAGE = /<p>\s*(<img\b[^>]*>)\s*<\/p>/gi;
const RE_ANY_IMG_EXCEPT_CLASS =
  /<img\b(?:(?!class=["'][^"']*ql-image[^"']*["']).)*?>/gi;
const RE_EMOJI_IMG_CLASS = /class=(["'])[^"']*ql-emoji-embed__img[^"']*\1/i;
const RE_HAS_IMG = /<img\b/i;

const RE_REMOVE_IMAGE_WRAPPER =
  /<div class="ql-image-wrapper">[\s\S]*?<\/div>/g;
const RE_REMOVE_NON_EMOJI_IMG =
  /<img\b(?:(?!class=(["'])[^"']*ql-emoji-embed__img[^"']*\1)[^>])*>/gi;
const RE_EMPTY_P = /<p>\s*(<br\s*\/?>)?\s*<\/p>/gi;

// =========================
// 基础工具
// =========================
function decodeHtmlEntities(value: string): string {
  return value
    .replace(RE_NBSP, " ")
    .replace(RE_LT, "<")
    .replace(RE_GT, ">")
    .replace(RE_QUOT, '"')
    .replace(RE_APOS, "'")
    .replace(RE_AMP, "&");
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(RE_ATTR_AMP, "&amp;")
    .replace(RE_ATTR_QUOT, "&quot;")
    .replace(RE_ATTR_LT, "&lt;")
    .replace(RE_ATTR_GT, "&gt;");
}

function stripRichTextEditorArtifacts(html: string): string {
  return html
    .replace(RE_QL_CURSOR, "")
    .replace(RE_FEFF, "")
    .replace(RE_CONTENTEDITABLE, "");
}

function isSafeUrl(value: string): boolean {
  const normalized = value.trim();
  return !!normalized && URL_PROTOCOL_PATTERN.test(normalized);
}

// 允许的视频域名白名单
const ALLOWED_VIDEO_DOMAINS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "bilibili.com",
  "www.bilibili.com",
  "player.bilibili.com",
  "b23.tv",
  "tiktok.com",
  "www.tiktok.com",
  "vm.tiktok.com",
];

function isSafeVideoUrl(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;

  // 检查是否是 http/https 协议
  if (!URL_PROTOCOL_PATTERN.test(normalized)) {
    return false;
  }

  try {
    const url = new URL(normalized);
    return ALLOWED_VIDEO_DOMAINS.some((domain) =>
      url.hostname === domain || url.hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

function sanitizeClassName(value: string): string {
  return value
    .split(/\s+/)
    .filter((token) =>
      ALLOWED_CLASS_PREFIXES.some((prefix) => token.startsWith(prefix)),
    )
    .join(" ")
    .trim();
}

function isSafeContainer(element: HTMLElement): boolean {
  return SAFE_CONTAINER_CLASSES.some((className) =>
    element.classList.contains(className),
  );
}

function extractImageAlt(imgTag: string): string {
  return RE_IMG_ALT_MATCH.exec(imgTag)?.[2]?.trim() || "";
}

function buildImageWrapper(imgTag: string, alt: string): string {
  // 只在有 alt 文本时才添加 caption
  if (alt.trim()) {
    return `<div class="ql-image-wrapper">${imgTag}<p class="ql-image-caption text-xs text-secondary text-center">${alt}</p></div>`;
  }
  return `<div class="ql-image-wrapper">${imgTag}</div>`;
}

// =========================
// 图片 caption / alt 同步
// =========================
function syncImageAltFromCaption(html: string): string {
  return html.replace(
    RE_IMAGE_WRAPPER,
    (wrapperHtml: string, innerHtml: string) => {
      const captionMatch = innerHtml.match(RE_IMAGE_CAPTION);
      if (!captionMatch) return wrapperHtml;

      const captionText = decodeHtmlEntities(
        captionMatch[1].replace(RE_HTML_TAGS, ""),
      )
        .replace(RE_MULTI_SPACE, " ")
        .trim();

      return wrapperHtml.replace(RE_IMG_TAG, (imgTag: string) => {
        if (!captionText) {
          return imgTag.replace(RE_ALT_ATTR, "");
        }

        const nextAlt = ` alt="${escapeHtmlAttribute(captionText)}"`;
        if (RE_ALT_ATTR.test(imgTag)) {
          return imgTag.replace(RE_ALT_ATTR, nextAlt);
        }

        return imgTag.replace(/\/?>$/, `${nextAlt}$&`);
      });
    },
  );
}

// =========================
// DOM Sanitizer
// =========================
function sanitizeSvgElement(element: HTMLElement): void {
  const attributes = Array.from(element.attributes);

  for (const attr of attributes) {
    const name = attr.name.toLowerCase();
    const value = attr.value;

    if (name.startsWith("on") || name === "style" || name === "srcdoc") {
      element.removeAttribute(attr.name);
      continue;
    }

    if (!SVG_SAFE_ATTRIBUTES.has(name)) {
      element.removeAttribute(attr.name);
      continue;
    }

    if (
      (name === "href" || name === "xlink:href" || name === "src") &&
      !isSafeUrl(value)
    ) {
      element.removeAttribute(attr.name);
    }
  }
}

function sanitizeSafeContainerElement(element: HTMLElement): void {
  const attributes = Array.from(element.attributes);
  const className = element.getAttribute("class") || "";

  // 对于视频容器，保留特定的数据属性
  const isVideoWrapper = className.includes("ql-video-wrapper");

  for (const attr of attributes) {
    const name = attr.name.toLowerCase();
    if (name.startsWith("on") || name === "style") {
      element.removeAttribute(attr.name);
    }

    // 视频容器保留数据属性
    if (isVideoWrapper) {
      if (name === "data-src" || name === "data-platform" || name === "data-video-id") {
        continue;
      }
    }
  }
}

function isAllowedAttribute(tagName: string, name: string): boolean {
  return (
    name === "alt" ||
    name === "title" ||
    name === "target" ||
    name === "rel" ||
    name === "controls" ||
    name === "preload" ||
    name === "type" ||
    name === "colspan" ||
    name === "rowspan" ||
    name === "frameborder" ||
    name === "allowfullscreen" ||
    name === "allow" ||
    (tagName === "hr" && name === "data-style") ||
    (tagName === "div" && name === "data-style") ||
    (tagName === "div" && name === "data-articles") ||
    (tagName === "div" && name === "data-article-id") ||
    (tagName === "div" && name === "data-src") ||
    (tagName === "div" && name === "data-platform") ||
    (tagName === "div" && name === "data-video-id") ||
    (tagName === "iframe" && name === "src") ||
    ((tagName === "h1" ||
      tagName === "h2" ||
      tagName === "h3" ||
      tagName === "h4") &&
      (name === "id" || name === "data-toc-heading"))
  );
}

function sanitizeRegularElementAttributes(
  element: HTMLElement,
  tagName: string,
  inSafeContainer: boolean,
): void {
  const attributes = Array.from(element.attributes);

  for (const attr of attributes) {
    const name = attr.name.toLowerCase();
    const value = attr.value;

    if (name.startsWith("on") || name === "style" || name === "srcdoc") {
      element.removeAttribute(attr.name);
      continue;
    }

    if (name === "class") {
      if (inSafeContainer) continue;

      const sanitized = sanitizeClassName(value);
      if (sanitized) {
        element.setAttribute("class", sanitized);
      } else {
        element.removeAttribute("class");
      }
      continue;
    }

    if (tagName === "a" && name === "href") {
      if (!isSafeUrl(value)) {
        element.removeAttribute("href");
      }
      continue;
    }

    if (
      (tagName === "img" || tagName === "source" || tagName === "video") &&
      name === "src"
    ) {
      if (!isSafeUrl(value)) {
        element.removeAttribute("src");
      }
      continue;
    }

    if (tagName === "iframe" && name === "src") {
      if (!isSafeVideoUrl(value)) {
        element.removeAttribute("src");
      }
      continue;
    }

    if (tagName === "video" && name === "poster") {
      if (!isSafeUrl(value)) {
        element.removeAttribute("poster");
      }
      continue;
    }

    if (!isAllowedAttribute(tagName, name)) {
      element.removeAttribute(attr.name);
    }
  }
}

function normalizeAnchorAttributes(element: HTMLElement): void {
  const href = element.getAttribute("href");

  if (!href) {
    element.removeAttribute("target");
    element.removeAttribute("rel");
    return;
  }

  const isExternal = /^https?:\/\//i.test(href) || href.startsWith("//");
  if (isExternal) {
    element.setAttribute("target", "_blank");
    element.setAttribute("rel", "noopener noreferrer nofollow");
  } else {
    element.removeAttribute("target");
    element.removeAttribute("rel");
  }
}

function sanitizeNodeTree(node: Node, inSafeContainer = false): void {
  const childNodes = Array.from(node.childNodes);

  for (const child of childNodes) {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const element = child as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    if (SVG_TAGS.has(tagName)) {
      sanitizeSvgElement(element);
      sanitizeNodeTree(element);
      continue;
    }

    if (isSafeContainer(element)) {
      sanitizeSafeContainerElement(element);
      sanitizeNodeTree(element, true);
      continue;
    }

    if (!ALLOWED_TAGS.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    sanitizeRegularElementAttributes(element, tagName, inSafeContainer);

    if (tagName === "a") {
      normalizeAnchorAttributes(element);
    }

    sanitizeNodeTree(element, inSafeContainer);
  }
}

function sanitizeHtmlWithDomParser(html: string): string {
  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  sanitizeNodeTree(document.body);

  return document.body.innerHTML;
}

function sanitizeHtmlWithFallback(html: string): string {
  return html
    .replace(RE_COMMENTS, "")
    .replace(RE_DANGEROUS_TAGS, "")
    .replace(RE_INLINE_EVENT, "")
    .replace(RE_STYLE_ATTR, "")
    .replace(RE_SRCDOC_ATTR, "")
    .replace(RE_JS_URL, "")
    .replace(RE_UNSAFE_DATA_URL, "");
}

export function sanitizeHtmlForRender(html: string): string {
  const stripped = stripRichTextEditorArtifacts(html);

  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    return sanitizeHtmlWithDomParser(stripped);
  }

  return sanitizeHtmlWithFallback(stripped);
}

export function sanitizeRichTextHtml(html: string): string {
  const normalized = stripRichTextEditorArtifacts(html);
  const synced = syncImageAltFromCaption(normalized);
  // 使用 DOM API 更可靠地移除 ql-image-caption 元素
  let withoutCaption = synced;
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(synced, "text/html");
    const captions = doc.querySelectorAll(".ql-image-caption");
    captions.forEach((caption) => caption.remove());
    withoutCaption = doc.body.innerHTML;
  } else {
    // 服务端回退：使用更健壮的正则，处理可能的嵌套标签
    withoutCaption = synced.replace(
      /<p\s+class="ql-image-caption"[^>]*>(?:[\s\S]*?)<\/p>/gi,
      "",
    );
  }
  // 移除视频编辑遮罩层（仅用于编辑器中捕获点击事件）
  const withoutVideoOverlay = withoutCaption.replace(
    /<div class="ql-video-overlay"[^>]*><\/div>/g,
    "",
  );

  return sanitizeHtmlForRender(withoutVideoOverlay);
}

// =========================
// Editor / Display
// =========================
function wrapSingleImageForEditor(imgTag: string): string {
  if (RE_EMOJI_IMG_CLASS.test(imgTag)) {
    return `<p>${imgTag}</p>`;
  }

  return buildImageWrapper(imgTag, extractImageAlt(imgTag));
}

function wrapLooseImageForEditor(imgTag: string): string {
  if (RE_EMOJI_IMG_CLASS.test(imgTag)) {
    return imgTag;
  }

  return buildImageWrapper(imgTag, extractImageAlt(imgTag));
}

function normalizeImageWrapper(innerHtml: string): string {
  const normalizedInnerHtml = innerHtml.replace(
    RE_IMAGE_CAPTION_OPEN,
    IMAGE_CAPTION_TAG,
  );

  if (normalizedInnerHtml.includes('class="ql-image-caption"')) {
    return `<div class="ql-image-wrapper">${normalizedInnerHtml}</div>`;
  }

  if (!RE_HAS_IMG.test(normalizedInnerHtml)) {
    return `<div class="ql-image-wrapper">${normalizedInnerHtml}</div>`;
  }

  const alt = extractImageAlt(normalizedInnerHtml);
  if (!alt) {
    return `<div class="ql-image-wrapper">${normalizedInnerHtml}${IMAGE_CAPTION_TAG}</p></div>`;
  }

  return `<div class="ql-image-wrapper">${normalizedInnerHtml}${IMAGE_CAPTION_TAG}${alt}</p></div>`;
}

export function prepareRichTextHtmlForEditor(html: string): string {
  const stripped = stripRichTextEditorArtifacts(html);

  const withImageWrappers = stripped
    .replace(RE_P_IMAGE, (_match, imgTag: string) =>
      wrapSingleImageForEditor(imgTag),
    )
    .replace(RE_ANY_IMG_EXCEPT_CLASS, (imgTag: string) =>
      wrapLooseImageForEditor(imgTag),
    );

  return withImageWrappers.replace(
    RE_IMAGE_WRAPPER,
    (_match, innerHtml: string) => normalizeImageWrapper(innerHtml),
  );
}

function convertInlineArticleCardsToAnchor(
  html: string,
  locale: string,
): string {
  const root = parse(html);
  const cards = root.querySelectorAll(".inline-article-card");

  for (const card of cards) {
    const articleId = card.getAttribute("data-article-id");
    if (!articleId) continue;

    card.tagName = "a";
    card.setAttribute("href", `/${locale}/article/${articleId}`);
    card.setAttribute("style", "text-decoration:none;color:inherit;");

    const className = card.getAttribute("class") || "";
    if (!/\bblock\b/.test(className)) {
      card.setAttribute("class", `${className} block`.trim());
    }

    card.removeAttribute("data-article-id");
  }

  return root.toString();
}

function _extractClass(attrString: string): string {
  const match = attrString.match(/class=["']([^"']+)["']/i);
  return match ? match[1] : "";
}
export function prepareRichTextHtmlForDisplay(
  html: string,
  locale?: string,
): string {
  const sanitized = sanitizeRichTextHtml(html);
  const root = parse(sanitized);

  // 包裹未被 ql-image-wrapper 包裹的 ql-image 图片
  const images = root.querySelectorAll('img.ql-image');
  for (const img of images) {
    // 跳过 emoji 图片
    if (img.classList.contains('ql-emoji-embed__img')) {
      continue;
    }
    // 跳过已在 ql-image-wrapper 中的图片
    const parent = img.parentNode;
    if (parent && parent.tagName === 'div' && parent.classList.contains('ql-image-wrapper')) {
      continue;
    }
    // 包裹图片
    const wrapper = parse(buildImageWrapper(img.toString(), img.getAttribute('alt') || ''));
    img.replaceWith(wrapper);
  }

  const result = root.toString();

  if (!locale) {
    return result;
  }

  return convertInlineArticleCardsToAnchor(result, locale);
}

function removeImagesForPlainDisplay(html: string): string {
  return html
    .replace(RE_REMOVE_IMAGE_WRAPPER, "")
    .replace(RE_REMOVE_NON_EMOJI_IMG, "")
    .replace(RE_EMPTY_P, "");
}

export function prepareCommentHtmlForDisplay(html: string): string {
  return removeImagesForPlainDisplay(prepareRichTextHtmlForDisplay(html));
}

export function prepareRichTextHtmlForSummary(html: string): string {
  return removeImagesForPlainDisplay(prepareRichTextHtmlForDisplay(html));
}
