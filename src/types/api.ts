/**
 * API 相关类型
 * 从生成的 API 类型中重新导出常用类型
 */

// ==================== 基础响应类型 ====================
export type {
  BaseResponseDto,
  PaginatedResponseDto,
  ListResponseDto,
} from "@/api/generated/types.gen";

// ==================== 用户相关 ====================
// 请求类型
export type {
  CreateUserDto,
  UpdateUserDto,
  LoginDto,
  ChangePasswordDto,
  UserCommissionConfigDto,
  UpdateUserConfigDto,
  UpdateUserNoticeDto,
} from "@/api/generated/types.gen";

// 响应类型
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
} from "@/api/generated/types.gen";

// ==================== 角色和权限 ====================
// 请求类型
export type {
  CreateRoleDto,
  UpdateRoleDto,
  Role,
  Permission,
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionsDto,
} from "@/api/generated/types.gen";

// 响应类型
export type {
  RoleControllerFindAllResponse,
  RoleControllerFindOneResponse,
  RoleControllerCreateResponse,
  RoleControllerUpdateResponse,
  RoleControllerFindWithPaginationResponse,
  RoleControllerGetActiveRolesResponse,
  PermissionControllerFindAllResponse,
  PermissionControllerFindOneResponse,
  PermissionControllerCreateResponse,
  PermissionControllerUpdateResponse,
} from "@/api/generated/types.gen";

// ==================== 文章相关 ====================
// 请求类型
export type {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleLikeDto,
  RecordBrowseHistoryDto,
} from "@/api/generated/types.gen";

// 响应类型
export type {
  ArticleControllerFindAllResponse,
  ArticleControllerFindOneResponse,
  ArticleControllerCreateResponse,
  ArticleControllerUpdateResponse,
  ArticleControllerSearchResponse,
  ArticleControllerFindRecommendationsResponse,
  ArticleControllerFindByAuthorResponse,
  ArticleControllerGetPublishedArticleIdsResponse,
  ArticleControllerGetUserBrowseHistoryResponse,
  ArticleControllerGetRecentBrowsedArticlesResponse,
  ArticleControllerGetBrowseHistoryResponse,
} from "@/api/generated/types.gen";

// ==================== 评论相关 ====================
// 请求类型
export type {
  CreateCommentDto,
  UpdateCommentDto,
} from "@/api/generated/types.gen";

// 响应类型
export type {
  CommentControllerGetRepliesResponse,
} from "@/api/generated/types.gen";

// ==================== 分类和标签 ====================
// 请求类型
export type {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateTagDto,
  UpdateTagDto,
} from "@/api/generated/types.gen";

// 响应类型
export type {
  CategoryControllerFindAllResponse,
  CategoryControllerFindOneResponse,
  CategoryControllerCreateResponse,
  CategoryControllerUpdateResponse,
  TagControllerFindAllResponse,
  TagControllerFindOneResponse,
  TagControllerCreateResponse,
} from "@/api/generated/types.gen";

// ==================== 收藏相关 ====================
// 请求类型
export type {
  CreateFavoriteDto,
  UpdateFavoriteDto,
  AddToFavoriteDto,
} from "@/api/generated/types.gen";

// 响应类型
export type {
  FavoriteControllerFindAllResponse,
  FavoriteControllerFindOneResponse,
  FavoriteControllerCreateResponse,
} from "@/api/generated/types.gen";

// ==================== 订单和支付 ====================
// 请求类型
export type {
  CreateArticleOrderDto,
  CreateMembershipOrderDto,
  CreatePaymentDto,
  AlipayNotifyDto,
  WechatNotifyDto,
} from "@/api/generated/types.gen";

// ==================== 积分相关 ====================
// 请求类型
export type {
  CreatePointsRuleDto,
  UpdatePointsRuleDto,
  CreatePointsTaskDto,
  UpdatePointsTaskDto,
  AddPointsDto,
  SpendPointsDto,
} from "@/api/generated/types.gen";

// ==================== 装饰相关 ====================
// 请求类型
export type {
  CreateDecorationDto,
  UpdateDecorationDto,
  PurchaseDecorationDto,
  GiftDecorationDto,
} from "@/api/generated/types.gen";

// 响应类型
export type {
  DecorationControllerFindAllResponse,
  DecorationControllerFindOneResponse,
  DecorationControllerCreateResponse,
  DecorationControllerUpdateResponse,
  DecorationControllerGetMyDecorationsResponse,
  DecorationControllerGetUserDecorationsResponse,
  DecorationControllerGetCurrentDecorationsResponse,
  DecorationControllerUseDecorationResponse,
} from "@/api/generated/types.gen";

// ==================== 消息相关 ====================
// 请求类型
export type {
  CreateMessageDto,
  UpdateMessageDto,
  BatchMessageDto,
  MarkAllReadDto,
} from "@/api/generated/types.gen";

// 响应类型
export type {
  MessageControllerFindAllResponse,
  MessageControllerFindOneResponse,
  MessageControllerCreateResponse,
  MessageControllerSearchResponse,
  MessageControllerGetUnreadCountResponse,
  MessageControllerMarkAsReadResponse,
} from "@/api/generated/types.gen";

// ==================== 邀请相关 ====================
// 请求类型
export type {
  CreateInviteDto,
  UseInviteDto,
} from "@/api/generated/types.gen";

// ==================== 配置相关 ====================
// 请求类型
export type {
  CreateConfigDto,
  UpdateConfigDto,
} from "@/api/generated/types.gen";

// 响应类型
export type {
  ConfigControllerFindAllResponse,
  ConfigControllerFindByGroupResponse,
  ConfigControllerGetPublicConfigsResponse,
  ConfigControllerGetAdvertisementConfigResponse,
} from "@/api/generated/types.gen";

// ==================== 上传相关 ====================
// 请求类型
export type {
  Upload,
  CreateUploadDto,
  UpdateUploadDto,
  UploadEmojiDto,
  DownloadDto,
} from "@/api/generated/types.gen";

// 响应类型
export type {
  UploadControllerFindAllResponse,
  UploadControllerGetFileInfoResponse,
  UploadControllerUploadFileResponse,
} from "@/api/generated/types.gen";

// ==================== Banner 相关 ====================
// 请求类型
export type {
  CreateBannerDto,
  UpdateBannerDto,
} from "@/api/generated/types.gen";

// 响应类型
export type {
  BannerControllerFindAllResponse,
  BannerControllerFindOneResponse,
  BannerControllerFindActiveResponse,
  BannerControllerCreateResponse,
} from "@/api/generated/types.gen";

// ==================== 表情相关 ====================
// 请求类型
export type {
  CreateEmojiDto,
  UpdateEmojiDto,
} from "@/api/generated/types.gen";

// ==================== 举报相关 ====================
// 请求类型
export type {
  CreateReportDto,
  UpdateReportDto,
} from "@/api/generated/types.gen";

// 响应类型
export type {
  ReportControllerFindAllResponse,
  ReportControllerFindOneResponse,
  ReportControllerCreateResponse,
  ReportControllerGetStatisticsResponse,
} from "@/api/generated/types.gen";

// ==================== 邮件相关 ====================
// 请求类型
export type {
  SendMailDto,
  CalculateCommissionDto,
} from "@/api/generated/types.gen";

