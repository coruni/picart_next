"use server";

import { userControllerFindAll } from "@/api";
import { UserList } from "@/types";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { GuardedLink } from "../shared";
import { Avatar } from "../ui/Avatar";
import { FollowButtonWithStatus } from "../ui/FollowButtonWithStatus";

export const RecommendUserWidget = async () => {
  const t = await getTranslations("sidebar");

  let users: UserList = [];
  try {
    const { data } = await userControllerFindAll({
      query: {
        page: 1,
        limit: 3,
      },
    });
    users = data?.data?.data || [];
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return (
      <section className="py-4 px-2 bg-card rounded-xl">
        <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6 font-medium mb-3 px-2">
          <span>{t("recommendUsers")}</span>
        </div>
        <div className="text-center py-4 text-muted-foreground text-sm">
          {t("loadError")}
        </div>
      </section>
    );
  }

  const userCard = (user: UserList[number]) => {
    return (
      <GuardedLink
        href={`/account/${user.id}`}
        className="px-2 cursor-pointer block hover:bg-primary/15 rounded-xl pb-5"
        key={user.id}
      >
        <div className="py-2 my-1 flex items-center">
          <Avatar url={user.avatar} className=" size-8" />
          <div className="ml-3 flex-1">
            <span className="font-bold text-base leading-5 hover:text-primary">
              {user?.nickname || user?.username}
            </span>
          </div>
          <FollowButtonWithStatus className="min-w-13 max-w-16" author={user}>
            <Plus size={16} strokeWidth={3} />
          </FollowButtonWithStatus>
        </div>
        <div className="grid grid-cols-3 gap-2 pb-2">
          {user.articles?.map((article) => (
            <div
              className="size-24 relative rounded-lg overflow-hidden"
              key={article.id}
            >
              <Image
                src={article.cover}
                fill
                sizes="96px"
                className="object-cover rounded-lg"
                alt={article.title}
              />
            </div>
          ))}
        </div>
        <div
          className="px-4 flex items-center justify-center h-12 w-full bg-no-repeat"
          style={{
            backgroundImage: `url(/sidebar/recommend/recommend_user_left.png),url(/sidebar/recommend/recommend_user_right.png)`,
            backgroundSize: "24px 20px, 24px 20px",
            backgroundPosition: "left top, right bottom",
          }}
        >
          <span className="text-sm line-clamp-1 wrap-break-word text-black/65 flex-1 text-center">
            {t("quickPost")}
          </span>
        </div>
      </GuardedLink>
    );
  };

  return (
    <section className="py-4 px-2 bg-card rounded-xl">
      <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6 font-semibold mb-3 px-2">
        <span>{t("recommendUsers")}</span>
      </div>
      {users.map((user) => userCard(user))}
      <div className="px-2 mt-2">
        <span className="text-sm text-primary hover:text-primary/80 cursor-pointer">
          {t("viewMore")}
        </span>
      </div>
    </section>
  );
};
