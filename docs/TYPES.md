# 类型定义使用文档

本项目的类型定义分为两部分：
1. 从 API 自动生成的类型（`src/api/generated/types.gen.ts`）
2. 项目自定义的通用类型（`src/types/`）

## 类型组织结构

```
src/
├── api/
│   └── generated/
│       └── types.gen.ts    # 自动生成的 API 类型
└── types/
    ├── index.ts            # 通用类型定义和导出
    └── api.ts              # 重新导出的 API 类型
```

## 使用 API 生成的类型

### 1. 直接从生成的文件导入

```typescript
import type {
  CreateUserDto,
  UpdateUserDto,
  LoginDto,
} from "@/api/generated/types.gen";

const loginData: LoginDto = {
  account: "user@example.com",
  password: "password123",
};
```

### 2. 从 types/api.ts 导入（推荐）

为了更好的组织，我们在 `src/types/api.ts` 中重新导出了所有常用的 API 类型：

```typescript
import type {
  CreateUserDto,
  UpdateUserDto,
  LoginDto,
  CreateArticleDto,
  UpdateArticleDto,
} from "@/types/api";
```

### 3. 从 types/index.ts 导入（最推荐）

```typescript
import type {
  CreateUserDto,
  UpdateUserDto,
  ApiResponse,
  PaginationParams,
} from "@/types";
```

## 常用类型

### API 响应类型

```typescript
import type { ApiResponse, PaginatedResponseDto, ListResponseDto } from "@/types";

// 基础响应
const response: ApiResponse = {
  code: 200,
  message: "成功",
  data: { id: "1", name: "张三" },
  timestamp: Date.now(),
  path: "/api/users",
};

// 分页响应
const paginatedResponse: PaginatedResponseDto = {
  code: 200,
  message: "成功",
  data: {
    list: [{ id: "1" }, { id: "2" }],
    total: 100,
    page: 1,
    pageSize: 20,
  },
};
```

## 从响应类型中提取数据类型

推荐的做法是从响应类型的 `data` 字段中提取实际的数据类型：

```typescript
import type {
  UserProfile,
  UserList,
  LoginResult,
  ArticleList,
  ArticleDetail,
} from "@/types";

// UserProfile 是从 UserControllerGetProfileResponse['data'] 提取的
const profile: UserProfile = {
  id: 1,
  username: "zhangsan",
  email: "zhangsan@example.com",
  // ...
};

// ArticleList 是从 ArticleControllerFindAllResponse['data'] 提取的
const articles: ArticleList = {
  data: [
    { id: 1, title: "文章1" },
    { id: 2, title: "文章2" },
  ],
  meta: {
    total: 100,
    page: 1,
    limit: 20,
  },
};
```

### 可用的数据类型

**用户相关：**
- `UserProfile` - 用户资料数据
- `UserList` - 用户列表数据
- `LoginResult` - 登录结果数据
- `RegisterResult` - 注册结果数据
- `WalletBalance` - 钱包余额数据
- `WalletTransactions` - 钱包交易数据
- `UserConfigData` - 用户配置数据

**文章相关：**
- `ArticleList` - 文章列表数据
- `ArticleDetail` - 文章详情数据
- `ArticleSearchResult` - 文章搜索结果
- `ArticleRecommendations` - 推荐文章数据
- `BrowseHistory` - 浏览历史数据

**其他：**
- `RoleList`, `RoleDetail`, `RolePaginated`
- `CategoryList`, `CategoryDetail`
- `TagList`, `TagDetail`
- `FavoriteList`, `FavoriteDetail`
- `DecorationList`, `MyDecorations`
- `MessageList`, `UnreadCount`
- `ConfigList`, `PublicConfigs`
- `BannerList`, `ActiveBanners`
- `ReportList`, `ReportStatistics`

### 使用示例

```typescript
import type { UserProfile, ArticleList } from "@/types";
import { userControllerGetProfile, articleControllerFindAll } from "@/api";

// 获取用户资料
async function getUserProfile(): Promise<UserProfile | null> {
  const response = await userControllerGetProfile({});
  return response.data || null;
}

// 获取文章列表
async function getArticles(): Promise<ArticleList | null> {
  const response = await articleControllerFindAll({
    query: { page: 1, limit: 20 },
  });
  return response.data || null;
}

// 在组件中使用
function UserProfileComponent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getUserProfile().then(setProfile);
  }, []);

  if (!profile) return <div>加载中...</div>;

  return (
    <div>
      <h1>{profile.username}</h1>
      <p>{profile.email}</p>
    </div>
  );
}
```

每个 API 端点都有对应的响应类型：

```typescript
import type {
  UserControllerFindAllResponse,
  UserControllerGetProfileResponse,
  UserControllerLoginResponse,
  ArticleControllerFindAllResponse,
  ArticleControllerFindOneResponse,
} from "@/types";

// 用户列表响应
const usersResponse: UserControllerFindAllResponse = {
  code: 200,
  message: "获取成功",
  data: {
    list: [
      { id: "1", username: "user1" },
      { id: "2", username: "user2" },
    ],
    total: 100,
    page: 1,
    pageSize: 20,
  },
};

// 用户资料响应
const profileResponse: UserControllerGetProfileResponse = {
  code: 200,
  message: "获取成功",
  data: {
    id: "1",
    username: "zhangsan",
    email: "zhangsan@example.com",
    // ... 其他字段
  },
  timestamp: Date.now(),
  path: "/api/users/profile",
};

// 登录响应
const loginResponse: UserControllerLoginResponse = {
  code: 200,
  message: "登录成功",
  data: {
    user: { id: "1", username: "zhangsan" },
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
  timestamp: Date.now(),
  path: "/api/users/login",
};
```

### 用户相关类型

```typescript
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  LoginDto,
  ChangePasswordDto,
} from "@/types";

// 用户信息
const user: User = {
  id: "1",
  username: "zhangsan",
  nickname: "张三",
  email: "zhangsan@example.com",
  avatar: "/avatar.jpg",
  wallet: 100,
  points: 500,
  createdAt: "2026-01-15T00:00:00Z",
  updatedAt: "2026-01-15T00:00:00Z",
};

// 创建用户
const createUserData: CreateUserDto = {
  username: "zhangsan",
  nickname: "张三",
  password: "password123",
  email: "zhangsan@example.com",
};

// 登录
const loginData: LoginDto = {
  account: "zhangsan",
  password: "password123",
};
```

### 文章相关类型

```typescript
import type {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleLikeDto,
} from "@/types";

// 创建文章
const createArticle: CreateArticleDto = {
  title: "文章标题",
  content: "文章内容",
  categoryId: "1",
  tags: ["tag1", "tag2"],
};

// 更新文章
const updateArticle: UpdateArticleDto = {
  title: "新标题",
  content: "新内容",
};

// 点赞文章
const likeArticle: ArticleLikeDto = {
  articleId: "1",
  isLike: true,
};
```

### 订单和支付类型

```typescript
import type {
  CreateArticleOrderDto,
  CreateMembershipOrderDto,
  CreatePaymentDto,
} from "@/types";

// 创建文章订单
const articleOrder: CreateArticleOrderDto = {
  articleId: "1",
  paymentMethod: "alipay",
};

// 创建会员订单
const membershipOrder: CreateMembershipOrderDto = {
  membershipType: "monthly",
  paymentMethod: "wechat",
};
```

### 角色和权限类型

```typescript
import type {
  Role,
  Permission,
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
} from "@/types";

// 角色
const role: Role = {
  id: 1,
  name: "admin",
  displayName: "管理员",
  description: "系统管理员",
  isActive: true,
  isSystem: true,
  createdAt: "2026-01-15T00:00:00Z",
  updatedAt: "2026-01-15T00:00:00Z",
};

// 创建角色
const createRole: CreateRoleDto = {
  name: "editor",
  displayName: "编辑",
  description: "内容编辑",
  permissionIds: ["1", "2", "3"],
};
```

## 自定义通用类型

### 分页参数

```typescript
import type { PaginationParams, PaginationResponse } from "@/types";

const params: PaginationParams = {
  page: 1,
  pageSize: 20,
};

const response: PaginationResponse<User> = {
  list: [user1, user2],
  total: 100,
  page: 1,
  pageSize: 20,
  totalPages: 5,
};
```

### 表单字段错误

```typescript
import type { FieldError } from "@/types";

const errors: FieldError[] = [
  { field: "email", message: "邮箱格式不正确" },
  { field: "password", message: "密码长度至少8位" },
];
```

### 选项类型

```typescript
import type { Option } from "@/types";

const options: Option[] = [
  { label: "选项1", value: "1" },
  { label: "选项2", value: "2", disabled: true },
];

// 泛型选项
const numberOptions: Option<number>[] = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
];
```

### 菜单项

```typescript
import type { MenuItem } from "@/types";

const menu: MenuItem[] = [
  {
    id: "1",
    label: "首页",
    icon: "home",
    path: "/",
  },
  {
    id: "2",
    label: "用户管理",
    icon: "users",
    children: [
      { id: "2-1", label: "用户列表", path: "/users" },
      { id: "2-2", label: "角色管理", path: "/roles" },
    ],
  },
];
```

### 文件上传

```typescript
import type { UploadFile } from "@/types";

const file: UploadFile = {
  uid: "1",
  name: "image.jpg",
  status: "uploading",
  url: "/uploads/image.jpg",
  percent: 50,
};
```

### 表格列定义

```typescript
import type { TableColumn } from "@/types";

const columns: TableColumn<User>[] = [
  {
    key: "username",
    title: "用户名",
    dataIndex: "username",
    width: 150,
  },
  {
    key: "email",
    title: "邮箱",
    dataIndex: "email",
    width: 200,
  },
  {
    key: "actions",
    title: "操作",
    align: "center",
    render: (_, record) => (
      <button onClick={() => handleEdit(record)}>编辑</button>
    ),
  },
];
```

## 类型扩展

如果需要扩展 API 生成的类型，可以使用 TypeScript 的类型工具：

### 扩展类型

```typescript
import type { CreateUserDto } from "@/types";

// 扩展创建用户类型
interface ExtendedCreateUserDto extends CreateUserDto {
  confirmPassword: string;
  agreeToTerms: boolean;
}
```

### 部分类型

```typescript
import type { UpdateUserDto } from "@/types";

// 只需要部分字段
type UserProfileUpdate = Pick<UpdateUserDto, "nickname" | "avatar">;

// 所有字段可选
type PartialUserUpdate = Partial<UpdateUserDto>;
```

### 排除类型

```typescript
import type { User } from "@/types";

// 排除敏感字段
type PublicUser = Omit<User, "wallet" | "points">;
```

## 类型守卫

```typescript
import type { ApiResponse } from "@/types";

function isSuccessResponse(response: ApiResponse): boolean {
  return response.code === 200;
}

function isErrorResponse(response: ApiResponse): boolean {
  return response.code >= 400;
}
```

## 最佳实践

1. **优先使用生成的类型**：API 类型会自动更新，保持与后端同步
2. **统一导入路径**：从 `@/types` 导入，而不是直接从生成的文件
3. **类型命名规范**：
   - DTO 类型：`CreateXxxDto`, `UpdateXxxDto`
   - 实体类型：`User`, `Article`, `Order`
   - 响应类型：`XxxResponse`, `XxxListResponse`
4. **避免使用 `any`**：充分利用 TypeScript 的类型检查
5. **使用类型别名**：为复杂类型创建有意义的别名

## 类型更新流程

当 API 变更时：

1. 更新 `openapi.json` 或从远程拉取最新规范
2. 运行 `npm run openapi` 重新生成类型
3. 检查 `src/types/api.ts` 是否需要更新导出
4. 更新使用了变更类型的代码

## 示例：完整的类型使用

```typescript
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  ApiResponse,
  PaginationParams,
  PaginationResponse,
  UserControllerFindAllResponse,
  UserControllerGetProfileResponse,
  UserControllerLoginResponse,
} from "@/types";
import {
  userControllerCreate,
  userControllerFindAll,
  userControllerGetProfile,
  userControllerLogin,
} from "@/api";

// 登录
async function login(
  account: string,
  password: string
): Promise<{ user: User; token: string } | null> {
  try {
    const response = await userControllerLogin({
      body: { account, password },
    });

    // response 的类型是自动推断的
    if (response.data) {
      return {
        user: response.data.user as User,
        token: response.data.token as string,
      };
    }
    return null;
  } catch (error) {
    console.error("Login failed:", error);
    return null;
  }
}

// 获取用户资料
async function getUserProfile(): Promise<User | null> {
  try {
    const response = await userControllerGetProfile({});
    // response 类型: UserControllerGetProfileResponse
    
    if (response.data) {
      return response.data as User;
    }
    return null;
  } catch (error) {
    console.error("Failed to get profile:", error);
    return null;
  }
}

// 创建用户
async function createUser(data: CreateUserDto): Promise<User | null> {
  try {
    const response = await userControllerCreate({ body: data });
    if (response.data) {
      return response.data as User;
    }
    return null;
  } catch (error) {
    console.error("Failed to create user:", error);
    return null;
  }
}

// 获取用户列表（带类型）
async function getUsers(
  params: PaginationParams
): Promise<PaginationResponse<User>> {
  const response = await userControllerFindAll({
    query: params,
  });
  // response 类型: UserControllerFindAllResponse

  return {
    list: (response.data?.list || []) as User[],
    total: response.data?.total || 0,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil((response.data?.total || 0) / params.pageSize),
  };
}

// 在组件中使用
function UserListComponent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const result = await getUsers({ page: 1, pageSize: 20 });
        setUsers(result.list);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) return <div>加载中...</div>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.username}</li>
      ))}
    </ul>
  );
}
```

## 类型检查

使用 TypeScript 编译器检查类型错误：

```bash
# 检查类型错误
npx tsc --noEmit

# 监听模式
npx tsc --noEmit --watch
```

## 常用响应类型快速参考

### 用户相关
- `UserControllerFindAllResponse` - 用户列表
- `UserControllerGetProfileResponse` - 用户资料
- `UserControllerLoginResponse` - 登录响应
- `UserControllerRegisterUserResponse` - 注册响应
- `UserControllerGetWalletBalanceResponse` - 钱包余额
- `UserControllerGetWalletTransactionsResponse` - 钱包交易记录

### 文章相关
- `ArticleControllerFindAllResponse` - 文章列表
- `ArticleControllerFindOneResponse` - 文章详情
- `ArticleControllerCreateResponse` - 创建文章
- `ArticleControllerUpdateResponse` - 更新文章
- `ArticleControllerSearchResponse` - 搜索文章
- `ArticleControllerFindRecommendationsResponse` - 推荐文章
- `ArticleControllerGetBrowseHistoryResponse` - 浏览历史

### 角色和权限
- `RoleControllerFindAllResponse` - 角色列表
- `RoleControllerFindWithPaginationResponse` - 分页角色列表
- `RoleControllerGetActiveRolesResponse` - 活跃角色
- `PermissionControllerFindAllResponse` - 权限列表

### 配置相关
- `ConfigControllerFindAllResponse` - 所有配置
- `ConfigControllerFindByGroupResponse` - 按组查询配置
- `ConfigControllerGetPublicConfigsResponse` - 公开配置
- `ConfigControllerGetAdvertisementConfigResponse` - 广告配置

### 其他
- `MessageControllerFindAllResponse` - 消息列表
- `MessageControllerGetUnreadCountResponse` - 未读消息数
- `UploadControllerFindAllResponse` - 上传文件列表
- `BannerControllerFindAllResponse` - Banner 列表
- `ReportControllerGetStatisticsResponse` - 举报统计

## 响应类型使用技巧

### 1. 类型断言

```typescript
const response = await userControllerGetProfile({});
const user = response.data as User;
```

### 2. 类型守卫

```typescript
function isSuccessResponse<T>(
  response: { code: number; data?: T }
): response is { code: 200; data: T } {
  return response.code === 200 && response.data !== undefined;
}

const response = await userControllerGetProfile({});
if (isSuccessResponse(response)) {
  // response.data 的类型被正确推断
  console.log(response.data.username);
}
```

### 3. 泛型封装

```typescript
async function fetchData<T>(
  fetcher: () => Promise<{ data?: T }>
): Promise<T | null> {
  try {
    const response = await fetcher();
    return response.data || null;
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
}

// 使用
const user = await fetchData<User>(() =>
  userControllerGetProfile({})
);
```
