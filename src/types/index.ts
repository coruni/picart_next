/**
 * 通用类型定义
 * 从生成的 API 类型中导出常用类型
 */

// 重新导出所有 API 类型
export * from "./api";

// 从生成的 API 类型中导出常用基础类型
export type {
  BaseResponseDto as ApiResponse,
  PaginatedResponseDto,
  ListResponseDto,
} from "@/api/generated/types.gen";

// 导入响应类型用于提取数据类型
import type {
  UserControllerGetProfileResponse,
  UserControllerFindAllResponse,
  UserControllerLoginResponse,
  UserControllerRegisterUserResponse,
  UserControllerGetWalletBalanceResponse,
  UserControllerGetWalletTransactionsResponse,
  UserControllerGetUserConfigResponse,
  ArticleControllerFindAllResponse,
  ArticleControllerFindOneResponse,
  ArticleControllerSearchResponse,
  ArticleControllerFindRecommendationsResponse,
  ArticleControllerGetBrowseHistoryResponse,
  RoleControllerFindAllResponse,
  RoleControllerFindOneResponse,
  RoleControllerFindWithPaginationResponse,
  PermissionControllerFindAllResponse,
  CategoryControllerFindAllResponse,
  CategoryControllerFindOneResponse,
  TagControllerFindAllResponse,
  TagControllerFindOneResponse,
  FavoriteControllerFindAllResponse,
  FavoriteControllerFindOneResponse,
  DecorationControllerFindAllResponse,
  DecorationControllerFindOneResponse,
  DecorationControllerGetMyDecorationsResponse,
  DecorationControllerGetCurrentDecorationsResponse,
  MessageControllerFindAllResponse,
  MessageControllerFindOneResponse,
  MessageControllerGetUnreadCountResponse,
  ConfigControllerFindAllResponse,
  ConfigControllerFindByGroupResponse,
  ConfigControllerGetPublicConfigsResponse,
  ConfigControllerGetAdvertisementConfigResponse,
  UploadControllerFindAllResponse,
  UploadControllerGetFileInfoResponse,
  UploadControllerUploadFileResponse,
  BannerControllerFindAllResponse,
  BannerControllerFindOneResponse,
  BannerControllerFindActiveResponse,
  ReportControllerFindAllResponse,
  ReportControllerFindOneResponse,
  ReportControllerGetStatisticsResponse,
} from "@/api/generated/types.gen";

// ==================== 从响应类型中提取数据类型 ====================

// 用户相关数据类型
export type UserProfile = NonNullable<UserControllerGetProfileResponse["data"]>;
export type UserList = NonNullable<UserControllerFindAllResponse["data"]>;
export type LoginResult = NonNullable<UserControllerLoginResponse["data"]>;
export type RegisterResult = NonNullable<UserControllerRegisterUserResponse["data"]>;
export type WalletBalance = NonNullable<UserControllerGetWalletBalanceResponse["data"]['data']>;
export type WalletTransactions = NonNullable<UserControllerGetWalletTransactionsResponse["data"]['data']>;
export type UserConfigData = NonNullable<UserControllerGetUserConfigResponse["data"]>;

// 文章相关数据类型
export type ArticleList = NonNullable<ArticleControllerFindAllResponse["data"]['data']>;
export type ArticleDetail = NonNullable<ArticleControllerFindOneResponse["data"]>;
export type ArticleSearchResult = NonNullable<ArticleControllerSearchResponse["data"]['data']>;
export type ArticleRecommendations = NonNullable<ArticleControllerFindRecommendationsResponse["data"]['data']>;
export type BrowseHistory = NonNullable<ArticleControllerGetBrowseHistoryResponse["data"]>;

// 角色和权限数据类型
export type RoleList = NonNullable<RoleControllerFindAllResponse["data"]['data']>;
export type RoleDetail = NonNullable<RoleControllerFindOneResponse["data"]>;
export type RolePaginated = NonNullable<RoleControllerFindWithPaginationResponse["data"]['data']>;
export type PermissionList = PermissionControllerFindAllResponse;

// 分类和标签数据类型
export type CategoryList = NonNullable<CategoryControllerFindAllResponse["data"]['data']>;
export type CategoryDetail = NonNullable<CategoryControllerFindOneResponse["data"]>;
export type TagList = NonNullable<TagControllerFindAllResponse["data"]['data']>;
export type TagDetail = NonNullable<TagControllerFindOneResponse["data"]>;

// 收藏相关数据类型
export type FavoriteList = NonNullable<FavoriteControllerFindAllResponse["data"]['data']>;
export type FavoriteDetail = NonNullable<FavoriteControllerFindOneResponse["data"]>;

// 装饰相关数据类型
export type DecorationList = NonNullable<DecorationControllerFindAllResponse["data"]['data']>;
export type DecorationDetail = NonNullable<DecorationControllerFindOneResponse["data"]>;
export type MyDecorations = NonNullable<DecorationControllerGetMyDecorationsResponse["data"]['data']>;
export type CurrentDecorations = NonNullable<DecorationControllerGetCurrentDecorationsResponse["data"]>;

// 消息相关数据类型
export type MessageList = NonNullable<MessageControllerFindAllResponse["data"]['data']>;
export type MessageDetail = NonNullable<MessageControllerFindOneResponse["data"]>;
export type UnreadCount = NonNullable<MessageControllerGetUnreadCountResponse["data"]>;

// 配置相关数据类型
export type ConfigList = NonNullable<ConfigControllerFindAllResponse["data"]['data']>;
export type ConfigByGroup = NonNullable<ConfigControllerFindByGroupResponse["data"]['data']>;
export type PublicConfigs = NonNullable<ConfigControllerGetPublicConfigsResponse["data"]>;
export type AdvertisementConfig = NonNullable<ConfigControllerGetAdvertisementConfigResponse["data"]>;

// 上传相关数据类型
export type UploadList = UploadControllerFindAllResponse;
export type FileInfo = UploadControllerGetFileInfoResponse;
export type UploadResultData = UploadControllerUploadFileResponse;

// Banner 相关数据类型
export type BannerList = NonNullable<BannerControllerFindAllResponse["data"]['data']>;
export type BannerDetail = NonNullable<BannerControllerFindOneResponse["data"]>;
export type ActiveBanners = NonNullable<BannerControllerFindActiveResponse["data"]>;

// 举报相关数据类型
export type ReportList = NonNullable<ReportControllerFindAllResponse["data"]['data']>;
export type ReportDetail = NonNullable<ReportControllerFindOneResponse["data"]>;
export type ReportStatistics = NonNullable<ReportControllerGetStatisticsResponse["data"]>;

// ==================== 自定义通用类型 ====================

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页响应（通用）
export interface PaginationResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 用户信息（扩展的用户类型，用于本地状态）
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

// 选项类型
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

// 文件上传状态
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

// 筛选参数
export interface FilterParams {
  [key: string]: any;
}
