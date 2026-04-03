"use client";

import { GuardedLink } from "@/components/shared/GuardedLink";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButtonWithStatus } from "@/components/ui/FollowButtonWithStatus";
import { Link } from "@/i18n/routing";
import {
  cn,
  formatCompactNumber,
  formatRelativeTime,
  prepareRichTextHtmlForSummary,
} from "@/lib";
import { useUserStore } from "@/stores";
import type { ArticleDetail, ArticleList } from "@/types";
import {
  Eye,
  FileImage,
  GalleryHorizontalEnd,
  Hash,
  MessageCircleMore,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ArticleMenu } from "./ArticleMenu";
import { ImageViewer } from "./ImageViewer";
import { ReactionPanel } from "./ReactionPanel.client";
import { getImageUrl, getImageUrls, type ImageInfo } from "@/types/image";

type Article = ArticleList[number] | ArticleDetail;
type ArticleCardProps = {
  article: Article;
  showFollow: boolean;
};

export const ArticleCard = ({
  article,
  showFollow = true,
}: ArticleCardProps) => {
  const currentUser = useUserStore((state) => state.user);
  const t = useTranslations("time");
  const tAccountInfo = useTranslations("accountInfo");
  const locale = useLocale();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const isOwner =
    currentUser?.id != null &&
    article?.author?.id != null &&
    String(currentUser.id) === String(article.author.id);

  const summaryHtml =
    article.summary && typeof article.summary === "string"
      ? prepareRichTextHtmlForSummary(article.summary)
      : "";

  // Handle new image format (ImageInfo[])
  const rawImages = (article.images || []) as (string | ImageInfo)[];
  const previewImages = rawImages.filter(
    (img) => {
      const url = typeof img === "string" ? img : img.url;
      const coverUrl = article.cover;
      return url && url !== coverUrl;
    },
  );

  const compactNumberLabels = {
    thousand: tAccountInfo("numberUnits.thousand"),
    tenThousand: tAccountInfo("numberUnits.tenThousand"),
    hundredMillion: tAccountInfo("numberUnits.hundredMillion"),
    million: tAccountInfo("numberUnits.million"),
    billion: tAccountInfo("numberUnits.billion"),
  };

  const openImageViewer = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const stopLinkNavigationEvent = (e: {
    preventDefault: () => void;
    stopPropagation: () => void;
    nativeEvent: Event & { stopImmediatePropagation?: () => void };
  }) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation?.();
  };

  const renderMediaElement = () => {
    if (article.cover) {
      const coverUrl = typeof article.cover === "string"
        ? article.cover
        : getImageUrl(article.cover, "medium");

      return (
        <div
          className="mt-3 rounded-xl overflow-hidden w-62/100 min-w-56 min-h-32.5 relative"
          style={{ paddingTop: "35%" }}
        >
          <ImageWithFallback
            src={coverUrl}
            alt={article?.title || "cover"}
            fill
            quality={75}
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
          <div className="absolute bottom-2 right-2 w-6 h-4 bg-[#00000099] rounded-full flex items-center justify-center text-white">
            <FileImage size={12} strokeWidth={3} />
          </div>
        </div>
      );
    }

    if (previewImages.length === 0) return null;

    const imageCount = previewImages.length;

    if (imageCount === 1) {
      const img = previewImages[0];
      const imgUrl = typeof img === "string" ? img : getImageUrl(img, "medium");

      return (
        <div
          className="mt-3 rounded-xl overflow-hidden w-62/100 min-w-56 min-h-32.5 relative"
          style={{ paddingTop: "35%" }}
        >
          <div
            role="button"
            tabIndex={0}
            data-guarded-link-ignore="true"
            className="absolute inset-0 cursor-zoom-in"
            onClick={(e) => {
              stopLinkNavigationEvent(e);
              openImageViewer(0);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              e.stopPropagation();
              openImageViewer(0);
            }}
          >
            <ImageWithFallback
              src={imgUrl}
              alt={article?.title || "image"}
              fill
              quality={75}
              loading="eager"
              fetchPriority="high"
              sizes="50vw"
              className="object-cover"
            />
          </div>
        </div>
      );
    }

    if (imageCount === 2) {
      return (
        <div className="mt-3 flex gap-2">
          {previewImages.slice(0, 2).map((img, idx) => {
            const imgUrl = typeof img === "string" ? img : getImageUrl(img, "small");
            return (
              <div
                key={`${imgUrl}-${idx}`}
                role="button"
                tabIndex={0}
                data-guarded-link-ignore="true"
                className="rounded-xl overflow-hidden w-31/100 relative cursor-zoom-in"
                style={{ paddingTop: "31%" }}
                // ✅ paddingTop 与 width 相同百分比 → 正方形
                onClick={(e) => {
                  stopLinkNavigationEvent(e);
                  openImageViewer(idx);
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  e.stopPropagation();
                  openImageViewer(idx);
                }}
              >
                <ImageWithFallback
                  src={imgUrl}
                  alt={`${article?.title || "image"} ${idx + 1}`}
                  fill
                  quality={75}
                  sizes="31vw"
                  className="object-cover"
                />
              </div>
            );
          })}
        </div>
      );
    }

    const displayImages = previewImages.slice(0, 3);
    const remainingCount = imageCount - 3;

    return (
      <div className="mt-3 flex gap-2">
        {displayImages.map((img, idx) => {
          const imgUrl = typeof img === "string" ? img : getImageUrl(img, "small");
          return (
            <div
              key={`${imgUrl}-${idx}`}
              role="button"
              tabIndex={0}
              data-guarded-link-ignore="true"
              className="rounded-xl overflow-hidden w-1/5 relative cursor-zoom-in"
              style={{ paddingTop: "20%" }}
              // ✅ paddingTop 与 width 相同百分比 → 正方形
              onClick={(e) => {
                stopLinkNavigationEvent(e);
                openImageViewer(idx);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                e.stopPropagation();
                openImageViewer(idx);
              }}
            >
              <ImageWithFallback
                src={imgUrl}
                alt={`${article?.title || "image"} ${idx + 1}`}
                fill
                quality={75}
                sizes="20vw"
                className="object-cover"
              />
              {idx === 2 && remainingCount > 0 && (
                <div className="absolute bg-black/60 flex items-center justify-center bottom-2 right-2 rounded-full px-2 gap-1 text-white text-sm leading-3.5">
                  <GalleryHorizontalEnd size={12} strokeWidth={3} />
                  <span>+{remainingCount}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Prepare viewer URLs (original size for full view)
  const viewerUrls = getImageUrls(previewImages, "original");

  return (
    <article className="p-6 border-border border-b">
      <div className="flex items-center">
        <div className="flex items-center flex-1 cursor-pointer">
          <Link href={`/account/${article?.author?.id}`} className="shrink-0">
            <Avatar
              className={cn("size-12")}
              url={article.author?.avatar}
              frameUrl={
                article.author?.equippedDecorations?.AVATAR_FRAME?.imageUrl
              }
            />
          </Link>
          <div className="ml-3 flex flex-col flex-1">
            <Link
              href={`/account/${article?.author?.id}`}
              className=" flex items-center leading-5"
            >
              <span className="font-bold hover:text-primary">
                {
                  (article?.author?.nickname ||
                    article?.author?.username) as string
                }
              </span>
            </Link>
            <div className="mt-1 leading-4">
              <span className="text-xs text-secondary ">
                {formatRelativeTime(article.createdAt!, t, locale)} {" - "}
                {article?.category?.name}
              </span>
            </div>
          </div>
          {showFollow && !isOwner && (
            <div className="ml-3 flex items-center w-auto">
              <FollowButtonWithStatus
                author={article.author}
                className="min-w-22"
              />
            </div>
          )}
        </div>
        <div className="ml-2">
          <ArticleMenu
            articleId={String(article.id)}
            authorId={String(article?.author?.id || "")}
            articleType={article?.type}
            isOwner={isOwner}
          />
        </div>
      </div>

      <section>
        <GuardedLink href={`/article/${article.id}`}>
          <h3
            data-auto-translate-content
            className="mt-2 font-bold hover:text-primary cursor-pointer"
          >
            {article?.title}
          </h3>
          {summaryHtml && (
            <p
              data-auto-translate-content
              className="article-summary-html mt-1 px-0! text-secondary text-sm leading-5 line-clamp-2 overflow-hidden cursor-pointer"
              dangerouslySetInnerHTML={{ __html: summaryHtml }}
            />
          )}
          {renderMediaElement()}
        </GuardedLink>
      </section>

      {(article.tags?.length ?? 0) > 0 && (
        <div
          data-auto-translate-content
          className="mt-2 flex items-center flex-wrap gap-2"
        >
          {article.tags?.map((tag) => (
            <Link
              href={`/topic/${tag?.id}`}
              className="flex space-x-0.5 items-center text-sm text-primary hover:opacity-80 cursor-pointer"
              key={tag.id}
            >
              <Hash size={14} strokeWidth={2} />
              <span>{tag?.name}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center text-secondary text-sm">
        <div className="flex items-center flex-1">
          <Eye size={20} />
          <span className="ml-2 text-xs">
            {formatCompactNumber(article.views, {
              locale,
              labels: compactNumberLabels,
            })}
          </span>
        </div>
        <div className="ml-2 w-20 flex items-center justify-end">
          <div className="flex items-center">
            <MessageCircleMore size={20} />
            <span className="ml-2 text-xs">
              {formatCompactNumber(article.commentCount, {
                locale,
                labels: compactNumberLabels,
              })}
            </span>
          </div>
        </div>
        <div className="ml-6 flex items-center justify-end">
          <ReactionPanel
            articleId={article.id!}
            reactionStats={article.reactionStats!}
            userReaction={
              "userReaction" in article
                ? (article as { userReaction?: string }).userReaction
                : undefined
            }
          />
        </div>
      </div>

      {viewerVisible && viewerUrls.length > 0 && (
        <ImageViewer
          images={viewerUrls}
          initialIndex={viewerIndex}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
        />
      )}
    </article>
  );
};
