# API 客户端使用文档

本项目使用 `@hey-api/openapi-ts` 从 OpenAPI 规范自动生成类型安全的 API 客户端。

## 配置

### OpenAPI 规范文件
- 本地文件：`openapi.json`
- 或使用远程 URL（在 `openapi-ts.config.ts` 中配置）

### 生成的代码位置
`src/api/generated/`

## 生成 API 客户端

```bash
npm run openapi
```

这会根据 `openapi.json` 生成类型安全的 API 客户端代码。

## 使用方法

### 1. 基本使用

```typescript
import { getUsers, createUser } from "@/api";

// 获取用户列表
const response = await getUsers({
  query: {
    page: 1,
    pageSize: 20,
  },
});

// 创建用户
const newUser = await createUser({
  body: {
    username: "zhangsan",
    email: "zhangsan@example.com",
    password: "password123",
  },
});
```

### 2. 在 React 组件中使用

```tsx
"use client";

import { useEffect, useState } from "react";
import { getUsers, type User } from "@/api";

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await getUsers({
          query: { page: 1, pageSize: 20 },
        });
        setUsers(response.data?.list || []);
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

### 3. 在服务端组件中使用

```tsx
import { getUsers } from "@/api";

export default async function UsersPage() {
  const response = await getUsers({
    query: { page: 1, pageSize: 20 },
  });

  const users = response.data?.list || [];

  return (
    <div>
      <h1>用户列表</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.username}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 4. 错误处理

```typescript
import { getUsers } from "@/api";

try {
  const response = await getUsers({
    query: { page: 1, pageSize: 20 },
  });

  if (response.error) {
    console.error("API Error:", response.error);
    return;
  }

  const users = response.data?.list || [];
  // 处理数据
} catch (error) {
  console.error("Network Error:", error);
}
```

### 5. 使用拦截器

客户端已在 `src/api/client.ts` 中配置了拦截器：

```typescript
import { client } from "@/api";

// 请求拦截器（已配置）
// - 自动添加 Authorization token

// 响应拦截器（已配置）
// - 统一处理响应

// 你可以添加更多拦截器
client.interceptors.request.use((request) => {
  // 自定义请求处理
  return request;
});

client.interceptors.response.use((response) => {
  // 自定义响应处理
  return response;
});
```

## API 方法

根据 `openapi.json` 生成的方法：

### 用户相关

```typescript
// 获取用户列表
getUsers(options?: {
  query?: {
    page?: number;
    pageSize?: number;
  };
})

// 创建用户
createUser(options: {
  body: {
    username: string;
    email: string;
    password: string;
  };
})

// 获取用户详情
getUserById(options: {
  path: {
    id: string;
  };
})

// 更新用户
updateUser(options: {
  path: {
    id: string;
  };
  body: {
    username?: string;
    email?: string;
    avatar?: string;
  };
})

// 删除用户
deleteUser(options: {
  path: {
    id: string;
  };
})
```

## 类型定义

所有类型都会自动生成：

```typescript
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserListResponse,
} from "@/api";

const user: User = {
  id: "1",
  username: "zhangsan",
  email: "zhangsan@example.com",
  avatar: null,
  createdAt: "2026-01-15T00:00:00Z",
  updatedAt: "2026-01-15T00:00:00Z",
};
```

## 更新 API 规范

### 1. 修改 openapi.json

添加新的端点或修改现有端点。

### 2. 重新生成客户端

```bash
npm run openapi
```

### 3. 使用新的 API

生成的代码会自动更新，包括类型定义。

## 使用远程 OpenAPI 规范

在 `openapi-ts.config.ts` 中：

```typescript
export default defineConfig({
  client: "@hey-api/client-fetch",
  input: "https://api.example.com/openapi.json", // 使用远程 URL
  output: {
    path: "./src/api/generated",
  },
});
```

## 配置选项

### openapi-ts.config.ts

```typescript
import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  client: "@hey-api/client-fetch", // 使用 fetch 客户端
  input: "./openapi.json", // OpenAPI 规范文件
  output: {
    path: "./src/api/generated", // 输出目录
    format: "prettier", // 使用 Prettier 格式化
    lint: "eslint", // 使用 ESLint 检查
  },
  types: {
    enums: "javascript", // 枚举类型
  },
  services: {
    asClass: true, // 生成类形式的服务
  },
});
```

## 最佳实践

1. **版本控制**：将生成的代码提交到 Git，方便团队协作
2. **定期更新**：API 规范变更后及时重新生成客户端
3. **类型安全**：充分利用 TypeScript 类型检查
4. **错误处理**：始终处理可能的错误情况
5. **环境变量**：使用环境变量配置 API 基础 URL

## 环境变量

在 `.env.local` 中配置：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

客户端会自动使用这个配置。

## 示例项目结构

```
src/
├── api/
│   ├── generated/      # 自动生成的代码
│   ├── client.ts       # 客户端配置
│   └── index.ts        # 导出
├── app/
│   └── [locale]/
│       └── users/
│           └── page.tsx  # 使用 API 的页面
└── components/
    └── UserList.tsx      # 使用 API 的组件
```
