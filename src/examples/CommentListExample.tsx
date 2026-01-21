"use client";

import { CommentListClient } from "@/components/account/CommentList.client";
import { commentControllerFindAll } from "@/api";

// Mock comment data for testing
const mockComments = [
  {
    id: 1,
    content: "这是一个很棒的文章！感谢分享这么有价值的内容。",
    createdAt: "2024-01-20T10:30:00Z",
    updatedAt: "2024-01-20T10:30:00Z",
    likeCount: 12,
    replyCount: 3,
    isLiked: false,
    user: {
      id: 1,
      username: "user123",
      nickname: "张三",
      avatar: "/placeholder/avatar_placeholder.png"
    },
    replies: [
      {
        id: 2,
        content: "同意！作者写得很详细。",
        createdAt: "2024-01-20T11:00:00Z",
        updatedAt: "2024-01-20T11:00:00Z",
        likeCount: 5,
        replyCount: 0,
        isLiked: true,
        user: {
          id: 2,
          username: "user456",
          nickname: "李四",
          avatar: "/placeholder/avatar_placeholder.png"
        }
      },
      {
        id: 3,
        content: "我也学到了很多新知识。",
        createdAt: "2024-01-20T11:15:00Z",
        updatedAt: "2024-01-20T11:15:00Z",
        likeCount: 2,
        replyCount: 0,
        isLiked: false,
        user: {
          id: 3,
          username: "user789",
          nickname: "王五",
          avatar: "/placeholder/avatar_placeholder.png"
        }
      }
    ]
  },
  {
    id: 4,
    content: "有个小问题想请教一下，关于第三部分的内容，能否详细解释一下？",
    createdAt: "2024-01-20T09:45:00Z",
    updatedAt: "2024-01-20T09:45:00Z",
    likeCount: 8,
    replyCount: 1,
    isLiked: false,
    user: {
      id: 4,
      username: "curious_reader",
      nickname: "好奇的读者",
      avatar: "/placeholder/avatar_placeholder.png"
    },
    replies: [
      {
        id: 5,
        content: "我也有同样的疑问，期待作者的回复。",
        createdAt: "2024-01-20T10:00:00Z",
        updatedAt: "2024-01-20T10:00:00Z",
        likeCount: 3,
        replyCount: 0,
        isLiked: false,
        user: {
          id: 5,
          username: "student",
          nickname: "学习者",
          avatar: "/placeholder/avatar_placeholder.png"
        }
      }
    ]
  },
  {
    id: 6,
    content: "非常实用的教程，已经收藏了！👍",
    createdAt: "2024-01-20T08:20:00Z",
    updatedAt: "2024-01-20T08:20:00Z",
    likeCount: 15,
    replyCount: 0,
    isLiked: true,
    user: {
      id: 6,
      username: "tech_lover",
      nickname: "技术爱好者",
      avatar: "/placeholder/avatar_placeholder.png"
    }
  }
];

export function CommentListExample() {
  // Mock fetch function
  const mockFetchComments = async (params: any) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response structure
    return {
      data: {
        data: {
          data: [], // No more comments for demo
          meta: {
            total: mockComments.length,
            page: params.query.page,
            limit: params.query.limit
          }
        }
      }
    };
  };

  const handleLikeComment = (commentId: number) => {
    console.log("Like comment:", commentId);
  };

  const handleReplyComment = (commentId: number) => {
    console.log("Reply to comment:", commentId);
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-8">CommentList Component Example</h1>
      
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-6">评论列表</h2>
          
          <CommentListClient
            initPage={1}
            initTotal={mockComments.length}
            initComments={mockComments}
            id="123"
            fetchComments={mockFetchComments}
            onLikeComment={handleLikeComment}
            onReplyComment={handleReplyComment}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg max-w-2xl mx-auto">
        <h3 className="font-semibold mb-2">Features:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Infinite scroll loading with intersection observer</li>
          <li>• Like and reply functionality for comments</li>
          <li>• Nested replies with expandable view</li>
          <li>• Responsive design with proper spacing</li>
          <li>• Loading states and error handling</li>
          <li>• Internationalization support</li>
          <li>• Time formatting (relative time display)</li>
          <li>• Empty state when no comments</li>
        </ul>
      </div>
    </div>
  );
}