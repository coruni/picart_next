"use client";

import { ImageViewer } from "@/components/article/ImageViewer";
import { Link } from "@/i18n/routing";
import { cn, prepareRichTextHtmlForDisplay } from "@/lib";
import { CommentList } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Image as ImageIcon,
  Languages,
  MessageCircleMore,
  ThumbsUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Avatar } from "../ui/Avatar";

import "swiper/css";
import { ImageWithFallback } from "../shared/ImageWithFallback";

type CommentItemProps = {
  data: CommentList[number];
};
export function CommentItem({ data }: CommentItemProps) {
  const tComment = useTranslations("commentList");
  const tImageViewer = useTranslations("imageViewer");
  const contentHtml = prepareRichTextHtmlForDisplay(data.content || "");
  const visibleReplies = data.replies.slice(0, 2);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  const syncSwiperNavState = (swiper: SwiperType) => {
    const wrapperWidth = swiper.wrapperEl?.scrollWidth || 0;
    const containerWidth = swiper.el?.clientWidth || swiper.width || 0;
    const hasOverflow = wrapperWidth > containerWidth + 1;

    setCanScrollPrev(hasOverflow && !swiper.isBeginning);
    setCanScrollNext(hasOverflow && !swiper.isEnd);
  };

  const openImageViewer = (images: string[], index: number = 0) => {
    if (!images.length) {
      return;
    }

    setViewerImages(images);
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const handlePrevImage = () => {
    const swiper = swiperRef.current;
    if (!swiper) return;

    swiper.slidePrev();
  };

  const handleNextImage = () => {
    const swiper = swiperRef.current;
    if (!swiper) return;

    swiper.slideNext();
  };

  const getReplyTargetName = (
    reply: NonNullable<CommentList[number]["replies"]>[number],
  ) => {
    if (!reply.parent || reply.parent.id === data.id) {
      return null;
    }

    return (
      reply.parent.author?.nickname || reply.parent.author?.username || null
    );
  };

  return (
    <article>
      {/* User Info element */}
      <div className="px-6 py-1 flex items-center space-x-3">
        <Avatar
          className="size-10"
          alt={data.author.nickname || data.author.username}
          url={data.author.avatar}
          frameUrl={data.author?.equippedDecorations?.AVATAR_FRAME?.imageUrl}
        />
        <div className="grow w-0">
          <Link
            className="flex items-center"
            href={`/account/${data.author.id}`}
          >
            <span className="text-sm leading-5 font-semibold">
              {data.author.nickname || data.author.username}
            </span>
          </Link>
          <span className="text-xs flex-1 text-muted-foreground">
            {data.createdAt}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            title={tComment("translate")}
            className={cn(
              "flex items-center justify-center outline-none focus:outline-0 border-0",
              "cursor-pointer p-1 hover:bg-muted rounded-lg text-secondary size-7",
              "hover:text-primary",
            )}
          >
            <Languages size={20} />
          </button>
          <button
            title={tComment("translate")}
            className={cn(
              "flex items-center justify-center outline-none text-secondary focus:outline-0 border-0",
              "cursor-pointer p-1 font-semibold size-7",
            )}
          >
            <EllipsisVertical size={20} />
          </button>
        </div>
      </div>

      {/* Comment Content element */}
      <div className="py-2">
        <div className="pl-19 pr-6">
          <div
            className="ql-editor whitespace-pre-wrap p-0! text-sm"
            data-auto-translate-content
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
        <div className="pr-6">
          {data.images?.length === 1 && (
            <div className="mt-3 pl-19">
              <button
                type="button"
                className="inline-block cursor-pointer max-w-full overflow-hidden rounded-2xl bg-muted"
                onClick={() => openImageViewer(data.images || [], 0)}
              >
                <ImageWithFallback
                  fill
                  src={data.images[0]}
                  alt={`Comment image ${data.id}`}
                  className="block h-auto max-h-45 max-w-full object-contain"
                />
              </button>
            </div>
          )}
          {data.images?.length > 1 && (
            <div className="group relative mt-3 pl-19">
              <Swiper
                modules={[FreeMode]}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                  requestAnimationFrame(() => {
                    syncSwiperNavState(swiper);
                  });
                }}
                freeMode={{
                  enabled: true,
                  sticky: true,
                  momentumBounce: false,
                }}
                slidesPerView="auto"
                spaceBetween={12}
                onSlideChange={syncSwiperNavState}
                onResize={syncSwiperNavState}
                onUpdate={syncSwiperNavState}
                onAfterInit={syncSwiperNavState}
                onSetTranslate={syncSwiperNavState}
                onTransitionEnd={syncSwiperNavState}
                onTouchEnd={syncSwiperNavState}
                onSliderMove={syncSwiperNavState}
                onFromEdge={(swiper) => {
                  syncSwiperNavState(swiper);
                }}
              >
                {data.images.map((image, index) => (
                  <SwiperSlide
                    key={`${data.id}-image-${index}`}
                    className="w-auto!"
                  >
                    <div className="overflow-hidden rounded-2xl bg-muted">
                      <button
                        type="button"
                        className="block cursor-pointer"
                        onClick={() =>
                          openImageViewer(data.images || [], index)
                        }
                      >
                        <ImageWithFallback
                          src={image}
                          alt={`Comment image ${data.id}-${index + 1}`}
                          width={320}
                          height={180}
                          wrapperClassName="relative block"
                          className="block h-auto max-h-45 w-auto max-w-none object-contain"
                        />
                      </button>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              {canScrollPrev && (
                <button
                  type="button"
                  className="absolute left-21 top-1/2 z-8 hidden size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 md:group-hover:flex md:group-hover:opacity-100"
                  onClick={handlePrevImage}
                  aria-label={tImageViewer("prev")}
                >
                  <ChevronLeft className="size-4" />
                </button>
              )}
              {canScrollNext && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 z-8 hidden size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 md:group-hover:flex md:group-hover:opacity-100"
                  onClick={handleNextImage}
                  aria-label={tImageViewer("next")}
                >
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Comment Actions element */}
      <div className="pl-19 pr-6">
        <div className="flex items-center justify-between text-secondary text-sm mt-2">
          <span className="text-xs">
            {new Date(data.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center space-x-4">
            <button
              className={cn(
                "flex items-center space-x-1 focus:outline-0 focus:border-0 border-0 outline-0",
                "cursor-pointer py-1 hover:text-primary",
              )}
            >
              <MessageCircleMore size={20} />
              <span className="text-xs">{tComment("reply")}</span>
            </button>
            <button
              className={cn(
                "flex items-center space-x-1 focus:outline-0 focus:border-0 border-0 outline-0",
                "cursor-pointer py-1 hover:text-primary",
              )}
            >
              <ThumbsUp size={20} />
              <span className="text-xs">{data.likes}</span>
            </button>
          </div>
        </div>
      </div>
      {/* Replies element */}
      <div className="mt-3 ml-19 pr-6">
        <div className="pl-3 border-l-3 border-muted text-sm space-y-6">
          {visibleReplies.length > 0 &&
            visibleReplies.map((reply) => {
              const replyTargetName = getReplyTargetName(reply);

              return (
                <section key={reply.id}>
                  <div className="flex items-center gap-2">
                    <Avatar
                      url={reply.author?.avatar}
                      className="size-5 shrink-0"
                    />
                    <span className="font-semibold text-foreground">
                      {reply.author?.nickname || reply.author?.username}
                    </span>
                  </div>
                  <div className="mt-1.5 text-sm">
                    {replyTargetName ? (
                      <div className="flex flex-wrap items-start gap-1">
                        <span className="text-secondary">
                          {tComment("replyTo", { name: replyTargetName })}
                        </span>
                        <div
                          className="ql-editor min-w-0 flex-1 whitespace-pre-wrap p-0! text-sm"
                          data-auto-translate-content
                          dangerouslySetInnerHTML={{
                            __html: prepareRichTextHtmlForDisplay(
                              reply.content || "",
                            ),
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className="ql-editor whitespace-pre-wrap p-0! text-sm"
                        data-auto-translate-content
                        dangerouslySetInnerHTML={{
                          __html: prepareRichTextHtmlForDisplay(
                            reply.content || "",
                          ),
                        }}
                      />
                    )}
                    {reply.images?.length ? (
                      <button
                        type="button"
                        className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm text-primary hover:opacity-80"
                        onClick={() => openImageViewer(reply.images || [], 0)}
                      >
                        <ImageIcon className="size-4" />
                        <span>{tComment("viewImages")}</span>
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-secondary text-sm">
                    <span className="text-xs">
                      {new Date(reply?.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-4">
                      <button
                        className={cn(
                          "flex items-center space-x-1 focus:outline-0 focus:border-0 border-0 outline-0",
                          "cursor-pointer  hover:text-primary",
                        )}
                      >
                        <MessageCircleMore size={20} />
                        <span className="text-xs">{tComment("reply")}</span>
                      </button>
                      <button
                        className={cn(
                          "flex items-center space-x-1 focus:outline-0 focus:border-0 border-0 outline-0",
                          "cursor-pointer hover:text-primary",
                        )}
                      >
                        <ThumbsUp size={20} />
                        <span className="text-xs">{reply?.likes}</span>
                      </button>
                    </div>
                  </div>
                </section>
              );
            })}
        </div>
        {data.replies.length > 2 ? (
          <button
            type="button"
            className="inline-flex mt-4 h-8 items-center bg-muted rounded-full px-4 text-sm text-secondary transition"
          >
            {tComment("totalReplies", { count: data.replies.length })}
            <ChevronRight className="size-4" />
          </button>
        ) : null}
      </div>
      {viewerVisible && viewerImages.length > 0 && (
        <ImageViewer
          images={viewerImages}
          initialIndex={viewerIndex}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
          onChange={setViewerIndex}
          enableSidePanel={false}
        />
      )}
    </article>
  );
}
