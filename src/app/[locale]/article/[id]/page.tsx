import {
  ArticleAuthor,
  ArticleMenu,
  ArticleRichContent,
  ArticleToc,
  type ArticleTocItem,
  ArticleTranslateNotice,
  ImageGallery,
} from "@/components/article";
import { ArticleReactionWrapper } from "@/components/article/ArticleReactionWrapper.client";
import { ArticleCommentList } from "@/components/comment/ArticleCommentList.client";
import "@/components/editor/inline-article.css";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Link } from "@/i18n/routing";
import {
  cn,
  detectContentLanguage,
  generateArticleMetadata,
  isContentMatchingLocale,
  prepareRichTextHtmlForDisplay,
} from "@/lib";
import { serverApi } from "@/lib/server-api";
import {
  ChevronLeft,
  ChevronRight,
  Forward,
  Hash,
  Library,
} from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { cache } from "react";

function stripHtmlTags(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHeadingHtml(value: string) {
  return decodeHtmlEntities(
    value
      .replace(
        /<span\b[^>]*class=(["'])[^"']*ql-ui[^"']*\1[^>]*>[\s\S]*?<\/span>/gi,
        "",
      )
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function createHeadingSlug(_value: string, fallbackIndex: number) {
  return `section-${fallbackIndex + 1}`;
}

function buildArticleToc(html: string): {
  html: string;
  items: ArticleTocItem[];
} {
  const items: ArticleTocItem[] = [];

  const nextHtml = html.replace(
    /<h([1-4])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, level, attrs = "", innerHtml = "") => {
      const title = stripHeadingHtml(innerHtml);
      if (!title) {
        return match;
      }

      const existingIdMatch = attrs.match(/\sid=(["'])(.*?)\1/i);
      let headingId = existingIdMatch?.[2];

      if (!headingId) {
        headingId = createHeadingSlug(title, items.length);
      }

      items.push({
        id: headingId,
        level: Number(level),
        title,
      });

      if (existingIdMatch) {
        return `<h${level}${attrs}>${innerHtml}</h${level}>`;
      }

      return `<h${level}${attrs} id="${headingId}" data-toc-heading="true">${innerHtml}</h${level}>`;
    },
  );

  return {
    html: nextHtml,
    items,
  };
}

type ArticleDetailPageProps = {
  params: Promise<{
    id: string;
    locale: string;
  }>;
  searchParams: Promise<{
    commentId?: string;
  }>;
};

const getArticleDetail = cache(async (id: string) => {
  const { data } = await serverApi.articleControllerFindOne({
    path: { id },
  });

  return data?.data ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const article = await getArticleDetail(id);
  return generateArticleMetadata(article, locale);
}

export default async function ArticleDetailPage(props: ArticleDetailPageProps) {
  const { id, locale } = await props.params;
  const t = await getTranslations("articleDetail");
  const article = await getArticleDetail(id);
  if (!article) {
    notFound();
  }

  const rawContent =
    article?.content?.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    ) || "";
  const { html: contentWithTocMarkup, items: tocItems } =
    buildArticleToc(rawContent);
  const content = prepareRichTextHtmlForDisplay(contentWithTocMarkup, locale);

  // Detect original content language once on server side
  const articleTextForDetection = [article?.title, stripHtmlTags(article?.content || "")]
    .filter(Boolean)
    .join(" ");
  const originalLanguage = detectContentLanguage(articleTextForDetection);
  const shouldTranslateArticleDetail = !isContentMatchingLocale(
    articleTextForDetection,
    locale,
  );

  return (
    <div className="page-container">
      {tocItems.length > 0 ? (
        <aside className="hidden w-64 shrink-0 lg:block ">
          <ArticleToc
            items={tocItems}
            title={t("tocTitle")}
            openLabel={t("tocOpen")}
          />
        </aside>
      ) : null}
      <div className="left-container " data-auto-translate-article-detail>
        <div className="top-header px-4 h-14 flex items-center border-b rounded-t-xl border-border sticky bg-card  z-15">
          <div className="h-full flex-1 flex items-center">
            {tocItems.length > 0 ? (
              <div className="mr-3 lg:hidden">
                <ArticleToc
                  items={tocItems}
                  title={t("tocTitle")}
                  openLabel={t("tocOpen")}
                />
              </div>
            ) : null}
            <span className="font-bold text-base pr-6">{t("pageTitle")}</span>
          </div>
          <div className="ml-4">
            <ArticleMenu
              articleId={id}
              authorId={article?.author?.id?.toString() || ""}
              articleType={article?.type}
              isFeatured={Boolean(article?.isFeatured)}
              isPinnedOnProfile={Boolean(article?.isPinnedOnProfile)}
            />
          </div>
        </div>
        <section className="relative">
          {article?.cover && (
            <div className="relative w-full h-80 md:h-120">
              <ImageWithFallback
                src={article.cover}
                fill
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                quality={95}
                className="object-cover"
                alt={article?.title}
              />
            </div>
          )}
          <div className="px-4 md:px-6 pt-4 mt-1">
            <h1
              data-auto-translate-content
              className="text-[22px] wrap-break-word font-bold"
            >
              {article?.title}
            </h1>
          </div>
          <div className="top-header-tabs mt-4 h-14 sticky z-10 bg-card ">
            <ArticleAuthor
              author={article?.author}
              createdAt={article?.createdAt}
              updatedAt={article?.updatedAt}
            />
          </div>
          <div className="px-6">
            <ArticleTranslateNotice
              enabled={shouldTranslateArticleDetail}
              originalLanguage={originalLanguage}
            />
          </div>
          <div className="mt-4 px-4 md:px-6">
            {article?.type === "image" && (
              <div className="relative w-full min-w-0 overflow-hidden">
                <ImageGallery
                  article={article}
                  images={article?.images || []}
                  alt={article?.title || ""}
                />
              </div>
            )}
            {content &&
              (article?.type === "image" ? (
                <div
                  data-auto-translate-content={
                    shouldTranslateArticleDetail ? true : undefined
                  }
                  className="mt-4 text-sm"
                >
                  {article.content}
                </div>
              ) : (
                <div
                  data-auto-translate-content={
                    shouldTranslateArticleDetail ? true : undefined
                  }
                >
                  <ArticleRichContent html={content} />
                </div>
              ))}
          </div>
        </section>
        <div className="px-4 md:px-6 mt-4">
          <div className="text-secondary text-xs leading-4 ">
            <span>
              {article?.category?.parent?.name} - {article?.category?.name}
            </span>
          </div>

          <div className="mt-2 flex items-center space-x-1 text-secondary text-xs leading-4">
            <Forward size={16} />
            <span>{t("repostable")}</span>
          </div>
          {article.tags?.length > 0 && (
            <div
              data-auto-translate-content={
                shouldTranslateArticleDetail ? true : undefined
              }
              className="mt-2 flex items-center flex-wrap gap-2"
            >
              {article.tags?.map((tag) => (
                <Link
                  href={`/topic/${tag.id}`}
                  className="flex space-x-0.5 items-center text-sm text-primary hover:opacity-80 cursor-pointer"
                  key={tag.id}
                >
                  <Hash size={14} strokeWidth={2} />
                  <span>{tag.name}</span>
                </Link>
              ))}
            </div>
          )}
          {/* 合集占位 */}
          {article.collection && (
            <div className="mt-2 flex items-center gap-3 p-2 rounded-md bg-muted text-sm">
              <Link
                className={cn(
                  "rounded-full text-white p-1 ",
                  "disabled:cursor-not-allowed!",
                  !article.collection.navigation?.prev?.articleId
                    ? " bg-black/45 cursor-not-allowed pointer-events-none"
                    : " bg-black/75 hover:bg-primary",
                )}
                href={`/article/${article.collection.navigation?.prev?.articleId}`}
                prefetch={false}
              >
                <ChevronLeft size={16} />
              </Link>
              <div className="flex-1 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1 text-secondary ">
                  <Library size={16} />
                  <span className=" font-semibold">
                    {article.collection.name}
                  </span>
                </div>
                <div>
                  ( {article.collection.current.index}/
                  {article.collection.itemCount} )
                </div>
              </div>
              <Link
                className={cn(
                  "rounded-full text-white p-1 ",
                  "disabled:cursor-not-allowed!",
                  !article.collection.navigation?.next?.articleId
                    ? " bg-black/45 cursor-not-allowed"
                    : " bg-black/75 hover:bg-primary",
                )}
                href={`/article/${article.collection.navigation?.next?.articleId}`}
                prefetch={false}
              >
                <ChevronRight size={16} />
              </Link>
            </div>
          )}

          <ArticleReactionWrapper
            articleId={id}
            initialStats={article?.reactionStats || {}}
            initialUserReaction={article.userReaction}
            commentCount={article.commentCount!}
            favoriteCount={article.favoriteCount || 0}
            initialIsFavorited={Boolean(article.isFavorited)}
            likes={article.likes!}
          />
        </div>
        <ArticleCommentList articleId={id} />
      </div>
      <div className="right-container">
        <Sidebar
          showAuthorInfo={true}
          showRecommendTag={false}
          showArticleCreate={false}
          author={article?.author}
          showCollectionList={Boolean(article.collection)}
          collectionId={article.collection?.id}
          collectionName={article.collection?.name}
          currentArticleId={article.id}
        />
      </div>
    </div>
  );
}
