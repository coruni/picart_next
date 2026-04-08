"use client";

import { useState } from "react";
import { ArticleActions } from "./ArticleActions.client";
import { ReactionStats } from "./ReactionStats.client";

type ReactionStatsType = {
  like: number;
  love: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
  dislike: number;
};

interface ArticleReactionWrapperProps {
  articleId: string;
  initialStats: Record<string, number>;
  initialUserReaction?: string;
  commentCount: number;
  favoriteCount: number;
  initialIsFavorited: boolean;
  likes: number;
}

export function ArticleReactionWrapper({
  articleId,
  initialStats,
  initialUserReaction,
  commentCount,
  favoriteCount,
  initialIsFavorited,
  likes: initialLikes,
}: ArticleReactionWrapperProps) {
  const [reactionStats, setReactionStats] = useState<Record<string, number>>(initialStats);
  const [userReaction, setUserReaction] = useState<string | undefined>(initialUserReaction);
  const [likes, setLikes] = useState(initialLikes);

  const handleReactionChange = (newStats: ReactionStatsType, newUserReaction?: string) => {
    const statsRecord: Record<string, number> = {
      like: newStats.like || 0,
      love: newStats.love || 0,
      haha: newStats.haha || 0,
      wow: newStats.wow || 0,
      sad: newStats.sad || 0,
      angry: newStats.angry || 0,
      dislike: newStats.dislike || 0,
    };
    setReactionStats(statsRecord);
    setUserReaction(newUserReaction);
    const totalLikes = Object.values(statsRecord).reduce((sum, count) => sum + count, 0);
    setLikes(totalLikes);
  };

  return (
    <>
      <ReactionStats
        articleId={articleId}
        initialUserReaction={initialUserReaction}
        initialStats={initialStats}
        stats={reactionStats}
        userReaction={userReaction}
      />
      <ArticleActions
        articleId={Number(articleId)}
        commentCount={commentCount}
        favoriteCount={favoriteCount}
        initialIsFavorited={initialIsFavorited}
        reactionStats={{
          like: reactionStats.like || 0,
          love: reactionStats.love || 0,
          haha: reactionStats.haha || 0,
          wow: reactionStats.wow || 0,
          sad: reactionStats.sad || 0,
          angry: reactionStats.angry || 0,
          dislike: reactionStats.dislike || 0,
        }}
        userReaction={userReaction}
        likes={likes}
        onReactionChange={handleReactionChange}
      />
    </>
  );
}
