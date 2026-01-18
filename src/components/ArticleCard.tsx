import type { ArticleList } from "@/types"
import Image from "next/image";
import { Avatar } from "./ui/Avatar";
import { formatRelativeTime } from "@/lib";
import { useTranslations } from "next-intl";
import { Button } from "./ui/Button";
import { FollowButtonWithStatus } from "./ui/FollowButtonWithStatus";
import { EllipsisVertical, Eye, FileImage, GalleryHorizontalEnd, Hash, MessageCircleMore, ThumbsUp } from "lucide-react";
import Link from "next/link";
type Article = ArticleList[number];
type ArticleCardProps = {
    article: Article;
}
export const ArticleCard = ({ article }: ArticleCardProps) => {
    const t = useTranslations();

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
                    <Avatar size="lg" url={article.author?.avatar} avatarFrame={article.author?.equippedDecorations?.AVATAR_FRAME?.imageUrl || ''} />
                    {/* 用户名 */}
                    <div className="ml-3 flex flex-col flex-1">
                        <div className=" flex items-center leading-5">
                            <span className="font-bold hover:text-primary">{(article?.author?.nickname || article?.author?.username) as string}</span>
                        </div>
                        <div className="mt-1 leading-4">
                            <span className="text-xs text-secondary">{formatRelativeTime(article.createdAt!, t)} · {article?.category?.name}</span>
                        </div>
                    </div>
                    {/* 关注 */}
                    <div className="ml-3 flex items-center w-auto">
                        <FollowButtonWithStatus author={article.author} />
                    </div>

                </div>
                <div className="ml-3">
                    <div className="relative">
                        <EllipsisVertical size={20} className="text-secondary cursor-pointer" />
                    </div>
                </div>
            </div>
            {/* 内容 */}
            <section className="cursor-pointer">
                <Link href={`/article/${article.id}`}>
                    <h3 className="mt-2 font-bold hover:text-primary">{article?.title}</h3>
                    {article.summary && (
                        <p className="leading-5 text-secondary">{article?.summary}</p>
                    )}
                    <MediaElement />
                </Link>

            </section>
            {/* 标签 */}
            {article.tags?.length! > 0 && (
                <div className="mt-2 flex items-center flex-wrap gap-2">
                    {article.tags?.map((tag) => (
                        <div className="flex items-center text-sm text-primary hover:opacity-80 cursor-pointer" key={tag.id}>
                            <Hash size={16} strokeWidth={2} />
                            <span>{tag.name}</span>
                        </div>
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
                    <div className="flex items-center">
                        <ThumbsUp size={20} />
                        <span className="ml-2 text-xs">{article.likes}</span>
                    </div>
                </div>
            </div>
        </article >
    )
}