"use client";

import { cn } from "@/lib";
import { CommentList } from "@/types";
import { EllipsisVertical, Languages, MessageCircleMore, ThumbsUp } from "lucide-react";
import { Avatar } from "../ui/Avatar";

type CommentItemProps = {
  data: CommentList[number];
};
export function CommentItem({ data }: CommentItemProps) {
  return (
    <article>
      {/* User Info element */}
      <div className="px-6 py-1 flex items-center space-x-3">
        <Avatar
          className="size-10"
          alt={data.author.nickname || data.author.username}
          url={data.author.avatar}
          frameUrl={data.author?.equippedDecorations?.AVATAR_FRAME?.imageUrl}
        />
        <div className="grow w-0">
          <div className="flex items-center">
            <span className="text-sm leading-5 font-semibold">
              {data.author.nickname || data.author.username}
            </span>
          </div>
          <span className="text-xs flex-1 text-muted-foreground">
            {data.createdAt}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            title="翻译"
            className={cn(
              "flex items-center justify-center outline-none focus:outline-0 border-0",
              "cursor-pointer p-1 hover:bg-muted rounded-lg text-secondary size-7",
              "hover:text-primary",
            )}
          >
            <Languages size={20} />
          </button>
          <button
            title="翻译"
            className={cn(
              "flex items-center justify-center outline-none text-secondary focus:outline-0 border-0",
              "cursor-pointer p-1 font-semibold size-7",
            )}
          >
            <EllipsisVertical size={20} />
          </button>
        </div>
      </div>

      {/* Comment Content element */}
      <div className="py-2">
        <div className="pl-19 pr-6">
          <p className="text-sm">{data.content}</p>
        </div>
      </div>
      {/* Comment Actions element */}
      <div className="pl-19 pr-6">
        <div className="flex items-center justify-between text-secondary text-sm">
          <span className="text-xs">
            {new Date(data.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center space-x-4">
            <button
              className={cn(
                "flex items-center space-x-1 focus:outline-0 focus:border-0 border-0 outline-0",
                "cursor-pointer py-1 hover:text-primary",
              )}
            >
              <MessageCircleMore size={20} />
              <span className="text-xs">回复</span>
            </button>
            <button
              className={cn(
                "flex items-center space-x-1 focus:outline-0 focus:border-0 border-0 outline-0",
                "cursor-pointer py-1 hover:text-primary",
              )}
            >
              <ThumbsUp size={20} />
              <span className="text-xs">{data.likes}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
