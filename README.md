This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 功能特性

- ⚡️ Next.js 16 - 最新版本的 React 框架
- 🎨 Tailwind CSS - 实用优先的 CSS 框架
- 🌍 next-intl - 国际化支持（中文/英文）
- 🔌 HeyAPI - 类型安全的 API 客户端生成
- 🗃️ Zustand - 轻量级状态管理（类似 Pinia）
- 📦 TypeScript - 类型安全
- 🎯 ESLint - 代码质量检查
- 🛠️ 完整的工具函数库

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.local.example .env.local
```

### 生成 API 客户端（可选）

```bash
npm run openapi
```

### 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## 项目结构

```
src/
├── app/                 # Next.js App Router
│   ├── [locale]/       # 国际化路由
│   └── globals.css     # 全局样式
├── api/                # API 客户端
│   ├── generated/      # 自动生成的 API 代码
│   ├── client.ts       # API 客户端配置
│   └── index.ts
├── components/         # React 组件
├── config/            # 配置文件
├── constants/         # 常量定义
├── hooks/             # 自定义 React Hooks
├── i18n/              # 国际化配置
├── lib/               # 工具函数库
├── stores/            # Zustand 状态管理
│   ├── useUserStore.ts
│   ├── useAppStore.ts
│   ├── useCartStore.ts
│   ├── useModalStore.ts
│   └── useNotificationStore.ts
└── types/             # TypeScript 类型定义

messages/              # 翻译文件
├── zh.json           # 中文
└── en.json           # 英文

docs/                 # 文档
├── UTILS.md          # 工具函数文档
├── API.md            # API 客户端文档
├── I18N.md           # 国际化文档
└── STORE.md          # 状态管理文档
```

## 可用脚本

```bash
# 开发
npm run dev

# 构建
npm run build

# 生产环境运行
npm run start

# 代码检查
npm run lint

# 生成 API 客户端
npm run openapi
```

## 文档

- [工具函数使用文档](./docs/UTILS.md)
- [API 客户端使用文档](./docs/API.md)
- [国际化使用文档](./docs/I18N.md)
- [状态管理使用文档](./docs/STORE.md)
- [类型定义使用文档](./docs/TYPES.md)

## 技术栈

- **框架**: Next.js 16
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **国际化**: next-intl
- **API 客户端**: @hey-api/openapi-ts
- **状态管理**: Zustand
- **代码质量**: ESLint

## 了解更多

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [next-intl 文档](https://next-intl-docs.vercel.app/)
- [HeyAPI 文档](https://heyapi.vercel.app/)

## 部署

推荐使用 [Vercel](https://vercel.com) 部署 Next.js 应用。

查看 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying) 了解更多详情。
