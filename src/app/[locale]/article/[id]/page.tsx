import {
  ArticleActions,
  ArticleAuthor,
  ArticleMenu,
  ArticleRichContent,
  ArticleTranslateNotice,
  ImageGallery,
  ReactionStats,
} from "@/components/article";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Link } from "@/i18n/routing";
import { generateArticleMetadata, prepareRichTextHtmlForDisplay } from "@/lib";
import { serverApi } from "@/lib/server-api";
import { Forward, Hash } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type ArticleDetailPageProps = {
  params: Promise<{
    id: string;
    locale: string;
  }>;
  searchParams: Promise<{
    commentId?: string;
  }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;

  const { data } = await serverApi.articleControllerFindOne({
    path: { id },
  });
  const article = data?.data;
  return generateArticleMetadata(article, locale);
}

export default async function ArticleDetailPage(props: ArticleDetailPageProps) {
  const { id } = await props.params;
  const t = await getTranslations("articleDetail");

  const { data } = await serverApi.articleControllerFindOne({
    path: { id },
  });
  const article = data?.data;
  if (!article) {
    notFound();
  }

  const content = prepareRichTextHtmlForDisplay(
    article?.content?.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    ) || "",
  );

  return (
    <div className="page-container">
      <div className="left-container " data-auto-translate-article-detail>
        <div className="top-header px-4 h-14 flex items-center border-b rounded-t-xl border-border sticky bg-white dark:bg-gray-800 z-15">
          <div className="h-full flex-1 flex items-center">
            <span className="font-bold text-base pr-6">{t("pageTitle")}</span>
          </div>
          <div className="ml-4">
            <ArticleMenu
              articleId={id}
              authorId={article?.author?.id?.toString() || ""}
              articleType={article?.type}
            />
          </div>
        </div>
        <section className="relative">
          {article?.cover && (
            <div className="relative w-full h-80 md:h-120">
              <ImageWithFallback
                src={article?.cover}
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
          <div className="px-6 pt-4 mt-1">
            <h1
              data-auto-translate-content
              className="text-[22px] wrap-break-word font-bold"
            >
              {article?.title}
            </h1>
          </div>
          <div className="top-header-tabs mt-4 h-14 sticky z-10 bg-white dark:bg-gray-800">
            <ArticleAuthor
              author={article?.author}
              createdAt={article?.createdAt}
            />
          </div>
          <div className="px-6">
            <ArticleTranslateNotice />
          </div>
          <div className="mt-4 px-6">
            {article?.type === "image" && (
              <div className="relative w-full min-w-0 overflow-hidden">
                <ImageGallery
                  images={article?.images || []}
                  alt={article?.title || ""}
                />
              </div>
            )}
            {content &&
              (article?.type === "image" ? (
                <div data-auto-translate-content className="mt-2 text-sm">
                  {article.content}
                </div>
              ) : (
                <div data-auto-translate-content>
                  <ArticleRichContent html={content} />
                </div>
              ))}
          </div>
        </section>
        <div className="px-6 mt-4">
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
              data-auto-translate-content
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
          <ReactionStats
            articleId={id}
            initialUserReaction={article.userReaction}
            initialStats={article?.reactionStats || {}}
          />
          <ArticleActions
            articleId={article.id!}
            commentCount={article.commentCount!}
            favoriteCount={article.favoriteCount || 0}
            reactionStats={article.reactionStats!}
            userReaction={article.userReaction}
            likes={article.likes!}
          />
        </div>
      </div>
      <div className="right-container">
        <Sidebar
          showAuthorInfo={true}
          showRecommendTag={false}
          showArticleCreate={false}
          author={article?.author}
        />
      </div>
    </div>
  );
}
