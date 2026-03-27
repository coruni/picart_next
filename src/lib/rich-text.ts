const IMAGE_CAPTION_TAG =
  '<p class="ql-image-caption" contenteditable="true" data-placeholder="添加图片说明...">';

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

export function sanitizeRichTextHtml(html: string): string {
  return syncImageAltFromCaption(stripRichTextEditorArtifacts(html)).replace(
    /<p class="ql-image-caption"[^>]*>[\s\S]*?<\/p>/g,
    "",
  );
}

export function prepareRichTextHtmlForEditor(html: string): string {
  const withImageWrappers = stripRichTextEditorArtifacts(html)
    .replace(
      /<p>\s*(<img\b[^>]*>)\s*<\/p>/gi,
      (_match, imgTag: string) => {
        if (/class=(["'])[^"']*ql-emoji-embed__img[^"']*\1/i.test(imgTag)) {
          return `<p>${imgTag}</p>`;
        }
        const altMatch = imgTag.match(/<img\b[^>]*\balt=(["'])(.*?)\1/i);
        const alt = altMatch?.[2]?.trim() || "";
        return `<div class="ql-image-wrapper">${imgTag}${IMAGE_CAPTION_TAG}${alt}</p></div>`;
      },
    )
    .replace(
      /<img\b(?:(?!class=["'][^"']*ql-image[^"']*["']).)*?>/gi,
      (imgTag: string) => {
        if (/class=(["'])[^"']*ql-emoji-embed__img[^"']*\1/i.test(imgTag)) {
          return imgTag;
        }
        const altMatch = imgTag.match(/<img\b[^>]*\balt=(["'])(.*?)\1/i);
        const alt = altMatch?.[2]?.trim() || "";
        return `<div class="ql-image-wrapper">${imgTag}${IMAGE_CAPTION_TAG}${alt}</p></div>`;
      },
    );

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

export function prepareRichTextHtmlForSummary(html: string): string {
  return prepareRichTextHtmlForDisplay(html)
    .replace(/<div class="ql-image-wrapper">[\s\S]*?<\/div>/g, "")
    .replace(
      /<img\b(?:(?!class=(["'])[^"']*ql-emoji-embed__img[^"']*\1)[^>])*>/gi,
      "",
    )
    .replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, "");
}
