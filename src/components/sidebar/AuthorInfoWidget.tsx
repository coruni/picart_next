import { ArticleDetail } from "@/types";
import { Check, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Avatar } from "../ui/Avatar";
import { FollowButtonWithStatus } from "../ui/FollowButtonWithStatus";

type AuthorInfoWidgetProps = {
  author?: ArticleDetail["author"];
};

export const AuthorInfoWidget = async ({ author }: AuthorInfoWidgetProps) => {
  const t = await getTranslations("sidebar");

  return (
    <section className="bg-card p-4 rounded-xl">
      <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6 font-semibold mb-3">
        <span>{t("authorInfo")}</span>
      </div>
      <div className="flex items-center space-x-3">
        <Avatar url={author?.avatar} className="size-12" />
        <div className="flex-1">
          <span className="font-medium">
            {author?.nickname || author?.username}
          </span>
        </div>
        <FollowButtonWithStatus author={author!} forceShow>
          {author?.isFollowed ? (
            <>
              <Check size={16} strokeWidth={3} />
            </>
          ) : (
            <>
              <Plus size={16} strokeWidth={3} />
            </>
          )}
        </FollowButtonWithStatus>
      </div>
    </section>
  );
};
