"use client";

import { useState } from "react";
import { ArticleActions } from "./ArticleActions.client";
import { ReactionStats } from "./ReactionStats.client";

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

  const handleReactionChange = (newStats: Record<string, number>, newUserReaction?: string | null) => {
    setReactionStats(newStats);
    setUserReaction(newUserReaction || undefined);
    const totalLikes = Object.values(newStats).reduce((sum, count) => sum + count, 0);
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
        onReactionChange={handleReactionChange}
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
