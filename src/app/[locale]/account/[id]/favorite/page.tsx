import { articleControllerGetFavoritedArticles } from "@/api";
import { FavoriteArticleList } from "@/components/account/FavoriteArticleList.client";


export default async function AccountFavoritePage({
    params,
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const { id } = await params;
    // 加载首屏评论数据 
    const { data } = await articleControllerGetFavoritedArticles({
        query: {
            userId: Number(id),
            page: 1,
            limit: 10
        },
    })
    return (
        <FavoriteArticleList
            initArticles={data?.data.data}
            showFollow={false}
            initPage={2}
            initTotal={data?.data.meta.total!}
            id={id} />
    )
}