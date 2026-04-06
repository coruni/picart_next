import type {
  AchievementControllerFindAllResponse,
  CategoryControllerFindAllResponse,
  CommentControllerFindAllCommentsResponse,
  ConfigControllerGetAdvertisementConfigResponse,
  ConfigControllerGetPublicConfigsResponse,
  OrderControllerGetAllOrdersResponse,
  PermissionControllerFindAllResponse,
} from "@/api";
import type {
  ArticleList,
  BannerList,
  ConfigList,
  DecorationList,
  RolePaginated,
  TagList,
  UserList,
  UserProfile,
} from "@/types";

export type DashboardUserItem = UserList[number];
export type DashboardArticleItem = ArticleList[number];
export type DashboardTagItem = TagList[number];
export type DashboardCategoryItem =
  NonNullable<CategoryControllerFindAllResponse["data"]>["data"][number];
export type DashboardRoleItem = RolePaginated[number];
export type DashboardPermissionItem =
  NonNullable<PermissionControllerFindAllResponse["data"]["data"]>[number];
export type DashboardBannerItem = BannerList[number];
export type DashboardCommentItem =
  NonNullable<CommentControllerFindAllCommentsResponse["data"]>["data"][number];
export type DashboardOrderItem =
  NonNullable<OrderControllerGetAllOrdersResponse["data"]>["data"][number];
export type DashboardConfigItem = ConfigList[number];
export type DashboardDecorationItem = DecorationList[number];
export type DashboardReportItem = Record<string, unknown>;
export type DashboardAchievementItem =
  NonNullable<AchievementControllerFindAllResponse["data"]>[number];
export type DashboardPublicConfig = NonNullable<
  ConfigControllerGetPublicConfigsResponse["data"]
>;
export type DashboardAdvertisementConfig = NonNullable<
  ConfigControllerGetAdvertisementConfigResponse["data"]
>;

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
  publicConfig: DashboardPublicConfig | null;
  advertisementConfig: DashboardAdvertisementConfig | null;
  pendingOrderNos: string[];
};

export type DashboardHotSearchItem = {
  id?: number;
  keyword: string;
  count: number;
  createdAt?: string;
  updatedAt?: string;
};
