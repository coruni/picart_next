# GuardedLink 行为说明

这份文档用于说明项目里的 `GuardedLink` 真实行为，避免把它误认为“所有链接都默认要求登录”。

## 一、组件位置

- 组件文件：
  [GuardedLink.tsx](../src/components/shared/GuardedLink.tsx)

- 认证路径判断文件：
  [auth-guard.ts](../src/lib/auth-guard.ts)

## 二、核心结论

- `GuardedLink` 不是“默认必须登录”的链接。
- `GuardedLink` 是否拦截跳转，取决于 `href` 是否命中受保护路径。
- 如果目标路径不受保护，`GuardedLink` 的行为和普通 `Link` 基本一致。

## 三、受保护路径规则

当前受保护前缀定义在 `PROTECTED_PREFIXES`：

- `/create`
- `/messages`
- `/profile`
- `/setting`

除此之外，还有一个账号页特殊规则：

- `/account/:id/edit`
- `/account/:id/decoration`

对应判断逻辑：

- `isProtectedPath(pathname)`
- `requiresAuthForHref(href)`

## 四、运行行为

### 1. 已登录

- 如果用户已登录，`GuardedLink` 正常跳转。

### 2. 未登录且目标路径受保护

- 阻止默认跳转
- 阻止事件继续冒泡
- 停止 top loader
- 打开登录弹窗

也就是说，未登录访问受保护链接时，不会进入目标页面，而是直接弹登录框。

### 3. 未登录但目标路径不受保护

- 正常跳转

## 五、对 `href` 的处理方式

`GuardedLink` 不直接判断完整 URL，而是先提取 path：

- 如果 `href` 是字符串：
  会去掉 query 和 hash
- 如果 `href` 是对象：
  只读取 `pathname`

例如：

- `/setting/privacy?tab=security`
  实际判断路径是 `/setting/privacy`
- `{ pathname: "/account/1/edit", query: { from: "menu" } }`
  实际判断路径是 `/account/1/edit`

## 六、特殊交互：忽略内部点击

`GuardedLink` 支持通过 `data-guarded-link-ignore="true"` 标记内部区域，阻止该区域触发外层链接跳转。

当前用途通常是：

- 卡片整体可点击进入详情
- 卡片内部某个按钮需要独立点击，不希望触发外层跳转

命中该标记后：

- 会阻止默认跳转
- 阻止冒泡
- 停止 top loader

## 七、当前实现的真实结论

- `GuardedLink` 是“按路径做登录守卫”的链接组件
- 不是“默认所有链接都要登录”
- 只有受保护路径才会在未登录时拦截并弹登录框

## 八、适用场景建议

- 适合用于：
  指向 `/create`、`/setting`、`/profile` 等登录后页面的入口

- 不适合用于：
  完全公开页面且不需要守卫的普通链接

- 如果一个卡片需要：
  整体点击跳转
  但内部按钮独立响应
  可以继续搭配 `data-guarded-link-ignore="true"` 使用
