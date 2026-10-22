# 代码审计与优化方案

> 审计方式：只读静态审查（未执行 build / dev / tsc / db 命令）。
> 覆盖：`src/**` 全量（251 tsx / 123 ts，约 5.8 万行，其中 1.7 万行为 `api/types.gen.ts`）。
> 所有结论均附文件与行号，可在动手前逐条复核。

## 一、总览

| 优先级 | 主题 | 条目 | 性质 | 建议时机 |
| --- | --- | --- | --- | --- |
| **P0** | 安全 / 正确性 | 5 | 可被利用或会静默丢数据 | 立刻，单独立 PR |
| **P1** | SSR / 缓存 / 首包 | 11 | 直接影响 FCP / TTFB / 上游 QPS | 第二批 |
| **P2** | 结构收敛 | 9 | 维护成本、回归风险 | 第三批，按模块推进 |
| **P3** | 清理与配置 | 6 | 死代码、配置噪音 | 随手做 |

三条贯穿全局的根因：

1. **一个 client Provider 掐断了全站 SSR** —— 58 个路由的首屏 HTML 都是空的，服务端所有取数都白跑。
2. **`@/lib` 桶文件把服务端模块和客户端工具混在一起** —— 74 个 `"use client"` 文件从它导入，客户端被迫背 `next/cache` + `@/api`。
3. **没有数据层** —— 68 个文件直接调 `*Controller*`，204 个 `useEffect`，71 处手写 toast + try/catch，这是 dashboard 15 份复制粘贴与上传流水线 12 份重复的共同来源。

---

## 二、P0 —— 安全与正确性（建议今天就修）

### 执行状态（2026-10-23）

| 项 | 状态 | 说明 |
| --- | --- | --- |
| P0-1 净化器绕过 | ✅ 已修 | `rich-text.ts` 抽出 `sanitizeElement()`，拆包后对提上来的节点递归净化 |
| P0-2 编辑器 onChange 失效 | ✅ 已修 | 依赖变化 / StrictMode 重挂载时复用实例并重新绑定监听 |
| P0-3 SSR 被掐断 | ⏸ 已撤回 | **不是一行能改的**，见下方「为什么撤回」 |
| P0-4 令牌双存 | ⏸ 待决策 | 真修法需后端改 HttpOnly cookie；只清 localStorage 副本无安全收益 |
| P0-5 socket 请求串台 | ✅ 已修 | 按 responseEvent 建 FIFO 队列共用一个监听，`disconnect()` 时 reject 全部 pending |

> 本轮改动只做了语法级校验（`tsc` 单文件、过滤 TS1xxx）。仓库当前**没有 `node_modules`**，无法跑完整 `typecheck` / `lint` / `dev`，运行时验证需先 `pnpm install`。

### 为什么 P0-3 撤回

初版改法是 `useState(initialUser !== null || initialToken === null)`。动手后发现它会把「空壳 SSR」换成**hydration mismatch**：

1. `useUserStore` 用 `persist` + 同步 `localStorage`，zustand v5 在**模块导入时**就完成 rehydrate。所以客户端首帧的 `isAuthenticated` / `user` 已是 `true`，而服务端渲染出来的是空态 → 头部用户区必然不一致。
2. 反过来在服务端「用 `initialUser` 播种 store」更糟：zustand store 是**模块级单例**，SSR 时会被跨请求共享，等于把 A 用户的资料泄漏给 B 请求。
3. 全仓没有任何 `mounted` 守卫（`grep mounted src/components/layout` 为空），也没有可用的 auth context，所以没有现成的安全锚点。

正确做法（需要单独一批）：
- 让「依赖登录态的 UI」不再直读 store，而是读由布局传入的 props / context（服务端已拿到 `initialUser`）；
- 或给 auth 相关 UI 加统一的 `useHydrated()` 守卫，首帧渲染与 SSR 一致的占位；
- 两者都到位后再删 `return null`，才能既保留 SSR 又不 mismatch。

### P0-1 富文本净化器可被绕过（存储型 XSS）

**位置**：`src/lib/rich-text.ts:593-596`

```ts
if (!ALLOWED_TAGS.has(tagName)) {
  element.replaceWith(...Array.from(element.childNodes));  // ← 提上来后不再净化
  continue;
}
```

`for` 循环遍历的是父节点 `childNodes` 的快照（`:566`）。白名单外的元素被 `replaceWith` 拆包后，其子节点是**新插入**的节点，不在快照里，因此永远不会走属性净化。

**可复现 payload**：`<form><img src=x onerror=alert(1)></form>` —— `form` 不在 `ALLOWED_TAGS`（`:6-45`）→ 拆包 → `img` 上的 `onerror` 原样保留。而 `form` 只存在于 fallback 路径的 `RE_DANGEROUS_TAGS`（`:620`），DOM 路径下根本拦不住。

**影响面**：17 个文件使用 `dangerouslySetInnerHTML`，其中 `CommentItem.tsx:598,609`、`CommentCard.tsx:141,153` 直接渲染用户评论 → 评论区即可打 XSS。

**做法**：
1. 拆包后对新插入的子节点重新走一遍 `sanitizeNodeTree`（改遍历 `element.parentNode.childNodes` 或用 `MutationObserver` 式的循环复检）。
2. 补一条单元测试锚定：`<form><img onerror>`、`<noscript><p title="</noscript><img src=x onerror=alert(1)>">`、`<svg><a xlink:href>` 三类 payload 输出不得含 `on*`。
3. 顺手把两条路径（DOM / 正则）的能力差异标注清楚，或直接让服务端也走同一套白名单。

**验证**：payload 断言全部通过 + 现有评论渲染无变化。

---

### P0-2 `Editor` 的 Quill 初始化 effect 早退，导致 `onChange` 永久静默失效

**位置**：`src/components/editor/Editor.tsx:279-286` 与 `813-822`

```ts
useEffect(() => {
  if (!containerRef.current) return;
  const editorContainer = container.querySelector(".editor-container");
  if (!editorContainer) {     // ← 已存在就整段跳过（含绑定与 cleanup）
    ...
    quill.on("text-change", handleTextChange);
    return () => { quill.off("text-change", handleTextChange); ... };
  }
}, [ref, placeholder, readOnly]);
```

第一次挂载创建容器并绑定监听；cleanup 解绑后，只要容器 DOM 还在（StrictMode 双调用、`readOnly`/`placeholder`/`ref` 变化），第二次执行就会命中「容器已存在」分支 → **整段跳过，监听不再重建** → 输入不再触发 `onChange`，正文静默丢失。

**做法**：容器创建与实例创建分离。用 `quillRef.current` 判断是否复用实例，监听绑定/解绑放在 effect 顶层无条件执行（不要放在 `if (!editorContainer)` 里面）。

**验证**：dev 下反复切换 `readOnly`、StrictMode 双挂载后，输入且刷新父组件 state，`onChange` 必须被调用；发布页字数统计正常。

---

### P0-3 全站 SSR 被关闭，58 个路由首屏 HTML 为空

**位置**：`src/components/providers/UserStateProvider.tsx:25,105-107`，挂在 `src/app/[locale]/layout.tsx:87-91`

```ts
const [isInitialized, setIsInitialized] = useState(false); // 初始永远 false
...
if (!isInitialized) return null;                            // SSR 阶段必返回 null
```

`isInitialized` 只在 `useEffect` 里被置 true，而 effect 服务端不执行 → 服务端渲染时 Provider 返回 `null`，`children` 不进入 HTML。布局里 `getCurrentUser` / `getPublicCategories` / `getPublicConfig` / `getHotSearchKeywordsSSR` 全部取完，最终输出空壳。

**影响**：FCP/LCP 完全依赖 JS 下载执行；SEO 抓不到正文；服务端取数成本 100% 浪费。

**做法**（推荐方案，改动最小）：
```ts
const [isInitialized, setIsInitialized] = useState(initialUser !== null || initialToken === null);
```
即「已知有用户」或「确定无 token」时直接放行首帧；仅「有 token 但服务端没拿到 profile」这一小段才等客户端。若该等待态确实需要，把它下沉成 `children` 内部的局部骨架，而不是挡住整棵树。

**验证**：`curl` 首页 HTML 能搜到正文文字与 `<h1>`；`view-source` 不再只有 `<div id="__next">` 空壳；Lighthouse FCP 前后对比。

---

### P0-4 令牌双存：localStorage + 非 HttpOnly cookie

**位置**：`src/stores/useUserStore.ts:237-246`（`partialize` 持久化 `token` / `refreshToken` 到 `user-storage`）、`:29-70`（同时写非 HttpOnly cookie）

任一 XSS（见 P0-1）都能同时取到两处令牌，且 localStorage 版本无过期控制。

**做法**：`partialize` 只保留 `user` / `isAuthenticated`（可选 `token` 仅在内存态），令牌统一以 HttpOnly + Secure + SameSite cookie 为唯一真相；服务端已有 `getServerCookie(TOKEN_COOKIE_NAME)` 读取链路，改造面可控。

**注意**：需要后端确认 refresh 流程是否依赖客户端读 token；若不改后端，至少把 `refreshToken` 从 localStorage 移除。

---

### P0-5 Socket 请求无 ID 关联，并发时互相 resolve

**位置**：`src/lib/message-socket.ts:281-320`

`request()` 只按事件名注册 `socket.on(responseEvent)`，`handleResponse` 里 `socket.off(responseEvent)` 会摘掉「另一个请求的」监听。而 `useMessageNotificationStore` 至少有两处会并发触发 `getUnreadCount`（`:535` 与 `:643`/`:857`）→ 拿到的计数互相串、监听被误删后永久收不到响应。

**做法**：请求体带 `requestId`，响应按 `requestId` 匹配后只清理自己那个 listener；超时清理。

---

## 三、P1 —— SSR / 缓存 / 首包

### 执行状态（2026-10-23 第二批）

| 项 | 状态 | 说明 |
| --- | --- | --- |
| P1-2 `getCurrentUser` 去重 | ✅ 已修 | 改为 `cache()` 包裹，单次请求内 layout / sidebar / page 只打一次 `/user/profile` |
| P1-5 重型依赖按需加载 | ✅ 部分 | `ArticleCard` 的 ImageViewer、`ArticleRichContent` 的 EmbedVideoPlayer 改 `next/dynamic({ssr:false})`；`create/post` 的 `import Quill` 改 `import type`。剩 Editor 本身仍静态引入，见文末遗留 |
| P1-6 首屏封面抢带宽 | ✅ 已修 | `ArticleCard` 新增 `priority`（默认 false → `loading="lazy"`），`ArticleList` 只给前 2 张 `priority` |
| P1-11 RecommendUserWidget 缓存 | ❌ 撤回建议 | 该组件用 `user.isFollowed` 渲染关注态，是**用户相关数据**，加 `unstable_cache` 会把 A 的关注态泄漏给 B。原审计建议有误 |
| P1-10 create 页重复请求 | ✅ 已修 | 新增 `CategoriesProvider`（根布局的分类树经 AppChrome 下发），三个 create 页不再各自 `categoryControllerFindAll()`；video 页的 `uploadControllerGetUploadConfig` 改读已有的 `UploadConfigProvider`（顺带发现它的 `uploadConfigRef` 只写不读）。分类映射抽成 `lib/category-options.ts`，消掉第 3、第 4 份拷贝 |
| P1-4 `@/lib` 桶跨界 | ✅ 已修 | `index.ts` 去掉 `export * from "./seo"`；`utils.ts` 删掉无人调用的 `getPublicBanners`（它是 `@/api` + `next/cache` 进入客户端的唯一入口）。现在桶内 12 个模块**不再引用** `@/api` / `next/*`；6 处 seo 调用方改为从 `@/lib/seo` 直接导入 |
| 其余 P1 | ⏳ 待定 | P1-1 / P1-3 涉及缓存架构与写操作位置（决策点 3）；P1-9 未开始 |

> 环境：`pnpm install` 已完成，`tsc` / `eslint` 可跑。本轮改动 **0 新增类型错误、0 新增 lint error**。
> `next build` 在本沙箱内跑不完：Next 会先清空 `.next/turbopack`（50+ 文件），被命令执行环境的安全删除守卫拦下。本地终端直接 `pnpm build` 不受影响。

### P1-1 根布局三重禁缓存 + 串行取数 + 零 `loading.tsx`

- `src/app/[locale]/layout.tsx:34-35`：`export const dynamic = "force-dynamic"` + `export const revalidate = 0`
- `:57`：又调 `unstable_noStore()`
- `:46-48`：`generateStaticParams()` 在 `force-dynamic` 下已失效，属死代码
- `:65-74`：`getMessages` → `cookies` → `getCurrentUser` → `categories` → `config` → `hotSearch` 六段**串行** await
- 全仓 `loading.tsx` 数量 **0**，`error.tsx` 只有 1 个（根级）

**做法**：
1. 删掉 `force-dynamic` / `revalidate = 0` / `noStore()`，改为按路由段声明缓存周期（列表页 60s、详情页 ISR、用户相关部分下沉到子组件并标记动态）。
2. 六段 await 改 `Promise.all`（`getCurrentUser` 依赖 token cookie，先取 cookie 再并行其余）。
3. 给 `(home)` / `article/[id]` / `topic/[id]` / `[account]` 各加 `loading.tsx`（骨架 = 现有卡片布局），配 `Suspense` 让慢接口不阻塞整页。

**验证**：响应头出现 `x-nextjs-cache: HIT`；重复访问同一页上游请求数 = 0；TTFB 前后对比。

---

### P1-2 `getCurrentUser` 未去重，Sidebar 推荐用户未缓存

- `src/lib/current-user.ts:6`：裸 async 函数，**没有** `cache()`（同目录 `account-user.ts:9` 已正确使用）
- 单次渲染中 `/account/[id]/followers` 会打 3 次 `/user/profile`（layout + Sidebar + 页面）
- `src/components/sidebar/RecommendUserWidget.tsx:53-60`：无缓存，而兄弟组件 `RecommentTagWidget.tsx:19` 和 `lib/utils.ts:36` 都做了 `unstable_cache`

**做法**：`export const getCurrentUser = cache(async () => ...)`；推荐用户套 `unstable_cache(..., { revalidate: 300, tags: [...] })`。改动量 ~10 行，单页上游请求从 4-5 降到 2。

---

### P1-3 有 5 处 `unstable_cache`，但 0 处 `revalidateTag` / `revalidatePath`

`grep` 结果：`unstable_cache(` 5 处，失效调用 0 处。缓存点：`lib/seo.ts:55,84`、`lib/utils.ts:36`、`lib/hot-search-server.ts:44`、`RecommentTagWidget.tsx:19`（还声明了 `tags: ["tags"]` 却无人触发）。

**影响**：后台改分类/配置后，前台最长 1 小时仍读旧数据，用户可感知。

**做法**：建 `src/lib/cache-tags.ts` 统一常量，写操作后调用 `revalidateTag`。注意写操作目前**在浏览器直连 API**，需要包一层 Route Handler 或 Server Action 才能在服务端失效缓存 —— 这是一个需要决策的点（见第五节）。

---

### P1-4 `@/lib` 桶文件跨越 client/server 边界

`src/lib/index.ts` 同时导出 `./seo`（`next/cache` + `@/api`）、`./utils`（模块级 `unstable_cache` 调用 + `import { bannerControllerFindActive } from "@/api"`）、`./validation`（全文件死代码）。

**74 个 `"use client"` 文件**从 `@/lib` 导入，多数只是要一个 `cn()` → 客户端 chunk 被迫拖入 `next/cache` 与 API SDK（`sdk.gen.ts` 2596 行 / 268 个操作）。

**做法**（二选一）：
- **A（推荐，纯机械）**：桶文件只保留纯客户端安全的工具，服务端模块（`seo` / `utils` 里的 `getPublicBanners` / `notifications`）移出桶；再批量把 `from "@/lib"` 换成具体路径。用 ESLint `no-restricted-imports` 禁用桶导入兜底。
- **B**：新建 `@/lib/client` 作为客户端唯一入口，`@/lib` 保留给 RSC。

**验证**：`analyze` 对比客户端 chunk 体积（当前 `sdk.gen.ts` 是否进了 client bundle 可直接在 analyzer 里看）。

---

### P1-5 重型依赖全部静态导入，全仓只有 1 处 `next/dynamic` 且形同虚设

| 依赖 | 静态引入位置 | 问题 |
| --- | --- | --- |
| `quill` | `components/editor/Editor.tsx:9-11`（另含 CSS）、`app/[locale]/create/post/page.tsx:44`（只为 `useRef<Quill>` 类型） | 编辑器包 100% 进首包 |
| `viewerjs` | `components/article/ArticleCard.tsx:31` 引 `ImageViewer` | **信息流卡片**带上了查看器 → 全站列表页都加载 |
| `artplayer` | `components/article/ArticleRichContent.client.tsx:19-20` | 文章详情首屏背播放器 |
| `swiper` | `components/comment/CommentEditor.tsx:38` 顶层 `import "swiper/css"` | 唯一的 `next/dynamic`（`ArticleCommentList.client.tsx:14`）因 4 个子组件静态 import 而失效 |

**做法**：
1. `create/post` 的 `Quill` 改 `import type`。
2. `ArticleCard` 里的 `ImageViewer` 改 `dynamic(() => import(...), { ssr: false })`，点击时才加载。
3. `EmbedVideoPlayer`、`CommentEditor` 同样 `dynamic`。
4. `Editor.tsx` 保留静态（它在 create 路由本来就该重），但要确保只在 create 段被引用。

**验证**：analyzer 看 `/_next/static/chunks` 里 quill/viewerjs/artplayer 是否已从 `(home)` 与 `article` 路由的 first-load JS 中消失。

---

### P1-6 列表卡片封面全部 eager + high priority

`ArticleCard.tsx:115-116`、`175-176`：每张封面写死 `loading="eager" fetchPriority="high"`，而该组件用于首页/合集/搜索全部信息流（`shared/ArticleList.client.tsx:296`）。一屏 20 张同时抢高优先级，反而拖慢真正的 LCP。

**做法**：加 `index`/`priority` prop，仅前 2-3 张 high，其余 `loading="lazy"`。

---

### P1-7 `next/image` 的 `fill` 大范围缺 `sizes`

72 处 `ImageWithFallback`，48 处用 `fill`，仅 14 处带 `sizes`；`ImageWithFallback.tsx:96` 的 `lazy` 默认 `false`。缺省 `sizes` = `100vw`，移动端下发桌面尺寸图。

**做法**：`ImageWithFallback` 在 `fill` 且无 `sizes` 时给一个合理默认（或 dev 环境 `console.warn`），并批量补上调用点。

> 注：`next.config.ts` 已设 `images.unoptimized: true`，所以 `sizes` 的收益当前主要体现在 `srcset` 选择（若未来开回优化器则收益更大）。这一条优先级可降，但 `lazy` 默认值建议改。

---

### P1-8 `resilientFetch` 在故障时把 SSR 拖到分钟级

`src/lib/resilient-fetch.ts:4-7,33-35,158`：超时 60s × 3 次 + 400/800ms 退避 → 单次最坏 ~181s，而布局是串行取数（P1-1）→ 上游一次抖动整站请求堆叠到分钟级并占满并发。另外 `:130-148,207` 把网络错误合成 503 JSON，页面显示"空列表"而非 `error.tsx`，问题不可观测。

**做法**：SSR 路径超时 8-10s、重试 1 次；网络错误向上抛（让 `error.tsx` 接住），只在客户端交互路径保留重试。

---

### P1-9 全量 i18n messages 注入每个页面

`src/app/[locale]/layout.tsx:65,81`：`getMessages()` 全量塞给 `NextIntlClientProvider`。`zh.json` 26KB、`en.json` 40KB、69 个命名空间，每个页面的 RSC payload 都携带全部。

**做法**：按路由段传子集（next-intl 官方 recommended pattern：`NextIntlClientProvider` 下沉到需要的 segment，或 `pick(messages, [...])`）。

---

### P1-10 创作页重复拉已在布局注入的数据

`create/image/page.tsx:439`、`create/post/page.tsx:367`、`create/video/page.tsx:514` 客户端重拉全量分类（`layout.tsx:94` 已把 `categories` 传下来）；`create/video/page.tsx:553` 又重拉 `uploadControllerGetUploadConfig`（`create/layout.tsx:34` 已注入 `UploadConfigProvider`）。

**做法**：走已有 Provider/context，删掉重复请求。收益：进创作页少 2 次请求，分类下拉不再晚于表单出现。

---

### P1-11 sitemap 静默截断

`src/app/sitemap.ts:9-11,35-56`：每个数据源最多翻 `MAX_PAGES = 10` × 100 条 → 文章超过 1000 篇后 sitemap 静默丢链接，无告警。四个源在 `Promise.all` 内各自串行翻页，冷启动最坏 ~40 次请求。

**做法**：改为「翻到空页为止」+ 总条数上限保护；`articleControllerGetPublishedArticleIds`（已存在，`:1-6` 已导入）可直接拿全量 id 列表，比翻页更省。

---

## 四、P2 —— 结构收敛（按模块推进，不建议一次性动）

| # | 问题 | 位置 / 量化 | 做法 |
| --- | --- | --- | --- |
| 1 | dashboard 19 个 `*Page.client.tsx` 是同一模板的复制变体，合计 **7,797 行**，15/15 都用 `key={refreshKey}` 强制整表重挂载 | `components/dashboard/`（如 `DashboardBannersPage.client.tsx:213`、`.client.tsx` 约 365 行中 180 行是纯样板） | 抽 `useDashboardCrud()` + 描述式 `<DashboardEntityPage descriptor>`；刷新改走 `DashboardProTable.onReload`（已有，`:51,132-138`），避免丢搜索词/页码 |
| 2 | `config-schema.ts` **212 处硬编码中文 label**（133 条 schema），与同目录 `copy.ts` 双语并存；另有 `inferConfigType/inferConfigOptions` 用 20+ 条 `endsWith` 猜类型 | `config-schema.ts:815-2273` | label/description 改 key 走 `copy.ts`；类型改为 schema 里显式声明，删掉猜后缀 |
| 3 | 上传流水线（压缩 → hash → `uploadControllerUploadFile` → 回填 URL）在 **12 处**各写一遍 | `Editor.tsx:505-565`、`CommentEditor.tsx:386-466`、`MessageCenterDetailRoute.client.tsx:768-858`、`DashboardEditDialog.client.tsx:352-448`、`account/*` 4 个、`dashboard/Configs*` 2 个 | 抽 `useImageUpload()` → `{upload, items, progress, remove, revoke}`，统一 blocked.webp 判定与 `revokeObjectURL` |
| 4 | `useMessageNotificationStore` **911 行**混装 socket 生命周期 / HTTP 双通道 / DTO 归一化；`normalize*` ×2、`fetchMessages`×2 逐行同构；`centerMessages` 与 `centerMessagesByTab[tab]` 双写；6 个 `isLoading` 布尔位 | `stores/useMessageNotificationStore.ts:63-911` | 拆 `messageSocket`（传输）/ `messageNormalizer`（映射）/ `useMessageStore`（状态）；布尔位收敛成 `status: "idle"\|"loading"\|"ready"` |
| 5 | `seo.ts` 三个 `generateXxxMetadata` 同构（~120 行）；dashboard 19 个 page 各复制 12 行 metadata 模板；`(follow)/(collection-detail)` 布局缺 metadata | `lib/seo.ts:336-373,498-539,544-585`；`app/[locale]/dashboard/*/page.tsx:6-18` | 抽 `buildStaticPageMetadata({path,title,description,noindex})`；后台 metadata 由路由配置表生成 |
| 6 | 巨型组件：`Editor.tsx` 1663 行（6 类职责）、`MessagePrivateDetailRoutePane.tsx` 1283 行（29 个 props）、`MessageCenterDetailRoute.client.tsx` 1111 行、`SearchBox.tsx` 695 行（14 个 `useState`） | 见 P0-2 同文件 | 按「滚动引擎 / 表情面板 / 输入框 / 菜单」拆分；29 个 props 说明它其实是 5 个组件被压平 |
| 7 | 表情面板 3 份拷贝（约 95 行逐行相同），其中 message 那份写死中文 `aria-label="表情"`、`"全部"`、`"暂无表情"` 绕开 i18n | `CommentEditor.tsx:606-704`、`MessagePrivateDetailRoutePane.tsx:1126-1221` | 抽 `<EmojiPicker>` |
| 8 | 私信图片 URL 解析存在 **4 份**近似实现，且优先级不一致 | `MessagePrivateDetailRoutePane.tsx:54-88`、`MessageCenterDetailRoute.client.tsx:59-82,145-161`、`MessageCenter.utils.ts` 的 `resolvePreviewImageUrls` | ✅ 已合并到 `MessageCenter.utils.ts` 的 `resolveMessageImageUrls()` / `resolveMessageImageUrl()`，优先级统一为 `urls → imageUrl → url`。**更正**：原审计说这会导致「去重失败、消息重复上屏」—— 复核不成立，`matchesPendingPrivateMessage` 两侧都调同一个 `getMessagePayloadUrls`，是自洽的；这属于重复实现，不是已存在的 bug |
| 9 | `hot-search` client/server 双份映射；邮箱正则 3 份（`constants/index.ts:69` 无引用 / `lib/validation.ts:9` 无引用 / `useForm.ts:47` 内联） | — | 各自收敛为单份；正则只留 `useForm` 用的那份 |

**更大的问题（需要你决策）**：全仓无数据层 —— 68 个组件直调 controller、204 个 `useEffect`、71 处 `showToast` + try/catch。`DashboardClientPage.client.tsx:59-169` 一个 effect 里 `Promise.allSettled` 打 9 个接口后手工拆包。这是 #1 / #3 / #5 重复的根因。

可选方案：
- **A**：引入 `@tanstack/react-query`，统一 queryKey/失效/loading/error（改动大，但一次到位，且能配合 P1-3 的缓存失效）。
- **B**：自建 `useRequest` / `useMutation` 薄封装（改动小，只解决重复，不解决缓存）。
- **C**：只做 dashboard 的 `useDashboardCrud`，其余不动（最小方案）。

---

## 五、P3 —— 清理与配置

### 死代码（已 grep 确认零引用）

**执行状态（2026-10-23 第五批）：已清理，共删除 986 行（7 个文件）+ rich-text 内 ~20 行死分支。**

| 文件 | 处理 | 行数 |
| --- | --- | --- |
| `src/lib/validation.ts` | ✅ 整文件删除（14 个 `isXxx` 全无引用），同时移除桶导出 | 130 |
| `src/types/api.ts` | ✅ 整文件删除。它被 `types/index.ts` 的 `export * from "./api"` 带进图，删后补了 2 个仍被外部使用的原始响应类型 re-export | 220 |
| `src/lib/imageProcessing.ts` | ✅ 只保留 `getCropExportType` + 其私有依赖 `imageHasPossibleAlpha`（其余 16 个导出零引用） | -403 |
| `src/constants/index.ts` | ✅ 19 个导出只剩 `APP_NAME`（3 个调用方都只用它） | -67 |
| `src/lib/modal-helpers.ts` | ✅ 删 12 个 `open*/close*` 死函数，保留 `MODAL_IDS` / `openModal` / `openLoginDialog` | -78 |
| `src/lib/notifications.ts` | ✅ 删 `useNotificationPermission` / `usePrivateMessageNotification` 两个零调用 hook，连带 `@/stores`、`react` 依赖 | -41 |
| `src/lib/server-cookies.ts` | ✅ 删 `setServerCookie` / `deleteServerCookie`，保留 `getServerCookie` | -48 |
| `src/lib/rich-text.ts` | ✅ 删 `_extractClass`、未使用的 `RE_STYLE_ATTR`、`sanitizeSvgElement` 里不可达的 `href/xlink:href/src` 分支 | ~20 |

原审计清单（保留作对照）：

| 文件 | 可删内容 | 行数 |
| --- | --- | --- |
| `src/lib/validation.ts` | 整文件（13 个 `isXxx` 全无引用） | 131 |
| `src/types/api.ts` | 整文件（纯 re-export，零导入） | 220 |
| `src/lib/imageProcessing.ts` | 13/18 个导出无引用（`getEXIFOrientation`/`preloadImage(s)`/`generateBlurHash`/`supportsWebP`/`compressImageWithCanvas` …） | ~300 |
| `src/constants/index.ts` | 19 个导出中 17 个无引用（`API_BASE_URL`/`MAX_FILE_SIZE`/`REGEX`/`BREAKPOINTS` …） | — |
| `src/lib/modal-helpers.ts` | 6 个 `close*Dialog`（`openModal` 有 16 处调用） | ~70 |
| `src/lib/notifications.ts` | `useNotificationPermission` / `usePrivateMessageNotification` | ~35 |
| `src/lib/server-cookies.ts` | `setServerCookie` / `deleteServerCookie` | ~45 |
| `src/lib/utils.ts` | `getPublicBanners`（却把 `unstable_cache` 拖进了桶文件） | ~10 |
| `src/lib/rich-text.ts` | `_extractClass`、`sanitizeSvgElement` 里 `href/xlink:href/src` 三个死分支 | ~25 |

⚠️ 注意 `constants.BREAKPOINTS` 与 `lib/validation` 的死并不代表「规则没被用」，`useForm.ts:47` 仍内联着一份邮箱正则 —— 删之前先做 P2-9 的收敛。

### 配置类小问题

1. **`tsconfig.json` include 里有脏路径** ✅ 已修：`"src/app/[locale]/channel/[[...id]]"`、`"src/app/[locale]/account/[id]/(edit)/edit/layout.tsx1"`、`"rumtime.config.ts"` 三条都不指向真实文件（也未被 git 跟踪），已删除，`include` 回到 6 条标准项。
2. **`babel-plugin-react-compiler@1.0.0` 装了但没启用** —— 无 `babel.config`，`next.config.ts` 也无 `reactCompiler: true`。要么启用（React 19 下收益明显），要么从 devDeps 移除，避免误以为已开。
3. **`next.config.ts` 的 `images.remotePatterns` 写了 `"**"` 两条却又 `unoptimized: true`** —— 白名单形同虚设，安全配置给人错误的安全感。
4. **`next.config.ts:29` `allowedDevOrigins:["192.168.1.7"]`** 硬编码局域网 IP，应改环境变量。
5. **`api/image-proxy/route.ts:39-41`**：先 `await res.blob()` 全量读入内存再校验 10MB（限制形同虚设），且无 `AbortSignal` 超时；对非版本化 URL 返回 `immutable` 一年缓存，图片替换后浏览器不刷新。
6. **`app/[locale]/(home)/page.tsx:18`** `initialData?.data?.data.meta.total` 少一层 `?.`，形状异常时直接 TypeError → 空列表变 500。

### 无障碍 / 交互小问题（✅ 四项已修 · 2026-10-23 第六批）

- ✅ `comment/CommentItem.tsx` 成就徽章：`role="button"` + `onKeyDown` 但无 `tabIndex` → 补 `tabIndex={0}`，键盘可聚焦。
- ✅ `layout/UserDropdown.tsx`、`MessageDropdown.tsx`、`CreateDropdown.tsx`：仅 `group-hover:visible` → 三个桌面菜单都补 `group-focus-within:visible group-focus-within:opacity-100`。三处 `group` 祖先与触发按钮都在同一包裹层内，聚焦触发按钮即展开，`Tab` 可继续进入菜单项。
- ✅ `layout/UserLoginDialog.tsx`：重置密码成功的 `alert()` → `showToast(tReset("resetSuccess"))`，与全站一致且不阻塞主线程。
- ✅ `comment/CommentEditor.tsx`：`quill.off("text-change", () => {})` 传匿名新函数导致监听永不解除 → 把 `syncEditorState` 存进 `quillTextChangeRef`，cleanup 用同一引用解绑（每次挂载少泄漏一个监听 + 一个闭包）。
- ⚠️ 顺带记录：`CommentEditor` 的 init effect 有和 `Editor.tsx` 同款的「容器已存在即跳过」模式（`if (!containerRef.current || quillRef.current) return`），`t` 变化时会尝试在已有 DOM 上重建 Quill。当前 locale 切换会整树重挂载，实际触发概率低，未改。

---

## 六、明确**不做**的事

按 `AGENTS.md` 的「Surgical Changes」原则，以下即使看起来可改也不在本次范围：

- 不动 `src/api/**`（openapi 生成物，改配置不改产物）。
- 不做全站组件目录重组 / 文件改名。
- 不为一次性代码加抽象，不引入未使用的配置项。
- 不重构 `ArticleToc` / `rich-text` 的算法细节（除 P0-1 的安全修复）。
- 暂不引入 SSR 之外的渲染方案（不改 App Router 结构）。

---

## 七、执行顺序与验收

```
批次 1（P0，5 项，单独立 PR）
  └ 验收：XSS payload 单测通过；编辑器改名后 onChange 正常；
         curl 首页能拿到正文；令牌不再落 localStorage

批次 2（P1，11 项，按 1→2→3→4 顺序，每项单独可回滚）
  └ 验收：x-nextjs-cache: HIT 出现；首页 SSR HTML 有内容；
         analyzer 对比 first-load JS（目标 -25% 以上）；
         /user/profile 单页调用次数 ≤ 1

批次 3（P2，按模块，dashboard → message → editor → seo）
  └ 验收：dashboard 增删改不再重置搜索/分页；
         tsc 通过；行数指标：dashboard 组件 7797 → 目标 4500 以内

批次 4（P3，随手清理）
  └ 验收：tsc + eslint 通过；analyzer 无新增 chunk
```

每批开始前先跑一次 `pnpm typecheck` 存基线（本轮审计未执行任何构建命令）。

### 当前阻塞：API 类型重新生成带来的 5 个类型错误

`src/api/**` 在本次审计期间被重新生成（`types.gen.ts` +297 行），新 schema 里部分字段被声明成 `unknown`，导致 `next build` 的 TypeScript 步骤失败（Turbopack 编译本身是成功的）：

```
src/components/layout/UserLoginDialog.tsx(157,15)  TS2352
src/components/layout/UserLoginDialog.tsx(250,13)  TS2352
src/app/[locale]/account/[id]/certification/page.tsx(135,19)  TS2322
src/app/[locale]/account/[id]/certification/page.tsx(141,40)  TS2345
src/app/[locale]/account/[id]/certification/page.tsx(208,44)  TS2322
```

根因在 `types.gen.ts:17443,17491` 的 `reviewedAt: unknown`（OpenAPI schema 缺 `type`），以及 `UserControllerLoginResponse` 的 `certification` 与 `UserProfile` 不一致。

两条路：
- **推荐**：后端补 schema（`reviewedAt: type: string, format: date-time`）后重新 `pnpm openapi` 生成；
- 临时：在这 5 处加窄化/`as unknown as`，会掩盖「登录响应结构与 `UserProfile` 不再一致」这个事实。

---

## 八、待你确认的 3 个决策点

1. **数据层**：P2-9 选 A（React Query）/ B（薄封装）/ C（只做 dashboard）？我倾向 **C 先落地**，验证收益后再评估 A。
2. **令牌存储**：P0-4 是否能接受改后端 refresh 流程（改 HttpOnly cookie）？不能的话先只清 localStorage 里的 `refreshToken`。
3. **缓存失效**：P1-3 的写操作目前在浏览器直连 API，要上 `revalidateTag` 必须把写操作挪到 Route Handler / Server Action。是否接受这个改造范围？若不接受，P1-1 的静态化收益会打折（因为无法主动失效）。
