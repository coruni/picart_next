import { articleControllerFindAll, categoryControllerFindAll } from "@/api";
import { ChannelArticleListClient } from "@/components/channel/ChannelArticleList.client";
import { redirect } from "next/navigation";

export default async function ChannelPage({
    params,
}: {
    params: Promise<{ slug?: string[]; locale: string }>;
}) {
    const { slug, locale } = await params;

    // 获取所有频道
    const { data: categoryData } = await categoryControllerFindAll({
        query: { page: 1, limit: 100 }
    });

    const channels = categoryData?.data.data || [];

    if (channels.length === 0) {
        return (
            <div className="page-container">
                <div className="left-container">
                    <p>暂无频道</p>
                </div>
            </div>
        );
    }

    // 如果没有 slug，重定向到第一个频道的第一个子分类
    if (!slug || slug.length === 0) {
        const firstChannel = channels[0];
        if (firstChannel.children && firstChannel.children.length > 0) {
            redirect(`/${locale}/channel/${firstChannel.id}/${firstChannel.children[0].id}`);
        }
        // 如果第一个频道没有子分类，显示提示
        return (
            <div className="page-container">
                <div className="left-container">
                    <p>该频道暂无子分类</p>
                </div>
            </div>
        );
    }

    const pid = slug[0];

    // 验证频道是否存在
    const currentChannel = channels.find((item) => item.id === Number(pid));

    if (!currentChannel) {
        // 频道不存在，重定向到第一个频道
        const firstChannel = channels[0];
        if (firstChannel.children && firstChannel.children.length > 0) {
            redirect(`/${locale}/channel/${firstChannel.id}/${firstChannel.children[0].id}`);
        }
        redirect(`/${locale}/channel/${firstChannel.id}`);
    }

    // 如果只有 slug[0]，必须重定向到第一个子分类（因为主分类没有文章）
    if (slug.length === 1) {
        if (currentChannel.children && currentChannel.children.length > 0) {
            const firstChild = currentChannel.children[0];
            redirect(`/${locale}/channel/${pid}/${firstChild.id}`);
            
        }
    }

    // slug.length >= 2
    // /channel/1/123 - 显示子分类的文章列表
    const childId = slug[1];

    // 验证子分类是否存在
    const childCategory = currentChannel.children?.find((item) => item.id === Number(childId));

    if (!childCategory) {
        // 子分类不存在，重定向到第一个子分类
        if (currentChannel.children && currentChannel.children.length > 0) {
            const firstChild = currentChannel.children[0];
            redirect(`/${locale}/channel/${pid}/${firstChild.id}`);
        }
        // 没有子分类，重定向到父分类
        redirect(`/${locale}/channel/${pid}`);
    }

    // 显示子分类的文章列表
    const { data } = await articleControllerFindAll({
        query: {
            page: 1,
            limit: 10,
            categoryId: Number(childId),
        },
    });

    const articles = data?.data.data || [];
    const total = data?.data.meta.total || 0;

    return (
        <ChannelArticleListClient
            initArticles={articles}
            initPage={2}
            initTotal={total}
            categoryId={childId}
            showFollow={true}
        />
    );
}
