import type {
  CommentControllerFindAllCommentsResponse,
  OrderControllerGetAllOrdersResponse,
} from "@/api";
import type { ArticleList, ConfigList, UserList, UserProfile } from "@/types";

export type DashboardUserItem = UserList[number];
export type DashboardArticleItem = ArticleList[number];
export type DashboardCommentItem =
  NonNullable<CommentControllerFindAllCommentsResponse["data"]>["data"][number];
export type DashboardOrderItem =
  NonNullable<OrderControllerGetAllOrdersResponse["data"]>["data"][number];
export type DashboardConfigItem = ConfigList[number];

export type DashboardSummary = {
  usersTotal: number;
  articlesTotal: number;
  commentsTotal: number;
  ordersTotal: number;
  pendingOrdersTotal: number;
  configsTotal: number;
};

export type DashboardOverviewData = {
  user: UserProfile;
  summary: DashboardSummary;
  users: DashboardUserItem[];
  articles: DashboardArticleItem[];
  comments: DashboardCommentItem[];
  orders: DashboardOrderItem[];
  configs: DashboardConfigItem[];
};
