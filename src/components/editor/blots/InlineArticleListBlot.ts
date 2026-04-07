import Quill from "quill";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BlockEmbed = Quill.import("blots/block/embed") as any;

export interface InlineArticleItem {
  id: string;
  title?: string;
  authorName?: string;
  views?: number;
  cover?: string;
  authorAvatar?: string;
}

export interface InlineArticleListValue {
  articles: InlineArticleItem[];
}

export class InlineArticleListBlot extends BlockEmbed {
  static blotName = "inlineArticleList";
  static tagName = "DIV";
  static className = "ql-inline-article-list";

  static create(value: InlineArticleListValue) {
    const node = document.createElement("div") as HTMLElement;
    node.classList.add("ql-inline-article-list");
    node.setAttribute("contenteditable", "false");

    const { articles = [] } = value;

    // Store articles data (包括图片URL，方便编辑时复用)
    node.dataset.articles = JSON.stringify(articles);

    // Format view count
    const formatViews = (count: number): string => {
      if (count >= 10000) {
        return `${(count / 10000).toFixed(1).replace(/\.0$/, "")}万`;
      }
      return String(count);
    };

    // Create cards HTML
    const cardsHtml = articles
      .map((article) => {
        const coverHtml = article.cover
          ? `<div class="inline-article-cover"><img src="${article.cover}" alt="${article.title}" loading="lazy" /></div>`
          : `<div class="inline-article-cover inline-article-cover-placeholder">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
         </div>`;

        const avatarHtml = article.authorAvatar
          ? `<img src="${article.authorAvatar}" alt="${article.authorName}" class="inline-article-author-avatar-img" />`
          : `<div class="inline-article-author-avatar-fallback">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
         </div>`;

        return `
      <div class="inline-article-card" data-article-id="${article.id}">
        <div class="inline-article-wrapper">
          ${coverHtml}
          <div class="inline-article-content">
            <div class="inline-article-title">${article.title || `文章 #${article.id}`}</div>
            <div class="inline-article-meta">
              <div class="inline-article-author">
                <div class="inline-article-author-avatar">${avatarHtml}</div>
                <span class="inline-article-author-name">${article.authorName || ""}</span>
              </div>
              <div class="inline-article-views">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>${formatViews(article.views || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
      })
      .join("");

    node.innerHTML = cardsHtml;

    return node;
  }

  static value(domNode: HTMLElement): InlineArticleListValue {
    try {
      const articles = JSON.parse(domNode.dataset.articles || "[]");
      return { articles };
    } catch {
      return { articles: [] };
    }
  }

  static formats(domNode: HTMLElement): Record<string, unknown> {
    try {
      const articles = JSON.parse(domNode.dataset.articles || "[]");
      return { articles };
    } catch {
      return {};
    }
  }
}
