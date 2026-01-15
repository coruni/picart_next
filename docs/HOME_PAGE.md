# 首页实现文档

本文档说明首页的实现结构和组件设计。

## 页面结构

```
首页 (src/app/[locale]/page.tsx)
├── Header (导航栏)
├── 主容器
│   ├── 左侧内容区 (8列)
│   │   ├── QuickActions (快速操作)
│   │   └── FeedList (动态列表)
│   └── 右侧边栏 (4列)
│       ├── TrendingTopics (热门话题)
│       └── Sidebar (推荐用户/广告)
└── NotificationContainer (通知容器)
```

## 组件说明

### 1. 页面组件 (page.tsx)

**特性：**
- ✅ SSR 渲染，SEO 友好
- ✅ 支持国际化 (i18n)
- ✅ 使用 Suspense 实现流式渲染
- ✅ 响应式布局 (移动端/桌面端)

**数据获取：**
- 服务端获取初始数据
- 使用 `generateMetadata` 生成 SEO 元数据

### 2. FeedList 组件

**路径：** `src/components/home/FeedList.tsx`

**功能：**
- 服务端组件，SSR 渲染
- 从 API 获取文章列表
- 展示动态卡片列表

**API 调用：**
```typescript
const response = await articleControllerFindAll({
  query: {
    page: 1,
    limit: 20,
    type: "all",
  },
});
```

### 3. FeedCard 组件

**路径：** `src/components/home/FeedCard.tsx`

**功能：**
- 客户端组件，支持交互
- 展示单个动态内容
- 包含作者信息、内容、封面图、操作栏

**交互功能：**
- 点赞/取消点赞
- 查看评论
- 分享

**Props：**
```typescript
interface FeedCardProps {
  article: {
    id?: number;
    title?: string;
    content?: string;
    coverImage?: string;
    author?: {
      id?: number;
      username?: string;
      avatar?: string;
    };
    createdAt?: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
  };
}
```

### 4. FeedActions 组件

**路径：** `src/components/home/FeedActions.tsx`

**功能：**
- 动态操作栏
- 浏览量、点赞、评论、分享

**Props：**
```typescript
interface FeedActionsProps {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  onLike: () => void;
}
```

### 5. QuickActions 组件

**路径：** `src/components/home/QuickActions.tsx`

**功能：**
- 快速发布入口
- 支持文章、图片、视频发布

### 6. TrendingTopics 组件

**路径：** `src/components/home/TrendingTopics.tsx`

**功能：**
- 服务端组件，SSR 渲染
- 展示热门话题/标签
- 显示话题热度

**API 调用：**
```typescript
const response = await tagControllerFindAll({
  query: {
    page: 1,
    limit: 10,
  },
});
```

### 7. Sidebar 组件

**路径：** `src/components/home/Sidebar.tsx`

**功能：**
- 服务端组件，SSR 渲染
- 推荐关注用户
- 展示 Banner 广告
- 页脚链接

**API 调用：**
```typescript
const response = await bannerControllerFindActive({
  query: {
    position: "sidebar",
  },
});
```

### 8. Header 组件

**路径：** `src/components/layout/Header.tsx`

**功能：**
- 全局导航栏
- Logo、搜索框、通知、用户菜单
- 语言切换
- 登录/注册入口

### 9. FeedListSkeleton 组件

**路径：** `src/components/home/FeedListSkeleton.tsx`

**功能：**
- 加载骨架屏
- 提升用户体验
- 配合 Suspense 使用

## 数据流

### SSR 数据获取流程

```
1. 用户访问首页
   ↓
2. Next.js 服务端渲染
   ↓
3. 并行获取数据：
   - FeedList: 文章列表
   - TrendingTopics: 热门话题
   - Sidebar: Banner 广告
   ↓
4. 渲染 HTML
   ↓
5. 返回给客户端
   ↓
6. 客户端水合 (Hydration)
   ↓
7. 交互功能激活
```

### 客户端交互流程

```
1. 用户点击点赞
   ↓
2. FeedCard 更新本地状态
   ↓
3. 调用 API (可选)
   ↓
4. 更新 UI
```

## SEO 优化

### 1. 元数据生成

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    title: t("title"),
    description: t("description"),
  };
}
```

### 2. 语义化 HTML

- 使用正确的 HTML 标签
- 合理的标题层级 (h1, h2, h3)
- 图片添加 alt 属性

### 3. 结构化数据

可以添加 JSON-LD 结构化数据：

```typescript
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "PicArt",
  "url": "https://picart.com"
}
</script>
```

## 性能优化

### 1. 图片优化

使用 Next.js Image 组件：
```typescript
<Image
  src={article.coverImage}
  alt={article.title}
  fill
  className="object-cover"
/>
```

### 2. 代码分割

- 客户端组件使用 `"use client"`
- 服务端组件默认 SSR
- 动态导入大型组件

### 3. 流式渲染

使用 Suspense 实现流式渲染：
```typescript
<Suspense fallback={<FeedListSkeleton />}>
  <FeedList />
</Suspense>
```

### 4. 缓存策略

```typescript
// 静态生成
export const revalidate = 60; // 60秒重新验证

// 或使用 fetch 缓存
fetch(url, {
  next: { revalidate: 60 }
});
```

## 响应式设计

### 断点

```css
- 移动端: < 768px
- 平板: 768px - 1024px
- 桌面: > 1024px
```

### 布局

```typescript
// 移动端: 单列
// 桌面端: 8:4 两列布局
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div className="lg:col-span-8">...</div>
  <div className="lg:col-span-4">...</div>
</div>
```

## 国际化

### 翻译文件

- `messages/zh.json` - 中文
- `messages/en.json` - 英文

### 使用方式

```typescript
// 服务端
const t = await getTranslations("home");

// 客户端
const t = useTranslations("home");
```

## 状态管理

### Zustand Store

```typescript
import { useUserStore } from "@/stores";

const { user, isAuthenticated } = useUserStore();
```

## API 集成

### 类型安全

```typescript
import type { ArticleList } from "@/types";
import { articleControllerFindAll } from "@/api";

const response = await articleControllerFindAll({
  query: { page: 1, limit: 20 },
});

const articles: ArticleList = response.data;
```

## 扩展建议

### 1. 无限滚动

```typescript
// 使用 react-intersection-observer
import { useInView } from "react-intersection-observer";

const { ref, inView } = useInView();

useEffect(() => {
  if (inView) {
    loadMore();
  }
}, [inView]);
```

### 2. 实时更新

```typescript
// 使用 WebSocket 或 Server-Sent Events
const ws = new WebSocket("ws://api.example.com");

ws.onmessage = (event) => {
  const newArticle = JSON.parse(event.data);
  // 更新列表
};
```

### 3. 个性化推荐

```typescript
// 根据用户兴趣推荐内容
const response = await articleControllerFindRecommendations({
  query: {
    userId: user.id,
    limit: 20,
  },
});
```

### 4. 内容过滤

```typescript
// 添加分类/标签过滤
const [activeCategory, setActiveCategory] = useState("all");

const filteredArticles = articles.filter(
  article => activeCategory === "all" || article.categoryId === activeCategory
);
```

## 测试

### 单元测试

```typescript
import { render, screen } from "@testing-library/react";
import { FeedCard } from "./FeedCard";

test("renders article title", () => {
  render(<FeedCard article={mockArticle} />);
  expect(screen.getByText("Test Title")).toBeInTheDocument();
});
```

### E2E 测试

```typescript
// 使用 Playwright
test("user can like an article", async ({ page }) => {
  await page.goto("/");
  await page.click('[data-testid="like-button"]');
  await expect(page.locator(".like-count")).toHaveText("1");
});
```

## 部署

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### 环境变量

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://picart.com
```

## 监控

### 性能监控

```typescript
// 使用 Next.js Analytics
import { Analytics } from "@vercel/analytics/react";

<Analytics />
```

### 错误追踪

```typescript
// 使用 Sentry
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
});
```
