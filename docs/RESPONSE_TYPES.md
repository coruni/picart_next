# API 响应类型快速参考

本文档列出了所有可用的 API 响应类型。

## 导入方式

```typescript
import type {
  // 基础响应类型
  ApiResponse,
  BaseResponseDto,
  PaginatedResponseDto,
  ListResponseDto,
  
  // 具体的响应类型
  UserControllerLoginResponse,
  ArticleControllerFindAllResponse,
  // ... 其他响应类型
} from "@/types";
```

## 响应类型分类

### 用户相关响应

| 响应类型 | 说明 | 用途 |
|---------|------|------|
| `UserControllerFindAllResponse` | 用户列表响应 | 获取所有用户 |
| `UserControllerGetProfileResponse` | 用户资料响应 | 获取用户详情 |
| `UserControllerLoginResponse` | 登录响应 | 用户登录 |
| `UserControllerRegisterUserResponse` | 注册响应 | 用户注册 |
| `UserControllerGetFollowerCountResponse` | 粉丝数响应 | 获取粉丝数量 |
| `UserControllerGetFollowingCountResponse` | 关注数响应 | 获取关注数量 |
| `UserControllerGetFollowingsResponse` | 关注列表响应 | 获取关注列表 |
| `UserControllerGetUserCommissionConfigResponse` | 佣金配置响应 | 获取佣金配置 |
| `UserControllerGetUserConfigResponse` | 用户配置响应 | 获取用户配置 |
| `UserControllerGetWalletBalanceResponse` | 钱包余额响应 | 获取钱包余额 |
| `UserControllerGetWalletTransactionsResponse` | 钱包交易响应 | 获取交易记录 |

### 文章相关响应

| 响应类型 | 说明 | 用途 |
|---------|------|------|
| `ArticleControllerFindAllResponse` | 文章列表响应 | 获取文章列表 |
| `ArticleControllerFindOneResponse` | 文章详情响应 | 获取单篇文章 |
| `ArticleControllerCreateResponse` | 创建文章响应 | 创建文章 |
| `ArticleControllerUpdateResponse` | 更新文章响应 | 更新文章 |
| `ArticleControllerSearchResponse` | 搜索文章响应 | 搜索文章 |
| `ArticleControllerFindRecommendationsResponse` | 推荐文章响应 | 获取推荐文章 |
| `ArticleControllerFindByAuthorResponse` | 作者文章响应 | 按作者查询 |
| `ArticleControllerGetPublishedArticleIdsResponse` | 已发布文章ID响应 | 获取已发布ID |
| `ArticleControllerGetUserBrowseHistoryResponse` | 浏览历史响应 | 获取浏览历史 |
| `ArticleControllerGetRecentBrowsedArticlesResponse` | 最近浏览响应 | 获取最近浏览 |
| `ArticleControllerGetBrowseHistoryResponse` | 浏览记录响应 | 获取浏览记录 |

### 角色和权限响应

| 响应类型 | 说明 | 用途 |
|---------|------|------|
| `RoleControllerFindAllResponse` | 角色列表响应 | 获取所有角色 |
| `RoleControllerFindOneResponse` | 角色详情响应 | 获取单个角色 |
| `RoleControllerCreateResponse` | 创建角色响应 | 创建角色 |
| `RoleControllerUpdateResponse` | 更新角色响应 | 更新角色 |
| `RoleControllerFindWithPaginationResponse` | 分页角色响应 | 分页查询角色 |
| `RoleControllerGetActiveRolesResponse` | 活跃角色响应 | 获取活跃角色 |
| `PermissionControllerFindAllResponse` | 权限列表响应 | 获取所有权限 |
| `PermissionControllerFindOneResponse` | 权限详情响应 | 获取单个权限 |
| `PermissionControllerCreateResponse` | 创建权限响应 | 创建权限 |
| `PermissionControllerUpdateResponse` | 更新权限响应 | 更新权限 |

### 分类和标签响应

| 响应类型 | 说明 | 用途 |
|---------|------|------|
| `CategoryControllerFindAllResponse` | 分类列表响应 | 获取所有分类 |
| `CategoryControllerFindOneResponse` | 分类详情响应 | 获取单个分类 |
| `CategoryControllerCreateResponse` | 创建分类响应 | 创建分类 |
| `CategoryControllerUpdateResponse` | 更新分类响应 | 更新分类 |
| `TagControllerFindAllResponse` | 标签列表响应 | 获取所有标签 |
| `TagControllerFindOneResponse` | 标签详情响应 | 获取单个标签 |
| `TagControllerCreateResponse` | 创建标签响应 | 创建标签 |

### 评论相关响应

| 响应类型 | 说明 | 用途 |
|---------|------|------|
| `CommentControllerGetRepliesResponse` | 评论回复响应 | 获取评论回复 |

### 收藏相关响应

| 响应类型 | 说明 | 用途 |
|---------|------|------|
| `FavoriteControllerFindAllResponse` | 收藏列表响应 | 获取收藏列表 |
| `FavoriteControllerFindOneResponse` | 收藏详情响应 | 获取收藏详情 |
| `FavoriteControllerCreateResponse` | 创建收藏响应 | 创建收藏夹 |

### 装饰相关响应

| 响应类型 | 说明 | 用途 |
|---------|------|------|
| `DecorationControllerFindAllResponse` | 装饰列表响应 | 获取所有装饰 |
| `DecorationControllerFindOneResponse` | 装饰详情响应 | 获取装饰详情 |
| `DecorationControllerCreateResponse` | 创建装饰响应 | 创建装饰 |
| `DecorationControllerUpdateResponse` | 更新装饰响应 | 更新装饰 |
| `DecorationControllerGetMyDecorationsResponse` | 我的装饰响应 | 获取我的装饰 |
| `DecorationControllerGetUserDecorationsResponse` | 用户装饰响应 | 获取用户装饰 |
| `DecorationControllerGetCurrentDecorationsResponse` | 当前装饰响应 | 获取当前装饰 |
| `DecorationControllerUseDecorationResponse` | 使用装饰响应 | 使用装饰 |

### 消息相关响应

| 响应类型 | 说明 | 用途 |
|---------|------|------|
| `MessageControllerFindAllResponse` | 消息列表响应 | 获取消息列表 |
| `MessageControllerFindOneResponse` | 消息详情响应 | 获取消息详情 |
| `MessageControllerCreateResponse` | 创建消息响应 | 创建消息 |
| `MessageControllerSearchResponse` | 搜索消息响应 | 搜索消息 |
| `MessageControllerGetUnreadCountResponse` | 未读数响应 | 获取未读数量 |
| `MessageControllerMarkAsReadResponse` | 标记已读响应 | 标记消息已读 |

### 配置相关响应

| 响应类型 | 说明 | 用途 |
|---------|------|------|
| `ConfigControllerFindAllResponse` | 配置列表响应 | 获取所有配置 |
| `ConfigControllerFindByGroupResponse` | 分组配置响应 | 按组查询配置 |
| `ConfigControllerGetPublicConfigsResponse` | 公开配置响应 | 获取公开配置 |
| `ConfigControllerGetAdvertisementConfigResponse` | 广告配置响应 | 获取广告配置 |

### 上传相关响应

| 响应类型 | 说明 | 用途 |
|---------|------|------|
| `UploadControllerFindAllResponse` | 上传列表响应 | 获取上传列表 |
| `UploadControllerGetFileInfoResponse` | 文件信息响应 | 获取文件信息 |
| `UploadControllerUploadFileResponse` | 上传文件响应 | 上传文件 |

### Banner 相关响应

| 响应类型 | 说明 | 用途 |
|---------|------|------|
| `BannerControllerFindAllResponse` | Banner列表响应 | 获取所有Banner |
| `BannerControllerFindOneResponse` | Banner详情响应 | 获取Banner详情 |
| `BannerControllerFindActiveResponse` | 活跃Banner响应 | 获取活跃Banner |
| `BannerControllerCreateResponse` | 创建Banner响应 | 创建Banner |

### 举报相关响应

| 响应类型 | 说明 | 用途 |
|---------|------|------|
| `ReportControllerFindAllResponse` | 举报列表响应 | 获取举报列表 |
| `ReportControllerFindOneResponse` | 举报详情响应 | 获取举报详情 |
| `ReportControllerCreateResponse` | 创建举报响应 | 创建举报 |
| `ReportControllerGetStatisticsResponse` | 举报统计响应 | 获取举报统计 |

## 使用示例

```typescript
import type {
  UserControllerLoginResponse,
  ArticleControllerFindAllResponse,
} from "@/types";
import { userControllerLogin, articleControllerFindAll } from "@/api";

// 使用登录响应类型
async function login(account: string, password: string) {
  const response: UserControllerLoginResponse = await userControllerLogin({
    body: { account, password },
  });
  
  if (response.data) {
    console.log("登录成功:", response.data);
  }
}

// 使用文章列表响应类型
async function getArticles() {
  const response: ArticleControllerFindAllResponse = await articleControllerFindAll({
    query: { page: 1, pageSize: 20 },
  });
  
  if (response.data) {
    console.log("文章列表:", response.data);
  }
}
```

## 注意事项

1. **响应类型自动生成**：所有响应类型都是从 OpenAPI 规范自动生成的
2. **类型同步**：运行 `npm run openapi` 会更新所有类型
3. **类型安全**：使用响应类型可以获得完整的 TypeScript 类型检查
4. **命名规范**：响应类型命名格式为 `{Controller}Controller{Method}Response`

## 更新响应类型

当 API 变更时：

```bash
# 1. 更新 openapi.json 或从远程拉取
# 2. 重新生成类型
npm run openapi

# 3. 响应类型会自动更新
```
