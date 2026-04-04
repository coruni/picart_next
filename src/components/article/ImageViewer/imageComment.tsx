import { ArticleCommentList } from "@/components/comment/ArticleCommentList.client";
import { CommentEditor } from "@/components/comment/CommentEditor";
import { Avatar } from "@/components/ui/Avatar";
import { ArticleDetail, ArticleList } from "@/types";
import { ChevronRight, FileText } from "lucide-react";
import { useState } from "react";

type Article = ArticleList[number] | ArticleDetail;
type ImageCommentProps = {
  article: Article;
  minHeight?: string;
};
export function ImageComment({
  article,
  minHeight = "auto",
}: ImageCommentProps) {
  const articleId = String(article.id);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <div className="flex flex-col w-full min-h-0">
        <div className=" px-4 py-3 flex items-center space-x-3">
          <div className="flex space-x-3 flex-1">
            <Avatar
              url={article.author.avatar}
              frameUrl={
                article.author.equippedDecorations.AVATAR_FRAME.imageUrl
              }
              className="size-10"
            />
            <div className="flex grow">
              <span className="font-semibold text-sm">
                {article.author.nickname || article.author.username}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            {/* 用户操作菜单 */}
          </div>
        </div>

        <div className="mx-4 my-2 py-1 px-2 bg-muted flex items-center rounded-md text-secondary justify-between cursor-pointer">
          <div className="flex items-center flex-1 text-sm gap-2">
            <FileText size={14} />
            <span>查看原文</span>
          </div>
          <ChevronRight size={16} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0" style={{ minHeight }}>
        <div className="h-full overflow-y-auto relative">
          <ArticleCommentList
            key={refreshKey}
            articleId={articleId}
            pageSize={10}
            sortClassName="pb-2!"
            showTopCommentEditor={false}
            stickySort={true}
          />
        </div>
      </div>

      {/* 底部评论编辑器 */}
      <div className="border-t border-border bg-card px-4 py-3 shrink-0">
        <CommentEditor
          className="px-0! py-0!"
          articleId={articleId}
          onSubmitted={handleRefresh}
        />
      </div>
    </>
  );
}
