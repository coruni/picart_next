import { ArticleCommentList } from "@/components/comment/ArticleCommentList.client";
import { CommentEditor } from "@/components/comment/CommentEditor";
import { Avatar } from "@/components/ui/Avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { ArticleDetail, ArticleList } from "@/types";
import { ChevronRight, FileText, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback, useMemo, useState } from "react";

type Article = ArticleList[number] | ArticleDetail;
type ImageCommentProps = {
  article: Article;
  minHeight?: string;
  isExpanded?: boolean;
};

// 使用 memo 优化组件重渲染
export const ImageComment = memo(function ImageComment({
  article,
  minHeight = "auto",
}: ImageCommentProps) {
  const t = useTranslations("commentEditor");
  const articleId = String(article.id);

  // 使用 useMemo 缓存作者信息
  const authorInfo = useMemo(
    () => ({
      nickname: article.author.nickname || article.author.username,
      avatar: article.author.avatar,
      frameUrl: article.author.equippedDecorations.AVATAR_FRAME.imageUrl,
    }),
    [article.author]
  );

  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [replyParentId, setReplyParentId] = useState<number | undefined>(
    undefined
  );

  // 使用 useCallback 缓存回调函数
  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleSubmitted = useCallback(async () => {
    await handleRefresh();
    setDialogOpen(false);
    setReplyParentId(undefined);
  }, [handleRefresh]);

  const handleReplyClick = useCallback((commentId: number) => {
    setReplyParentId(commentId);
    setDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setReplyParentId(undefined);
    }
  }, []);

  const handleBottomButtonClick = useCallback(() => {
    setReplyParentId(undefined);
    setDialogOpen(true);
  }, []);

  return (
    <>
      <div className="flex flex-col w-full min-h-0">
        <div className=" px-4 py-3 flex items-center space-x-3">
          <div className="flex space-x-3 flex-1">
            <Avatar
              url={authorInfo.avatar}
              frameUrl={authorInfo.frameUrl}
              className="size-10"
            />
            <div className="flex grow">
              <span className="font-semibold text-sm">{authorInfo.nickname}</span>
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
            onReplyClick={handleReplyClick}
          />
        </div>
      </div>

      {/* 底部伪输入框 */}
      <div className="border-t border-border bg-card px-4 py-3 shrink-0">
        <button
          type="button"
          onClick={handleBottomButtonClick}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full bg-muted text-left text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <MessageCircle className="size-5" />
          <span className="text-sm">{t("placeholder")}</span>
        </button>
      </div>

      {/* 评论弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] p-0  overflow-visible">
          <DialogHeader className="">
            <DialogTitle className=" font-semibold">{t("send")}</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4">
            <CommentEditor
              className="px-0! py-0!"
              articleId={articleId}
              parentId={replyParentId}
              onSubmitted={handleSubmitted}
              minHeight={240}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
