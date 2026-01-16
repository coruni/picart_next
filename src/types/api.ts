/**
 * API 相关类型
 * 从生成的 API 类型中重新导出常用类型
 */

// ==================== 基础响应类型 ====================
export type {
  BaseResponseDto,
  PaginatedResponseDto,
  ListResponseDto,
} from "@/api/types.gen";

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
} from "@/api/types.gen";

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
} from "@/api/types.gen";

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
} from "@/api/types.gen";

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
} from "@/api/types.gen";

// ==================== 文章相关 ====================
// 请求类型
export type {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleLikeDto,
  RecordBrowseHistoryDto,
} from "@/api/types.gen";

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
} from "@/api/types.gen";

// ==================== 评论相关 ====================
// 请求类型
export type {
  CreateCommentDto,
  UpdateCommentDto,
} from "@/api/types.gen";

// 响应类型
export type {
  CommentControllerGetRepliesResponse,
} from "@/api/types.gen";

// ==================== 分类和标签 ====================
// 请求类型
export type {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateTagDto,
  UpdateTagDto,
} from "@/api/types.gen";

// 响应类型
export type {
  CategoryControllerFindAllResponse,
  CategoryControllerFindOneResponse,
  CategoryControllerCreateResponse,
  CategoryControllerUpdateResponse,
  TagControllerFindAllResponse,
  TagControllerFindOneResponse,
  TagControllerCreateResponse,
} from "@/api/types.gen";

// ==================== 收藏相关 ====================
// 请求类型
export type {
  CreateFavoriteDto,
  UpdateFavoriteDto,
  AddToFavoriteDto,
} from "@/api/types.gen";

// 响应类型
export type {
  FavoriteControllerFindAllResponse,
  FavoriteControllerFindOneResponse,
  FavoriteControllerCreateResponse,
} from "@/api/types.gen";

// ==================== 订单和支付 ====================
// 请求类型
export type {
  CreateArticleOrderDto,
  CreateMembershipOrderDto,
  CreatePaymentDto,
  AlipayNotifyDto,
  WechatNotifyDto,
} from "@/api/types.gen";

// ==================== 积分相关 ====================
// 请求类型
export type {
  CreatePointsRuleDto,
  UpdatePointsRuleDto,
  CreatePointsTaskDto,
  UpdatePointsTaskDto,
  AddPointsDto,
  SpendPointsDto,
} from "@/api/types.gen";

// ==================== 装饰相关 ====================
// 请求类型
export type {
  CreateDecorationDto,
  UpdateDecorationDto,
  PurchaseDecorationDto,
  GiftDecorationDto,
} from "@/api/types.gen";

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
} from "@/api/types.gen";

// ==================== 消息相关 ====================
// 请求类型
export type {
  CreateMessageDto,
  UpdateMessageDto,
  BatchMessageDto,
  MarkAllReadDto,
} from "@/api/types.gen";

// 响应类型
export type {
  MessageControllerFindAllResponse,
  MessageControllerFindOneResponse,
  MessageControllerCreateResponse,
  MessageControllerSearchResponse,
  MessageControllerGetUnreadCountResponse,
  MessageControllerMarkAsReadResponse,
} from "@/api/types.gen";

// ==================== 邀请相关 ====================
// 请求类型
export type {
  CreateInviteDto,
  UseInviteDto,
} from "@/api/types.gen";

// ==================== 配置相关 ====================
// 请求类型
export type {
  CreateConfigDto,
  UpdateConfigDto,
} from "@/api/types.gen";

// 响应类型
export type {
  ConfigControllerFindAllResponse,
  ConfigControllerFindByGroupResponse,
  ConfigControllerGetPublicConfigsResponse,
  ConfigControllerGetAdvertisementConfigResponse,
} from "@/api/types.gen";

// ==================== 上传相关 ====================
// 请求类型
export type {
  Upload,
  CreateUploadDto,
  UpdateUploadDto,
  UploadEmojiDto,
  DownloadDto,
} from "@/api/types.gen";

// 响应类型
export type {
  UploadControllerFindAllResponse,
  UploadControllerGetFileInfoResponse,
  UploadControllerUploadFileResponse,
} from "@/api/types.gen";

// ==================== Banner 相关 ====================
// 请求类型
export type {
  CreateBannerDto,
  UpdateBannerDto,
} from "@/api/types.gen";

// 响应类型
export type {
  BannerControllerFindAllResponse,
  BannerControllerFindOneResponse,
  BannerControllerFindActiveResponse,
  BannerControllerCreateResponse,
} from "@/api/types.gen";

// ==================== 表情相关 ====================
// 请求类型
export type {
  CreateEmojiDto,
  UpdateEmojiDto,
} from "@/api/types.gen";

// ==================== 举报相关 ====================
// 请求类型
export type {
  CreateReportDto,
  UpdateReportDto,
} from "@/api/types.gen";

// 响应类型
export type {
  ReportControllerFindAllResponse,
  ReportControllerFindOneResponse,
  ReportControllerCreateResponse,
  ReportControllerGetStatisticsResponse,
} from "@/api/types.gen";

// ==================== 邮件相关 ====================
// 请求类型
export type {
  SendMailDto,
  CalculateCommissionDto,
} from "@/api/types.gen";

