import { Image, PenLine, Video } from "lucide-react";
import { GuardedLink } from "@/components/shared/GuardedLink";
import { getTranslations } from "next-intl/server";

export const ArticleCreateWidget = async () => {
  const t = await getTranslations("sidebar");

  return (
    <section className="bg-card p-4 rounded-xl">
      <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6 font-semibold mb-3">
        <span>{t("quickPost")}</span>
      </div>
      <div className="grid grid-cols-3">
        <GuardedLink
          href="/create/image"
          className="py-2 w-full h-full flex flex-col items-center justify-center hover:bg-primary/15 cursor-pointer rounded-xl"
        >
          <Image className="size-6 text-gray-500" />
          <span className="text-sm mt-2">{t("image")}</span>
        </GuardedLink>
        <GuardedLink
          href="/create/post"
          className="py-2 w-full h-full flex flex-col items-center justify-center hover:bg-primary/15 cursor-pointer rounded-xl"
        >
          <PenLine className="size-6 text-gray-500" />
          <span className="text-sm mt-2">{t("article")}</span>
        </GuardedLink>
        <GuardedLink
          href="/create/video"
          className="py-2 w-full h-full flex flex-col items-center justify-center hover:bg-primary/15 cursor-pointer rounded-xl"
        >
          <Video className="size-6 text-gray-500" />
          <span className="text-sm mt-2">{t("video")}</span>
        </GuardedLink>
      </div>
    </section>
  );
};
