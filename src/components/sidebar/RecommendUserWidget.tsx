"use server"
import { userControllerFindAll } from "@/api"
import { UserList } from "@/types"
import { Avatar } from "../ui/Avatar"
import { FollowButtonWithStatus } from "../ui/FollowButtonWithStatus"
import { Plus } from "lucide-react"
import Image from "next/image"
import { getTranslations } from "next-intl/server"

export const RecommendUserWidget = async () => {
    const t = await getTranslations('sidebar');
    
    let users: UserList = [];
    try {
        const { data } = await userControllerFindAll({
            query: {
                page: 1,
                limit: 3
            }
        });
        users = data?.data?.data || [];
    } catch (error) {
        console.error('Failed to fetch users:', error);
        // 返回空的组件或错误状态
        return (
            <section className="py-4 px-2 bg-card rounded-xl">
                <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6 font-medium mb-3 px-2">
                    <span>{t('recommendUsers')}</span>
                </div>
                <div className="text-center py-4 text-muted-foreground text-sm">
                    {t('loadError', { defaultValue: '加载失败' })}
                </div>
            </section>
        );
    }

    const userCard = (user: UserList[number]) => {
        return (
            <div className="px-2 cursor-pointer hover:bg-primary/15 rounded-xl pb-5" key={user.id}>
                <div className="py-2 my-1 flex items-center">
                    <Avatar url={user.avatar} size="sm" className="bg-card rounded-full" />
                    <div className="ml-3 flex-1">
                        <span className="font-bold text-base leading-5 hover:text-primary">{user?.nickname || user?.username}</span>
                    </div>
                    <FollowButtonWithStatus className="min-w-13 max-w-16" author={user} >
                        <Plus size={16} strokeWidth={3} />
                    </FollowButtonWithStatus>
                </div>
                {/* 显示图片 */}
                <div className="grid grid-cols-3 gap-2 pb-2">
                    <div className="size-24 relative rounded-lg overflow-hidden">
                        <Image src={"https://minicdn.cosfan.cc/cosplay/uploads/2025/11/23/1763915082034-fwf4y5-cosfan_cc_001.webp"} fill sizes="96px" className="object-cover rounded-lg" alt={"image-1"} />
                    </div>
                    <div className="size-24 relative rounded-lg overflow-hidden">
                        <Image src={"https://minicdn.cosfan.cc/cosplay/uploads/2025/11/23/1763915082034-fwf4y5-cosfan_cc_001.webp"} fill sizes="96px" className="object-cover rounded-lg" alt={"image-2"} />
                    </div>
                    <div className="size-24 relative rounded-lg overflow-hidden">
                        <Image src={"https://minicdn.cosfan.cc/cosplay/uploads/2025/11/23/1763915082034-fwf4y5-cosfan_cc_001.webp"} fill sizes="96px" className="object-cover rounded-lg" alt={"image-3"} />
                    </div>
                </div>
                {/* 底部 */}
                <div className="px-4 flex items-center justify-center h-12 w-full bg-no-repeat" style={{ backgroundImage: `url(/sidebar/recommend/recommend_user_left.png),url(/sidebar/recommend/recommend_user_right.png)`, backgroundSize: '24px 20px, 24px 20px', backgroundPosition: 'left top, right bottom' }}>
                    <span className="text-sm line-clamp-1 wrap-break-word text-black/65 flex-1 text-center">不知道写什么 先放着吧</span>
                </div>
            </div>
        )
    }
    return (
        <section className="py-4 px-2 bg-card rounded-xl">
            <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6 font-semibold mb-3 px-2">
                <span>{t('recommendUsers')}</span>
            </div>
            {users.map((user) => userCard(user))}
            <div className="px-2 mt-2">
                <span className="text-sm text-primary hover:text-primary/80 cursor-pointer">{t('viewMore', { defaultValue: '查看更多' })}</span>
            </div>
        </section>
    )
}