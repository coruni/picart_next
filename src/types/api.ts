/**
 * API 类型导出
 * 统一从自动生成的 `@/api/types.gen` 中按领域导出常用类型。
 */

// ==================== 用户 ====================
export type {
  CreateUserDto,
  UpdateUserDto,
  LoginDto,
  ChangePasswordDto,
  UserCommissionConfigDto,
  UpdateUserConfigDto,
  UpdateUserNoticeDto,
} from "@/api/types.gen";

export type {
  UserControllerFindAllResponse,
  UserControllerGetProfileResponse,
  UserControllerLoginResponse,
  UserControllerRegisterUserResponse,
  UserControllerGetFollowerCountResponse,
  UserControllerGetFollowingCountResponse,
  UserControllerGetFollowingsResponse,
  UserControllerGetUserCommissionConfigResponse,
  UserControllerGetUserConfigResponse,
  UserControllerGetWalletBalanceResponse,
  UserControllerGetWalletTransactionsResponse,
} from "@/api/types.gen";

// ==================== 角色与权限 ====================
export type {
  CreateRoleDto,
  UpdateRoleDto,
  Role,
  Permission,
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionsDto,
} from "@/api/types.gen";

export type {
  RoleControllerFindAllResponse,
  RoleControllerFindOneResponse,
  RoleControllerFindWithPaginationResponse,
  RoleControllerGetActiveRolesResponse,
  PermissionControllerFindAllResponse,
} from "@/api/types.gen";

// ==================== 文章 ====================
export type {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleLikeDto,
  RecordBrowseHistoryDto,
} from "@/api/types.gen";

export type {
  ArticleControllerFindAllResponse,
  ArticleControllerFindOneResponse,
  ArticleControllerCreateResponses,
  ArticleControllerUpdateResponses,
  ArticleControllerSearchResponse,
  ArticleControllerFindRecommendationsResponse,
  ArticleControllerFindByAuthorResponse,
  ArticleControllerGetPublishedArticleIdsResponse,
  ArticleControllerGetUserBrowseHistoryResponse,
  ArticleControllerGetRecentBrowsedArticlesResponse,
  ArticleControllerGetBrowseHistoryResponse,
} from "@/api/types.gen";

// ==================== 评论 ====================
export type {
  CreateCommentDto,
  UpdateCommentDto,
} from "@/api/types.gen";

// ==================== 分类与标签 ====================
export type {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateTagDto,
  UpdateTagDto,
} from "@/api/types.gen";

export type {
  CategoryControllerFindAllResponse,
  CategoryControllerFindOneResponse,
  CategoryControllerCreateResponses,
  CategoryControllerUpdateResponses,
  TagControllerFindAllResponse,
  TagControllerFindOneResponse,
  TagControllerCreateResponses,
} from "@/api/types.gen";

// ==================== 收藏 ====================
export type {
  CreateFavoriteDto,
  UpdateFavoriteDto,
  AddToFavoriteDto,
} from "@/api/types.gen";

// ==================== 订单与支付 ====================
export type {
  CreateArticleOrderDto,
  CreateMembershipOrderDto,
  CreatePaymentDto,
  AlipayNotifyDto,
  WechatNotifyDto,
} from "@/api/types.gen";

// ==================== 积分 ====================
export type {
  AddPointsDto,
  SpendPointsDto,
} from "@/api/types.gen";

// ==================== 装饰 ====================
export type {
  CreateDecorationDto,
  UpdateDecorationDto,
  PurchaseDecorationDto,
  GiftDecorationDto,
} from "@/api/types.gen";

export type {
  DecorationControllerFindAllResponse,
  DecorationControllerFindOneResponse,
  DecorationControllerCreateResponses,
  DecorationControllerUpdateResponses,
  DecorationControllerGetMyDecorationsResponse,
  DecorationControllerGetUserDecorationsResponse,
  DecorationControllerGetCurrentDecorationsResponse,
  DecorationControllerUseDecorationResponse,
} from "@/api/types.gen";

// ==================== 消息 ====================
export type {
  CreateMessageDto,
  UpdateMessageDto,
  BatchMessageDto,
  MarkAllReadDto,
} from "@/api/types.gen";

export type {
  MessageControllerFindAllResponse,
  MessageControllerFindOneResponse,
  MessageControllerCreateResponses,
  MessageControllerSearchResponse,
  MessageControllerGetUnreadCountResponse,
  MessageControllerMarkAsReadResponses,
} from "@/api/types.gen";

// ==================== 邀请 ====================
export type {
  CreateInviteDto,
  UseInviteDto,
} from "@/api/types.gen";

// ==================== 配置 ====================
export type {
  CreateConfigDto,
} from "@/api/types.gen";

export type {
  ConfigControllerFindAllResponse,
  ConfigControllerFindByGroupResponse,
  ConfigControllerGetPublicConfigsResponse,
  ConfigControllerGetAdvertisementConfigResponse,
} from "@/api/types.gen";

// ==================== 上传 ====================
export type {
  Upload,
  UploadEmojiDto,
  DownloadDto,
} from "@/api/types.gen";

export type {
  UploadControllerFindAllResponse,
  UploadControllerUploadFileResponse,
} from "@/api/types.gen";

// ==================== Banner ====================
export type {
  CreateBannerDto,
  UpdateBannerDto,
} from "@/api/types.gen";

export type {
  BannerControllerFindAllResponse,
  BannerControllerFindOneResponse,
  BannerControllerFindActiveResponse,
  BannerControllerCreateResponses,
} from "@/api/types.gen";

// ==================== 表情 ====================
export type {
  CreateEmojiDto,
  UpdateEmojiDto,
} from "@/api/types.gen";

// ==================== 举报 ====================
export type {
  CreateReportDto,
  UpdateReportDto,
} from "@/api/types.gen";

export type {
  ReportControllerFindAllResponses,
  ReportControllerFindOneResponses,
  ReportControllerCreateResponses,
  ReportControllerGetStatisticsResponses,
} from "@/api/types.gen";

// ==================== 邮件 ====================
export type {
  SendMailDto,
  CalculateCommissionDto,
} from "@/api/types.gen";
