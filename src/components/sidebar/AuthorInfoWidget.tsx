import { ArticleDetail, UserList } from "@/types";
import { Avatar } from "../ui/Avatar";
import { FollowButtonWithStatus } from "../ui/FollowButtonWithStatus";
import { Plus } from "lucide-react";

type AuthorInfoWidgetProps = {
    author?: ArticleDetail['author']
}
export const AuthorInfoWidget = ({ author }: AuthorInfoWidgetProps) => {
    return (
        <section className="bg-card p-4 rounded-xl">
            <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6 font-semibold mb-3">
                <span>作者信息</span>
            </div>
            <div className="flex items-center  space-x-3">
                <Avatar url={author?.avatar} size="lg" />
                <div className="flex-1">
                    <span className="font-medium">{author?.nickname || author?.username}</span>
                </div>
                <FollowButtonWithStatus author={author!} size="md">
                    <Plus size={16} strokeWidth={3}/>
                </FollowButtonWithStatus>
            </div>
        </section>
    )

};