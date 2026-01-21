import { commentControllerGetUserComments } from "@/api";

export default async function AccountCommentPage({
    params,
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const { id } = await params;
    // 加载首屏评论数据 
    const { data } = await commentControllerGetUserComments({
        path: { userId: id }
    })
    console.log('data', data)
    return (
        <div>123123</div>
    )
}