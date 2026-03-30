"use client"

import { Link } from "@/i18n/routing"
import { TagList } from "@/types"
import { ChevronRight, Hash } from "lucide-react"
import { useTranslations } from "next-intl"

type TopicCardProps = {
    tag: TagList[number]
}
export const TopicCard = ({ tag }: TopicCardProps) => {
    const t = useTranslations("tagCard")

    return (
        <Link href={`/topic/${tag.id}`} className="group p-4 flex items-center space-x-4 rounded-xl cursor-pointer hover:bg-primary/15">
            <div className="flex-1 flex flex-col">
                <div data-auto-translate-content className="flex items-center space-x-2">
                    <div className="relative flex size-4 shrink-0 items-center justify-center rounded-full bg-primary p-0.5 text-white after:absolute after:bottom-0 after:right-0 after:h-0 after:w-0 after:border-l-[6px] after:border-l-primary after:border-t-[6px] after:border-t-transparent after:content-[''] after:-rotate-90">
                        <Hash size={14} strokeWidth={2} />
                    </div>
                    <span className="font-semibold">{tag.name}</span>
                </div>
                <div data-auto-translate-content className="py-2 leading-4">
                    <span className="text-secondary text-xs">{tag.description}</span>
                </div>
                <span className="text-xs text-secondary">
                    {tag.articleCount} {t("posts")} / {tag.followCount} {t("members")}
                </span>
            </div>
            <div className="flex items-center">
                <ChevronRight size={16} className="text-secondary" />
            </div>
        </Link>
    )
}
