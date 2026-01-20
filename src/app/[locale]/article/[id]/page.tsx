import { articleControllerFindOne } from "@/api";
import { ArticleAuthor, ImageGallery } from "@/components/article";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { generateArticleMetadata } from "@/lib";
import { Dot, MoreHorizontal } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

type ArticleDetailPageProps = {
    params: Promise<{
        id: string;
        locale: string;
    }>;
    searchParams: Promise<{
        commentId?: string;
    }>;
};

// 动态生成元数据
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
    const { id, locale } = await params;

    // 获取文章数据用于生成 metadata
    const { data } = await articleControllerFindOne({
        path: { id }
    });
    const article = data?.data!;
    return generateArticleMetadata(article, locale);
}

export default async function ArticleDetailPage(props: ArticleDetailPageProps) {
    const { id, locale } = await props.params;
    const { commentId } = await props.searchParams;
    const t = await getTranslations();
    // 请求文章详情
    const { data } = await articleControllerFindOne({
        path: { id }
    })
    const article = data?.data
    console.log('Article ID:', id);
    console.log('Locale:', locale);
    console.log('Comment ID:', commentId);
    // 过滤js注入
    const content = article?.content?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') || '';

    return (
        <div className="page-container">
            <div className="left-container">
                {/* 顶部header */}
                <div className="px-4 h-14 flex items-center border-b rounded-t-xl border-border sticky top-[50px] bg-white dark:bg-gray-800 z-10 relative">
                    <div className="h-full flex-1 flex items-center">
                        <span className="font-bold text-base pr-6">
                            帖子详情页
                        </span>
                    </div>
                    <div className="ml-4">
                        <button className="cursor-pointer flex items-center hover:text-primary">
                            <MoreHorizontal size={20} strokeWidth={2} />
                        </button>
                    </div>
                </div>
                <section className="relative">
                    {/* 封面区域 */}
                    {article?.cover && (
                        <div className="relative w-full h-[477px]">
                            <Image
                                src={article.cover}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                quality={95}
                                className="object-cover"
                                alt={article.title}
                            />
                        </div>
                    )}
                    {/* 标题 */}
                    <div className="px-6 pt-4 mt-1">
                        <h1 className="text-[22px] wrap-break-word font-bold">{article?.title}</h1>
                    </div>
                    {/* 作者信息 */}
                    <div className="mt-4 h-14 sticky top-[99px] z-10 bg-white dark:bg-gray-800">
                        <ArticleAuthor
                            author={article?.author!}
                            createdAt={article?.createdAt!}
                        />
                    </div>
                    {/* 文章信息 */}
                    <div className="mt-4 px-6">
                        {/* 图册 */}
                        <div className="flex relative">
                            <ImageGallery images={article?.images!} />
                        </div>
                        {/* 内容 */}
                        {content && (
                            <div dangerouslySetInnerHTML={{ __html: content }}></div>
                        )}
                    </div>
                </section>
                {/* 底部信息 */}
                <div className="px-6 mt-4">
                    {/* 来自哪个分类 */}
                    <div className="text-secondary text-xs leading-4">
                        <span>{article?.category?.parent?.name} • {article?.category?.name}</span>
                    </div>
                </div>
            </div>
            <div className="right-container">
                <Sidebar />
            </div>
        </div>
    );
}
