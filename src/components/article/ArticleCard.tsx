"use client";

import { useState } from "react";
import type { ArticleDetail, ArticleList } from "@/types";
import Image from "next/image";
import { Avatar } from "@/components/ui/Avatar";
import { cn, formatRelativeTime, prepareRichTextHtmlForSummary } from "@/lib";
import { useTranslations } from "next-intl";
import { FollowButtonWithStatus } from "@/components/ui/FollowButtonWithStatus";
import {
  EllipsisVertical,
  Eye,
  FileImage,
  GalleryHorizontalEnd,
  Hash,
  HeartCrack,
  MessageCircleMore,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { DropdownMenu, MenuItem } from "@/components/shared";
import { ReactionPanel } from "./ReactionPanel.client";
import { ImageViewer } from "./ImageViewer";
import { GuardedLink } from "@/components/shared/GuardedLink";

type Article = ArticleList[number] | ArticleDetail;
type ArticleCardProps = {
  article: Article;
  showFollow: boolean;
};

export const ArticleCard = ({ article, showFollow = true }: ArticleCardProps) => {
  const t = useTranslations("time");
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const summaryHtml =
    article.summary && typeof article.summary === "string"
      ? prepareRichTextHtmlForSummary(article.summary)
      : "";

  const previewImages = (article.images || []).filter(
    (url) => !!url && url !== article.cover,
  );

  const menuItems: MenuItem[] = [
    {
      label: "我不喜欢这个内容",
      icon: <HeartCrack size={20} />,
      onClick: () => {
        // TODO: 处理"不喜欢"逻辑
        console.log("dislike", article.id);
      },
    },
  ];

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
      return (
        <div
          className="mt-3 rounded-xl overflow-hidden w-62/100 relative"
          style={{ paddingTop: "35%" }}
        >
          <Image
            src={article.cover}
            alt={article?.title || "cover"}
            fill
            quality={95}
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="absolute inset-0 object-cover"
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
      return (
        <div className="mt-3 rounded-xl overflow-hidden w-1/2 relative">
          <div
            role="button"
            tabIndex={0}
            data-guarded-link-ignore="true"
            className="block w-full text-left cursor-zoom-in"
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
            <Image
              src={previewImages[0]}
              alt={article?.title || "image"}
              width={0}
              quality={95}
              height={0}
              loading="eager"
              fetchPriority="high"
              sizes="50vw"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      );
    }

    if (imageCount === 2) {
      return (
        <div className="mt-3 flex gap-2">
          {previewImages.slice(0, 2).map((img, idx) => (
            <div
              key={`${img}-${idx}`}
              role="button"
              tabIndex={0}
              data-guarded-link-ignore="true"
              className="rounded-xl overflow-hidden w-31/100 relative aspect-square cursor-zoom-in"
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
              <Image
                src={img}
                alt={`${article?.title || "image"} ${idx + 1}`}
                width={0}
                height={0}
                quality={95}
                loading="eager"
                sizes="31vw"
                className="w-full h-auto object-cover"
              />
            </div>
          ))}
        </div>
      );
    }

    const displayImages = previewImages.slice(0, 3);
    const remainingCount = imageCount - 3;

    return (
      <div className="mt-3 flex gap-2">
        {displayImages.map((img, idx) => (
          <div
            key={`${img}-${idx}`}
            role="button"
            tabIndex={0}
            data-guarded-link-ignore="true"
            className="rounded-xl overflow-hidden w-1/5 relative aspect-square inline-block cursor-zoom-in"
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
            <Image
              src={img}
              alt={`${article?.title || "image"} ${idx + 1}`}
              width={0}
              height={0}
              quality={95}
              loading="eager"
              sizes="20vw"
              className="w-full h-full object-cover"
            />
            {idx === 2 && remainingCount > 0 && (
              <div className="absolute bg-black/60 flex items-center justify-center bottom-2 right-2 rounded-full px-2 gap-1 text-white text-sm leading-3.5">
                <GalleryHorizontalEnd size={12} strokeWidth={3} />
                <span>+{remainingCount}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <article className="p-6 border-border border-b">
      <div className="flex items-center">
        <div className="flex items-center flex-1 cursor-pointer">
          <Link href={`/account/${article?.author?.id}`} className="shrink-0">
            <Avatar
              className={cn("size-12")}
              url={article.author?.avatar}
              frameUrl={article.author?.equippedDecorations?.AVATAR_FRAME?.imageUrl}
            />
          </Link>
          <div className="ml-3 flex flex-col flex-1">
            <Link href={`/account/${article?.author?.id}`} className=" flex items-center leading-5">
              <span className="font-bold hover:text-primary">
                {(article?.author?.nickname || article?.author?.username) as string}
              </span>
            </Link>
            <div className="mt-1 leading-4">
              <span className="text-xs text-secondary ">
                {formatRelativeTime(article.createdAt!, t)} {" • "}
                {article?.category?.name}
              </span>
            </div>
          </div>
          {showFollow && (
            <div className="ml-3 flex items-center w-auto">
              <FollowButtonWithStatus author={article.author} className="min-w-22" />
            </div>
          )}
        </div>
        <DropdownMenu
          trigger={
            <EllipsisVertical
              size={20}
              className="text-secondary cursor-pointer hover:text-primary"
            />
          }
          items={menuItems}
          title="更多"
          position="right"
          className="ml-2"
        />
      </div>

      <section>
        <GuardedLink href={`/article/${article.id}`}>
          <h3 className="mt-2 font-bold hover:text-primary cursor-pointer">
            {article?.title}
          </h3>
          {summaryHtml && (
            <p
              className="article-summary-html mt-1 px-0! text-secondary text-sm leading-5 line-clamp-2 overflow-hidden cursor-pointer"
              dangerouslySetInnerHTML={{ __html: summaryHtml }}
            />
          )}
          {renderMediaElement()}
        </GuardedLink>
      </section>

      {(article.tags?.length ?? 0) > 0 && (
        <div className="mt-2 flex items-center flex-wrap gap-2">
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
          <span className="ml-2 text-xs">{article.views}</span>
        </div>
        <div className="ml-2 w-20 flex items-center justify-end">
          <div className="flex items-center">
            <MessageCircleMore size={20} />
            <span className="ml-2 text-xs">{article.commentCount}</span>
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

      {previewImages.length > 0 && (
        <ImageViewer
          images={previewImages}
          initialIndex={viewerIndex}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
        />
      )}
    </article>
  );
};
