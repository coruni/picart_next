"use client"
import type { ArticleDetail, ArticleList } from "@/types"
import Image from "next/image";
import { Avatar } from "@/components/ui/Avatar";
import { cn, formatRelativeTime } from "@/lib";
import { useTranslations } from "next-intl";
import { FollowButtonWithStatus } from "@/components/ui/FollowButtonWithStatus";
import { EllipsisVertical, Eye, FileImage, GalleryHorizontalEnd, Hash, HeartCrack, MessageCircleMore } from "lucide-react";
import { Link } from "@/i18n/routing";
import { DropdownMenu, MenuItem } from "@/components/shared";
import { ReactionPanel } from "./ReactionPanel.client";

type Article = ArticleList[number] | ArticleDetail;
type ArticleCardProps = {
    article: Article;
    showFollow: boolean;
}
export const ArticleCard = ({ article, showFollow = true }: ArticleCardProps) => {
    const t = useTranslations();

    const menuItems: MenuItem[] = [
        {
            label: "我不喜欢这个内容",
            icon: <HeartCrack size={20} />,
            onClick: () => {
                // TODO: 处理"不喜欢"逻辑
                console.log("不喜欢", article.id);
            },
        },
    ];

    // 构建封面/图片元素组件
    const MediaElement = () => {
        // 有封面图时使用封面
        if (article.cover) {
            return (
                <div className="mt-3 rounded-xl overflow-hidden w-62/100 relative" style={{ paddingTop: '35%' }}>
                    <Image
                        src={article.cover}
                        alt={article?.title!}
                        fill
                        quality={95}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="absolute inset-0 object-cover"
                    />
                    <div className="absolute bottom-2 right-2 w-6 h-4 bg-[#00000099] rounded-full flex items-center justify-center text-white">
                        <FileImage size={12} strokeWidth={3} />
                    </div>
                </div>
            );
        }

        // 没有封面但有图片时
        if (article.images && article.images.length > 0) {
            const imageCount = article.images.length;

            // 单张图片 - 50% 宽度
            if (imageCount === 1) {
                return (
                    <div className="mt-3 rounded-xl overflow-hidden w-1/2 relative">
                        <Image
                            src={article.images[0]}
                            alt={article?.title!}
                            width={0}
                            quality={95}
                            height={0}
                            sizes="50vw"
                            className="w-full h-auto object-cover"
                        />
                    </div>
                );
            }

            // 两张图片 - 每张 31% 宽度
            if (imageCount === 2) {
                return (
                    <div className="mt-3 flex gap-2">
                        {article.images.slice(0, 2).map((img, idx) => (
                            <div key={idx} className="rounded-xl overflow-hidden w-31/100 relative aspect-square">
                                <Image
                                    src={img}
                                    alt={`${article?.title} ${idx + 1}`}
                                    width={0}
                                    height={0}
                                    quality={95}
                                    sizes="31vw"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        ))}
                    </div>
                );
            }

            // 三张及以上图片 - 每张 20% 宽度，最多显示3张
            const displayImages = article.images.slice(0, 3);
            const remainingCount = (article.imageCount) as number - 3;

            return (
                <div className="mt-3 flex gap-2">
                    {displayImages.map((img, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden w-1/5 relative aspect-square inline-block">
                            <Image
                                src={img}
                                alt={`${article?.title} ${idx + 1}`}
                                width={0}
                                height={0}
                                quality={95}
                                sizes="20vw"
                                className="w-full h-full object-cover"
                            />
                            {/* 第三张图片且还有剩余时显示遮罩 */}
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
        }

        return null;
    };

    return (
        <article className="p-6 border-border border-b">
            <div className="flex items-center">
                <div className="flex items-center flex-1 cursor-pointer">
                    {/* 头像 */}
                    <Link href={`/account/${article?.author?.id}`} className="shrink-0">
                        <Avatar
                            className={cn("size-12")}
                            url={article.author?.avatar}
                            frameUrl={article.author?.equippedDecorations?.AVATAR_FRAME?.imageUrl}
                        />
                    </Link>
                    {/* 用户名 */}
                    <div className="ml-3 flex flex-col flex-1">
                        <Link href={`/account/${article?.author?.id}`} className=" flex items-center leading-5">
                            <span className="font-bold hover:text-primary">{(article?.author?.nickname || article?.author?.username) as string}</span>
                        </Link>
                        <div className="mt-1 leading-4">
                            <span className="text-xs text-secondary">{formatRelativeTime(article.createdAt!, t)} · {article?.category?.name}</span>
                        </div>
                    </div>
                    {/* 关注 */}
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
            {/* 内容 */}
            <section className="cursor-pointer">
                <Link href={`/article/${article.id}`}>
                    <h3 className="mt-2 font-bold hover:text-primary">{article?.title}</h3>
                    {article.summary && typeof article.summary === 'string' && (
                        <p className="leading-5 text-secondary text-sm line-clamp-4 text-ellipsis">{article.summary}</p>
                    )}
                    <MediaElement />
                </Link>

            </section>
            {/* 标签 */}
            {article.tags?.length! > 0 && (
                <div className="mt-2 flex items-center flex-wrap gap-2">
                    {article.tags?.map((tag) => (
                        <Link href={`/topic/${tag?.id}`} className="flex space-x-0.5 items-center text-sm text-primary hover:opacity-80 cursor-pointer" key={tag.id}>
                            <Hash size={14} strokeWidth={2} />
                            <span>{tag?.name}</span>
                        </Link>
                    ))
                    }
                </div>
            )}

            {/* 互动 */}
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
                        userReaction={article.userReaction}
                    />
                </div>
            </div>
        </article >
    )
}