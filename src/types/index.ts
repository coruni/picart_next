/**
 * 通用类型定义
 * - 先导出 `api.ts` 中按领域整理的类型。
 * - 再基于响应类型提取业务常用数据结构。
 */

// 重新导出所有 API 相关类型
export * from "./api";

import type {
  ArticleControllerFindAllResponse,
  ArticleControllerFindByAuthorResponse,
  ArticleControllerFindOneResponse,
  ArticleControllerFindRecommendationsResponse,
  ArticleControllerGetBrowseHistoryResponse,
  ArticleControllerSearchResponse,
  BannerControllerFindActiveResponse,
  BannerControllerFindAllResponse,
  BannerControllerFindOneResponse,
  CategoryControllerFindAllResponse,
  CategoryControllerFindOneResponse,
  CommentControllerFindAllResponse,
  CommentControllerFindOneResponse,
  CommentControllerGetUserCommentsResponse,
  CollectionControllerFindOneResponse,
  ConfigControllerFindAllResponse,
  ConfigControllerFindByGroupResponse,
  ConfigControllerGetAdvertisementConfigResponse,
  ConfigControllerGetPublicConfigsResponse,
  DecorationControllerFindAllResponse,
  DecorationControllerFindOneResponse,
  DecorationControllerGetCurrentDecorationsResponse,
  DecorationControllerGetMyDecorationsResponse,
  MessageControllerFindAllResponse,
  MessageControllerFindOneResponse,
  MessageControllerGetUnreadCountResponse,
  PermissionControllerFindAllResponse,
  ReportControllerFindAllResponses,
  ReportControllerFindOneResponses,
  ReportControllerGetStatisticsResponses,
  RoleControllerFindAllResponse,
  RoleControllerFindOneResponse,
  RoleControllerFindWithPaginationResponse,
  TagControllerFindAllResponse,
  TagControllerFindOneResponse,
  UploadControllerFindAllResponse,
  UploadControllerUploadFileResponse,
  UserControllerFindAllResponse,
  UserControllerFindOneResponse,
  UserControllerGetProfileResponse,
  UserControllerGetUserConfigResponse,
  UserControllerGetWalletBalanceResponse,
  UserControllerGetWalletTransactionsResponse,
  UserControllerLoginResponse,
  UserControllerRegisterUserResponse,
} from "@/api/types.gen";

type FirstResponse<T> = T[keyof T];

// ==================== 基于响应提取的数据类型 ====================

// 用户
export type UserProfile = NonNullable<UserControllerGetProfileResponse["data"]>;
export type UserList = NonNullable<UserControllerFindAllResponse["data"]["data"]>;
export type UserDetail = NonNullable<UserControllerFindOneResponse["data"]>;
export type LoginResult = NonNullable<UserControllerLoginResponse["data"]>;
export type RegisterResult = NonNullable<UserControllerRegisterUserResponse["data"]>;
export type WalletBalance = NonNullable<UserControllerGetWalletBalanceResponse["data"]["data"]>;
export type WalletTransactions = NonNullable<UserControllerGetWalletTransactionsResponse["data"]["data"]>;
export type UserConfigData = NonNullable<UserControllerGetUserConfigResponse["data"]>;

// 文章
export type ArticleList = NonNullable<ArticleControllerFindAllResponse["data"]["data"]>;
export type ArticleUserList = NonNullable<ArticleControllerFindByAuthorResponse["data"]["data"]>;
export type ArticleDetail = NonNullable<ArticleControllerFindOneResponse["data"]>;
export type ArticleSearchResult = NonNullable<ArticleControllerSearchResponse["data"]["data"]>;
export type ArticleRecommendations = NonNullable<ArticleControllerFindRecommendationsResponse["data"]["data"]>;
export type BrowseHistory = NonNullable<ArticleControllerGetBrowseHistoryResponse["data"]>;

// 角色与权限
export type RoleList = NonNullable<RoleControllerFindAllResponse["data"]["data"]>;
export type RoleDetail = NonNullable<RoleControllerFindOneResponse["data"]>;
export type RolePaginated = NonNullable<RoleControllerFindWithPaginationResponse["data"]["data"]>;
export type PermissionList = PermissionControllerFindAllResponse;

// 分类与标签
export type CategoryList = NonNullable<CategoryControllerFindAllResponse["data"]["data"]>;
export type CategoryDetail = NonNullable<CategoryControllerFindOneResponse["data"]>;
export type TagList = NonNullable<TagControllerFindAllResponse["data"]["data"]>;
export type TagDetail = NonNullable<TagControllerFindOneResponse["data"]>;

// 装饰
export type DecorationList = NonNullable<DecorationControllerFindAllResponse["data"]["data"]>;
export type DecorationDetail = NonNullable<DecorationControllerFindOneResponse["data"]>;
export type MyDecorations = NonNullable<DecorationControllerGetMyDecorationsResponse["data"]["data"]>;
export type CurrentDecorations = NonNullable<DecorationControllerGetCurrentDecorationsResponse["data"]>;

// 消息
export type MessageList = NonNullable<MessageControllerFindAllResponse["data"]["data"]>;
export type MessageDetail = NonNullable<MessageControllerFindOneResponse["data"]>;
export type UnreadCount = NonNullable<MessageControllerGetUnreadCountResponse["data"]>;

// 配置
export type ConfigList = NonNullable<ConfigControllerFindAllResponse["data"]["data"]>;
export type ConfigByGroup = NonNullable<ConfigControllerFindByGroupResponse["data"]["data"]>;
export type PublicConfigs = NonNullable<ConfigControllerGetPublicConfigsResponse["data"]>;
export type AdvertisementConfig = NonNullable<ConfigControllerGetAdvertisementConfigResponse["data"]>;

// 上传
export type UploadList = UploadControllerFindAllResponse;
export type UploadResultData = UploadControllerUploadFileResponse;

// Banner
export type BannerList = NonNullable<BannerControllerFindAllResponse["data"]["data"]>;
export type BannerDetail = NonNullable<BannerControllerFindOneResponse["data"]>;
export type ActiveBanners = NonNullable<BannerControllerFindActiveResponse["data"]>;

// 举报
export type ReportList = FirstResponse<ReportControllerFindAllResponses>;
export type ReportDetail = FirstResponse<ReportControllerFindOneResponses>;
export type ReportStatistics = FirstResponse<ReportControllerGetStatisticsResponses>;

// 评论
export type AllComments = NonNullable<CommentControllerFindAllResponse["data"]["data"]>;
export type CommentList = NonNullable<CommentControllerFindOneResponse["data"]["data"]>;
export type UserCommentList = NonNullable<CommentControllerGetUserCommentsResponse["data"]["data"]>;
export type CollectionDetail = NonNullable<CollectionControllerFindOneResponse["data"]>;

// ==================== 通用结构类型 ====================

import "./translate";

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 通用分页响应
export interface PaginationResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 本地用户信息（扩展）
export interface User {
  id: string;
  username: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  wallet?: number;
  points?: number;
  createdAt: string;
  updatedAt: string;
}

// 表单字段错误
export interface FieldError {
  field: string;
  message: string;
}

// 通用选项
export interface Option<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

// 菜单项
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
}

// 上传文件状态
export interface UploadFile {
  uid: string;
  name: string;
  status: "uploading" | "done" | "error";
  url?: string;
  percent?: number;
}

// 表格列定义
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  width?: number;
  align?: "left" | "center" | "right";
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: boolean;
  fixed?: "left" | "right";
}

// 排序参数
export interface SortParams {
  field: string;
  order: "asc" | "desc";
}

// 过滤参数
export interface FilterParams {
  [key: string]: any;
}
