const IMAGE_CAPTION_TAG =
  '<p class="ql-image-caption" contenteditable="true" data-placeholder="添加图片说明...">';

const ALLOWED_TAGS = new Set([
  "a",
  "blockquote",
  "br",
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
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "source",
  "span",
  "strong",
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
const URL_PROTOCOL_PATTERN =
  /^(https?:|mailto:|tel:|\/|#|data:image\/|blob:)/i;

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&");
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function syncImageAltFromCaption(html: string): string {
  return html.replace(
    /<div class="ql-image-wrapper">([\s\S]*?)<\/div>/g,
    (wrapperHtml: string, innerHtml: string) => {
      const captionMatch = innerHtml.match(
        /<p class="ql-image-caption"[^>]*>([\s\S]*?)<\/p>/i,
      );
      if (!captionMatch) return wrapperHtml;

      const captionText = decodeHtmlEntities(captionMatch[1].replace(/<[^>]+>/g, ""))
        .replace(/\s+/g, " ")
        .trim();

      return wrapperHtml.replace(/<img\b[^>]*>/i, (imgTag: string) => {
        if (!captionText) {
          return imgTag.replace(/\salt=(["']).*?\1/i, "");
        }

        const nextAlt = ` alt="${escapeHtmlAttribute(captionText)}"`;
        if (/\salt=(["']).*?\1/i.test(imgTag)) {
          return imgTag.replace(/\salt=(["']).*?\1/i, nextAlt);
        }
        return imgTag.replace(/\/?>$/, `${nextAlt}$&`);
      });
    },
  );
}

function stripRichTextEditorArtifacts(html: string): string {
  return html
    .replace(/<span class="ql-cursor">.*?<\/span>/g, "")
    .replace(/&#xFEFF;|&#xfeff;|&#65279;|\uFEFF/g, "")
    .replace(/\scontenteditable="(?:true|false)"/g, "");
}

function isSafeUrl(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  return URL_PROTOCOL_PATTERN.test(normalized);
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

function sanitizeNodeTree(node: Node): void {
  const childNodes = Array.from(node.childNodes);

  for (const child of childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      // 保留 ql-divider 和 ql-inline-article-list 内部结构
      if (element.classList.contains("ql-divider") || element.classList.contains("ql-inline-article-list")) {
        // 只清理危险属性，保留所有子节点
        const attributes = Array.from(element.attributes);
        for (const attr of attributes) {
          const name = attr.name.toLowerCase();
          if (name.startsWith("on") || name === "style" || name === "srcdoc") {
            element.removeAttribute(attr.name);
          }
        }
        // 跳过子节点处理，保留内部结构
        continue;
      }

      if (!ALLOWED_TAGS.has(tagName)) {
        element.replaceWith(...Array.from(element.childNodes));
        continue;
      }

      const attributes = Array.from(element.attributes);
      for (const attr of attributes) {
        const name = attr.name.toLowerCase();
        const value = attr.value;

        if (name.startsWith("on")) {
          element.removeAttribute(attr.name);
          continue;
        }

        if (name === "style" || name === "srcdoc") {
          element.removeAttribute(attr.name);
          continue;
        }

        if (name === "class") {
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

        if (tagName === "video" && name === "poster") {
          if (!isSafeUrl(value)) {
            element.removeAttribute("poster");
          }
          continue;
        }

        const isAllowedAttribute =
          name === "alt" ||
          name === "title" ||
          name === "target" ||
          name === "rel" ||
          name === "controls" ||
          name === "preload" ||
          name === "type" ||
          name === "colspan" ||
          name === "rowspan" ||
          (tagName === "hr" && name === "data-style") ||
          (tagName === "div" && name === "data-style") ||
          (tagName === "div" && name === "data-articles") ||
          ((tagName === "h1" ||
            tagName === "h2" ||
            tagName === "h3" ||
            tagName === "h4") &&
            (name === "id" || name === "data-toc-heading"));

        if (!isAllowedAttribute) {
          element.removeAttribute(attr.name);
        }
      }

      if (tagName === "a") {
        const href = element.getAttribute("href");
        if (href) {
          const isExternal = /^https?:\/\//i.test(href) || href.startsWith("//");
          if (isExternal) {
            element.setAttribute("target", "_blank");
            element.setAttribute("rel", "noopener noreferrer nofollow");
          } else {
            element.removeAttribute("target");
            element.removeAttribute("rel");
          }
        } else {
          element.removeAttribute("target");
          element.removeAttribute("rel");
        }
      }

      sanitizeNodeTree(element);
      continue;
    }

    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
    }
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
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<\/?(script|style|iframe|object|embed|form|input|button|textarea|select|option|meta|link|base|svg|math)[^>]*>/gi,
      "",
    )
    .replace(/\son[a-z-]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/\sstyle\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/\ssrcdoc\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(
      /\s(href|src|poster)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi,
      "",
    )
    .replace(
      /\s(href|src|poster)\s*=\s*("data:(?!image\/)[^"]*"|'data:(?!image\/)[^']*'|data:(?!image\/)[^\s>]+)/gi,
      "",
    );
}

export function sanitizeHtmlForRender(html: string): string {
  const stripped = stripRichTextEditorArtifacts(html);

  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    return sanitizeHtmlWithDomParser(stripped);
  }

  return sanitizeHtmlWithFallback(stripped);
}

export function sanitizeRichTextHtml(html: string): string {
  return sanitizeHtmlForRender(
    syncImageAltFromCaption(stripRichTextEditorArtifacts(html)).replace(
      /<p class="ql-image-caption"[^>]*>[\s\S]*?<\/p>/g,
      "",
    ),
  );
}

export function prepareRichTextHtmlForEditor(html: string): string {
  const withImageWrappers = stripRichTextEditorArtifacts(html)
    .replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/gi, (_match, imgTag: string) => {
      if (/class=(["'])[^"']*ql-emoji-embed__img[^"']*\1/i.test(imgTag)) {
        return `<p>${imgTag}</p>`;
      }
      const altMatch = imgTag.match(/<img\b[^>]*\balt=(["'])(.*?)\1/i);
      const alt = altMatch?.[2]?.trim() || "";
      return `<div class="ql-image-wrapper">${imgTag}${IMAGE_CAPTION_TAG}${alt}</p></div>`;
    })
    .replace(/<img\b(?:(?!class=["'][^"']*ql-image[^"']*["']).)*?>/gi, (imgTag: string) => {
      if (/class=(["'])[^"']*ql-emoji-embed__img[^"']*\1/i.test(imgTag)) {
        return imgTag;
      }
      const altMatch = imgTag.match(/<img\b[^>]*\balt=(["'])(.*?)\1/i);
      const alt = altMatch?.[2]?.trim() || "";
      return `<div class="ql-image-wrapper">${imgTag}${IMAGE_CAPTION_TAG}${alt}</p></div>`;
    });

  return withImageWrappers.replace(
    /<div class="ql-image-wrapper">([\s\S]*?)<\/div>/g,
    (_match, innerHtml: string) => {
      const normalizedInnerHtml = innerHtml.replace(
        /<p class="ql-image-caption"[^>]*>/g,
        IMAGE_CAPTION_TAG,
      );

      if (normalizedInnerHtml.includes('class="ql-image-caption"')) {
        return `<div class="ql-image-wrapper">${normalizedInnerHtml}</div>`;
      }

      const altMatch = normalizedInnerHtml.match(
        /<img\b[^>]*\balt=(["'])(.*?)\1/i,
      );
      const alt = altMatch?.[2]?.trim();

      if (!/<img\b/i.test(normalizedInnerHtml)) {
        return `<div class="ql-image-wrapper">${normalizedInnerHtml}</div>`;
      }

      if (!alt) {
        return `<div class="ql-image-wrapper">${normalizedInnerHtml}${IMAGE_CAPTION_TAG}</p></div>`;
      }

      return `<div class="ql-image-wrapper">${normalizedInnerHtml}${IMAGE_CAPTION_TAG}${alt}</p></div>`;
    },
  );
}

export function prepareRichTextHtmlForDisplay(html: string): string {
  return sanitizeRichTextHtml(html);
}

export function prepareCommentHtmlForDisplay(html: string): string {
  return prepareRichTextHtmlForDisplay(html)
    .replace(/<div class="ql-image-wrapper">[\s\S]*?<\/div>/g, "")
    .replace(
      /<img\b(?:(?!class=(["'])[^"']*ql-emoji-embed__img[^"']*\1)[^>])*>/gi,
      "",
    )
    .replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, "");
}

export function prepareRichTextHtmlForSummary(html: string): string {
  return prepareRichTextHtmlForDisplay(html)
    .replace(/<div class="ql-image-wrapper">[\s\S]*?<\/div>/g, "")
    .replace(
      /<img\b(?:(?!class=(["'])[^"']*ql-emoji-embed__img[^"']*\1)[^>])*>/gi,
      "",
    )
    .replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, "");
}
