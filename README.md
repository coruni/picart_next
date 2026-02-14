# PicArt Next

基于 Next.js 16 构建的现代化社交内容平台，支持文章分享、图片展示和社交互动。

## ✨ 功能特性

### 核心功能
- 📝 **内容管理** - 文章创建、浏览、按话题和频道组织
- 👥 **社交互动** - 用户资料、关注系统、收藏、评论和反应
- 🖼️ **媒体处理** - 图片画廊和查看器功能
- 🔐 **用户认证** - 基于 Token 的认证和持久化会话
- 🎨 **装饰系统** - 头像框、表情包、评论装扮等个性化装饰
- ✂️ **图片裁剪** - 头像 1:1 裁剪、背景图 21:9 裁剪

### 技术特性
- ⚡️ **Next.js 16** - 使用 App Router 和 React 19
- 🎨 **Tailwind CSS 4** - 实用优先的 CSS 框架
- 🌍 **next-intl** - 完整的国际化支持（中文/英文）
- 🔌 **@hey-api/openapi-ts** - 类型安全的 API 客户端生成
- 🗃️ **Zustand** - 轻量级状态管理
- 📦 **TypeScript** - 严格模式类型安全
- 🎯 **ESLint** - 代码质量检查
- ⚙️ **React Compiler** - 性能优化

## 🚀 快速开始

### 环境要求

- Node.js 18.17 或更高版本
- pnpm（推荐）或 npm

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd picart-next
```

2. **安装依赖**
```bash
pnpm install
# 或
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：
- API 端点
- 认证密钥
- 其他配置项

4. **生成 API 客户端**（首次运行或 OpenAPI 规范更新后）
```bash
pnpm run openapi
```

5. **启动开发服务器**
```bash
pnpm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # 国际化路由
│   │   ├── (home)/        # 首页动态（路由组）
│   │   ├── account/[id]/  # 用户资料页
│   │   ├── article/[id]/  # 文章详情页
│   │   ├── channel/       # 频道页面
│   │   └── topic/         # 话题页面
│   ├── globals.css        # 全局样式
│   └── layout.tsx         # 根布局
├── api/                   # 生成的 API 客户端
│   ├── client/           # API 客户端代码
│   └── core/             # API 工具函数
├── components/            # React 组件
│   ├── account/          # 账户相关组件
│   ├── article/          # 文章组件
│   ├── channel/          # 频道组件
│   ├── comment/          # 评论组件
│   ├── home/             # 首页动态组件
│   ├── layout/           # 布局组件
│   ├── providers/        # Context 提供者
│   ├── shared/           # 共享/通用组件
│   ├── sidebar/          # 侧边栏小部件
│   ├── topic/            # 话题组件
│   └── ui/               # 基础 UI 组件（Button、Input 等）
├── constants/             # 应用常量
├── hooks/                 # 自定义 React Hooks
├── i18n/                  # 国际化配置
├── lib/                   # 工具函数
├── stores/                # Zustand 状态存储
│   ├── useUserStore.ts   # 用户状态
│   ├── useAppStore.ts    # 应用状态
│   ├── useModalStore.ts  # 模态框状态
│   └── useNotificationStore.ts  # 通知状态
├── types/                 # TypeScript 类型定义
└── middleware.ts          # Next.js 中间件

messages/                  # 翻译文件
├── zh.json               # 中文翻译
└── en.json               # 英文翻译

public/                    # 静态资源
├── account/              # 账户相关图片
├── placeholder/          # 占位图
└── sidebar/              # 侧边栏图片
```

## 📜 可用脚本

```bash
# 开发服务器（localhost:3000）
pnpm run dev

# 生产构建
pnpm run build

# 运行生产服务器
pnpm run start

# 代码质量检查
pnpm run lint

# 从 openapi.json 重新生成 API 客户端
pnpm run openapi
```

## 🏗️ 架构模式

### 组件组织
- **功能驱动** - 按功能分组组件（article、account、topic）
- **共享组件** - 可复用组件放在 `shared/`
- **基础 UI** - 原始组件放在 `ui/`（Button、Input、Dialog 等）
- **客户端组件** - 使用 `.client.tsx` 后缀标识仅客户端组件

### 命名约定
- **文件** - 组件使用 PascalCase（`ArticleCard.tsx`）
- **文件夹** - 路由使用小写加连字符，组件文件夹使用 camelCase
- **组件** - PascalCase，与文件名匹配
- **Hooks** - camelCase，使用 `use` 前缀（`useUserStore`）
- **工具函数** - camelCase（`formatRelativeTime`）

### 路由结构
- 使用路由组 `(name)` 组织布局而不影响 URL
- 动态段：`[id]`、`[locale]`
- 捕获所有段：`[[...slug]]`
- 每个路由可包含：`page.tsx`、`layout.tsx`、`error.tsx`、`not-found.tsx`

### 样式约定
- 仅使用 Tailwind 工具类
- 使用 `cn()` 条件合并类名
- 在组件 props 中定义变体，不使用内联样式
- 响应式：移动优先方法
- 深色模式：使用 Tailwind 的深色模式类

### 状态管理
- **全局状态** - Zustand stores（`src/stores/`）
- **本地状态** - 组件中使用 React `useState`
- **服务器状态** - React Server Components，无需客户端状态
- **持久化状态** - 使用 Zustand persist 中间件

## 🛠️ 技术栈详情

### 核心框架
- **Next.js 16** - App Router + React 19
- **TypeScript** - 严格模式
- **React Compiler** - 性能优化

### 样式与 UI
- **Tailwind CSS 4** - 实用优先样式
- **class-variance-authority** - 组件变体管理
- **lucide-react** - 图标库
- 自定义 UI 组件（`src/components/ui/`）

### 状态管理
- **Zustand** - 全局状态管理
- 主要 stores：`useUserStore`、`useAppStore`、`useModalStore`、`useNotificationStore`
- 使用 persist 中间件持久化认证状态

### 国际化
- **next-intl** - i18n 支持
- 支持语言：`zh`（默认）、`en`
- 翻译文件位于 `messages/` 目录
- 使用 `[locale]` 动态段的本地化路由

### API 集成
- **@hey-api/openapi-ts** - 类型安全的 API 客户端生成
- 生成的客户端位于 `src/api/client/`
- OpenAPI 规范：`openapi.json`
- 使用 `pnpm run openapi` 重新生成

### 其他库
- **@fingerprintjs/fingerprintjs** - 设备指纹识别
- **react-photo-view** - 图片画廊
- **react-avatar-editor** - 头像裁剪
- **swiper** - 轮播图
- **nextjs-toploader** - 页面过渡加载条
- **uuid** - 唯一标识符生成

## 🎯 路径别名

项目配置了路径别名以简化导入：

```typescript
// tsconfig.json 中配置
"@/*" 映射到 "src/*"

// 使用示例
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { useUserStore } from "@/stores/useUserStore"
```

## 🖼️ 图片配置

- 允许所有 HTTPS/HTTP 主机的远程图片
- 图片质量：75、95
- 使用 Next.js `<Image>` 组件进行优化

## 📚 了解更多

### 官方文档
- [Next.js 文档](https://nextjs.org/docs) - Next.js 功能和 API
- [React 文档](https://react.dev) - React 库文档
- [Tailwind CSS 文档](https://tailwindcss.com/docs) - Tailwind 工具类
- [TypeScript 文档](https://www.typescriptlang.org/docs/) - TypeScript 指南

### 库文档
- [next-intl](https://next-intl-docs.vercel.app/) - 国际化
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction) - 状态管理
- [Hey API](https://heyapi.vercel.app/) - OpenAPI 客户端生成
- [Lucide Icons](https://lucide.dev/) - 图标库

## 🚀 部署

### Vercel（推荐）

最简单的部署方式是使用 [Vercel 平台](https://vercel.com)：

1. 将代码推送到 Git 仓库（GitHub、GitLab、Bitbucket）
2. 在 Vercel 中导入项目
3. Vercel 会自动检测 Next.js 并配置构建设置
4. 配置环境变量
5. 部署！

查看 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying) 了解更多详情。

### 其他平台

项目也可以部署到其他支持 Node.js 的平台：
- Netlify
- AWS Amplify
- Railway
- Render
- 自托管服务器

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

## 📄 许可证

[MIT License](LICENSE)

---

使用 ❤️ 和 Next.js 构建
