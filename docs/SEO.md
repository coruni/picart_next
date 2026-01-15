# SEO 配置文档

## 概述

本项目实现了基于 API 的动态 SEO 配置系统，通过 `getPublicConfigs` 接口获取网站配置信息，自动生成 SEO 元数据。

## 文件结构

```
src/
├── lib/
│   └── seo.ts                    # SEO 工具函数
├── app/
│   └── [locale]/
│       └── layout.tsx            # 使用动态 SEO 的布局
└── api/
    └── generated/                # 自动生成的 API 客户端
```

## 功能特性

### 1. 网站级别 SEO

从 API 配置自动生成：
- 网站标题和描述
- 关键词（支持多个来源合并）
- Open Graph 标签
- Twitter Card 标签
- 网站图标和 Logo
- 维护模式下的 robots 控制

### 2. 文章页面 SEO

支持为文章页面生成：
- 文章标题和描述
- 文章封面图
- 作者信息
- 发布时间
- 标签关键词

### 3. 作者页面 SEO

支持为作者页面生成：
- 作者名称和简介
- 作者头像
- Profile 类型的 Open Graph

## 使用方法

### 1. 在 Layout 中使用（已配置）

`src/app/[locale]/layout.tsx` 已经配置了动态 SEO：

```tsx
import { generateSiteMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateSiteMetadata(locale);
}
```

### 2. 在文章页面使用

创建 `src/app/[locale]/article/[id]/page.tsx`：

```tsx
import { generateArticleMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  
  // 获取文章数据
  const article = await getArticle(id);
  
  return generateArticleMetadata(
    {
      title: article.title,
      description: article.description,
      cover: article.cover,
      author: article.author.username,
      tags: article.tags.map(t => t.name),
      createdAt: article.createdAt,
    },
    locale
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);
  
  return (
    <article>
      <h1>{article.title}</h1>
      {/* 文章内容 */}
    </article>
  );
}
```

### 3. 在作者页面使用

创建 `src/app/[locale]/author/[username]/page.tsx`：

```tsx
import { generateAuthorMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; locale: string }>;
}): Promise<Metadata> {
  const { username, locale } = await params;
  
  // 获取作者数据
  const author = await getAuthor(username);
  
  return generateAuthorMetadata(
    {
      username: author.username,
      bio: author.bio,
      avatar: author.avatar,
    },
    locale
  );
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const author = await getAuthor(username);
  
  return (
    <div>
      <h1>{author.username}</h1>
      {/* 作者信息 */}
    </div>
  );
}
```

### 4. 直接获取公共配置

```tsx
import { getPublicConfig } from "@/lib/seo";

export default async function MyComponent() {
  const config = await getPublicConfig();
  
  if (!config) {
    return <div>配置加载失败</div>;
  }
  
  return (
    <div>
      <h1>{config.site_name}</h1>
      <p>{config.site_description}</p>
      {config.maintenance_mode && (
        <div className="alert">
          {config.maintenance_message}
        </div>
      )}
    </div>
  );
}
```

## API 配置字段

### 网站基本信息

```typescript
{
  site_name: string;              // 网站名称
  site_subtitle: string;          // 网站副标题
  site_description: string;       // 网站描述
  site_keywords: string;          // 网站关键词
  site_logo: string;              // 网站 Logo URL
  site_favicon: string;           // 网站图标 URL
  site_mail: string;              // 联系邮箱
}
```

### SEO 相关配置

```typescript
{
  seo_long_tail_keywords: string;      // 长尾关键词
  seo_home_keywords: string;           // 首页关键词
  seo_author_page_keywords: string;    // 作者页关键词
  seo_article_page_keywords: string;   // 文章页关键词
}
```

### 维护模式

```typescript
{
  maintenance_mode: boolean;      // 是否维护模式
  maintenance_message: string;    // 维护提示信息
}
```

## 生成的 SEO 标签示例

### HTML Head 标签

```html
<head>
  <!-- 基本信息 -->
  <title>PicArt - 现代图片分享平台</title>
  <meta name="description" content="一个现代化的图片分享社区平台" />
  <meta name="keywords" content="图片,艺术,分享,社区" />
  
  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="PicArt" />
  <meta property="og:description" content="一个现代化的图片分享社区平台" />
  <meta property="og:image" content="https://example.com/logo.png" />
  <meta property="og:url" content="https://example.com" />
  <meta property="og:site_name" content="PicArt" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="PicArt" />
  <meta name="twitter:description" content="一个现代化的图片分享社区平台" />
  <meta name="twitter:image" content="https://example.com/logo.png" />
  
  <!-- Robots -->
  <meta name="robots" content="index, follow" />
  
  <!-- 图标 -->
  <link rel="icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
</head>
```

## 环境变量

在 `.env` 或 `.env.local` 中配置：

```env
# 网站基础 URL（用于生成绝对路径）
NEXT_PUBLIC_APP_URL=https://your-domain.com

# API 基础 URL
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

## 最佳实践

### 1. 关键词优化

- 使用多个关键词来源（网站关键词 + 页面关键词 + 长尾关键词）
- 关键词自动去重和清理
- 避免关键词堆砌

### 2. 图片优化

- 使用合适尺寸的 Open Graph 图片（1200x630）
- 提供 alt 文本
- 使用 CDN 加速图片加载

### 3. 维护模式

- 维护模式下自动设置 `robots: noindex, nofollow`
- 防止搜索引擎索引维护页面

### 4. 多语言支持

- 为不同语言生成对应的 locale 标签
- 使用 alternates 指定语言版本

### 5. 结构化数据

可以扩展添加 JSON-LD 结构化数据：

```tsx
export function generateJsonLd(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "image": article.cover,
    "author": {
      "@type": "Person",
      "name": article.author.username,
    },
    "datePublished": article.createdAt,
    "dateModified": article.updatedAt,
  };
}

// 在页面中使用
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(generateJsonLd(article)) }}
/>
```

## 调试和验证

### 1. 使用 Next.js 开发工具

```bash
npm run dev
```

访问页面并查看 HTML 源代码中的 meta 标签。

### 2. 使用在线工具验证

- [Open Graph Debugger](https://www.opengraph.xyz/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Google Rich Results Test](https://search.google.com/test/rich-results)

### 3. 检查 robots.txt

确保 `public/robots.txt` 配置正确：

```txt
User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml
```

## 常见问题

### Q: SEO 配置不生效？

A: 检查以下几点：
1. API 接口是否正常返回数据
2. 环境变量 `NEXT_PUBLIC_APP_URL` 是否配置
3. 清除浏览器缓存重新加载
4. 检查 Next.js 构建日志

### Q: 如何自定义特定页面的 SEO？

A: 在页面组件中导出 `generateMetadata` 函数：

```tsx
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "自定义标题",
    description: "自定义描述",
  };
}
```

### Q: 如何处理 API 请求失败？

A: `getPublicConfig` 函数已经包含错误处理，失败时返回 `null`，并使用默认配置。

### Q: 如何添加更多 SEO 字段？

A: 在 `src/lib/seo.ts` 中的 `generateSiteMetadata` 函数中添加更多字段。

## 性能优化

### 1. 缓存配置

考虑使用 Next.js 的数据缓存：

```tsx
import { cache } from "react";

export const getPublicConfig = cache(async () => {
  // ... 获取配置
});
```

### 2. 静态生成

对于不经常变化的页面，使用静态生成：

```tsx
export const revalidate = 3600; // 每小时重新验证一次
```

### 3. 增量静态再生成（ISR）

```tsx
export const revalidate = 60; // 每分钟重新验证
```

## 扩展功能

### 1. 添加 Sitemap

创建 `src/app/sitemap.ts`：

```tsx
import { MetadataRoute } from "next";
import { getPublicConfig } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = await getPublicConfig();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    // 添加更多页面...
  ];
}
```

### 2. 添加 Robots.txt

创建 `src/app/robots.ts`：

```tsx
import { MetadataRoute } from "next";
import { getPublicConfig } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await getPublicConfig();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (config?.maintenance_mode) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```
