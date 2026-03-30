---
name: Project Agent Guide
description: PicArt Next 项目开发指南
type: reference
---

# PicArt Next 开发指南

## 技术栈（package.json）

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.1.2 | App Router, React Compiler |
| React | 19.2.3 | UI 框架 |
| Quill | 2.0.3 | 富文本编辑器（非 react-quill） |
| Zustand | ^5.0.10 | 状态管理 |
| next-intl | ^4.7.0 | 国际化 |
| @hey-api/openapi-ts | ^0.90.3 | API 客户端生成 |

## 开发命令

```powershell
pnpm run dev          # 开发服务器
pnpm run build        # 生产构建
pnpm run lint         # ESLint
pnpm run typecheck    # TypeScript 检查
pnpm run openapi      # 生成 API 客户端
```

## 关键架构

### API 客户端

从 `openapi.json` 自动生成，导入自 `@/api`：

```typescript
import { articleControllerFindAll } from "@/api";
const response = await articleControllerFindAll({ query: { page: 1, limit: 10 } });
const data = response?.data?.data?.data || [];  // 三层嵌套
```

认证拦截器在 `src/runtime.config.ts`。

### 状态管理

Zustand stores 在 `src/stores/`：
- `useUserStore` - 认证状态，token 持久化到 localStorage 和 cookie
- `useAppStore` - 应用配置
- `useModalStore` - 模态框
- `useNotificationStore` - 通知

### 国际化

```typescript
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
const t = useTranslations();
```

配置：`src/i18n/routing.ts`，语言 `zh`/`en`，默认 `zh`。

### 富文本编辑器

在 `src/components/editor/`：
- `Editor.tsx` - 主组件
- `blots/` - 自定义 Blot
- `specs/` - BlotSpec 实现
- `actions/` - 工具栏操作

### 组件规范

- PascalCase 文件名：`ArticleCard.tsx`
- 客户端组件：`.client.tsx` 后缀
- 使用 `cn()` 合并 Tailwind 类

## 平台说明

- Windows 开发环境
- pnpm 包管理器
- Husky + lint-staged 提交检查