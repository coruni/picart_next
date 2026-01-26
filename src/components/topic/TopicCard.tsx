"use client"

import { TagList } from "@/types"
import { ChevronRight, Hash } from "lucide-react"
import { useTranslations } from "next-intl"

type TagCardProps = {
    tag: TagList[number]
}
export const TagCard = ({ tag }: TagCardProps) => {
    const t = useTranslations("tagCard")
    
    return (
        <div className="p-4 flex items-center space-x-4 rounded-xl cursor-pointer hover:bg-primary/15">
            <div className="flex-1 flex flex-col">
                <div className="flex items-center space-x-2">
                    <div className="rounded-full p-1 text-white bg-primary">
                        <Hash size={14} strokeWidth={2} />
                    </div>
                    <span className="font-semibold">{tag.name}</span>
                </div>
                <div className="py-2 leading-4">
                    <span className="text-secondary text-xs">{tag.description}</span>
                </div>
                <span className="text-xs text-secondary">
                    {tag.articleCount} {t("posts")} / {tag.followCount} {t("members")}
                </span>
            </div>
            <div className="flex items-center">
                <ChevronRight size={16} className="text-secondary"/>
            </div>
        </div>
    )
}