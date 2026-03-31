# 翻译相关标识符整理

这份文档用于集中记录站内翻译功能使用到的标识符、选择器、存储键、全局 API 和主要入口文件，方便后续维护。

## 一、核心 DOM 标识符

- `data-auto-translate-content`
  用于标记普通内容块，这类节点会参与自动翻译。
  常见位置：文章卡片、话题卡片、话题详情、文章详情正文、搜索结果、侧边栏推荐内容。

- `data-auto-translate-comment`
  用于标记评论内容，这类节点会参与自动翻译。
  常见位置：评论卡片、评论项、评论回复、评论回复弹窗。

- `data-auto-translate-article-detail`
  用于标记文章详情页的翻译作用域根节点。
  文章详情页的翻译提示条会基于这个范围控制翻译。

- `data-manual-translate-comment`
  手动翻译评论时临时插入的 DOM 标记。
  由 `useManualHtmlTranslate()` 在内存中创建，翻译完成后移除。

- `#translateSelectLanguage`
  translate.js 自带的语言选择器 DOM。
  当前项目会主动移除，不让它显示在页面上。

- `#translate`
  translate.js 挂载容器。
  当这个容器为空时会被移除。

## 二、选择器常量

- `AUTO_TRANSLATE_SELECTOR`
  值：
  `[data-auto-translate-content], [data-auto-translate-comment]`
  定义位置：
  [ContentAutoTranslateProvider.tsx](../src/components/providers/ContentAutoTranslateProvider.tsx)

- `MANUAL_TRANSLATE_SELECTOR`
  值：
  `[data-manual-translate-comment]`
  定义位置：
  [useManualHtmlTranslate.ts](../src/hooks/useManualHtmlTranslate.ts)

- `DETAIL_TRANSLATE_SCOPE_SELECTOR`
  值：
  `[data-auto-translate-article-detail] [data-auto-translate-content]`
  定义位置：
  [ArticleTranslateNotice.tsx](../src/components/article/ArticleTranslateNotice.tsx)

## 三、语言映射相关标识符

- `TRANSLATE_LOCAL_LANGUAGE`
  当前值：
  `chinese_simplified`
  作用：
  作为 translate.js 的源语言。
  定义位置：
  [ContentAutoTranslateProvider.tsx](../src/components/providers/ContentAutoTranslateProvider.tsx)
  [useManualHtmlTranslate.ts](../src/hooks/useManualHtmlTranslate.ts)

- `TRANSLATE_LANGUAGE_MAP`
  当前映射：
  - `zh -> chinese_simplified`
  - `en -> english`
  定义位置：
  [ContentAutoTranslateProvider.tsx](../src/components/providers/ContentAutoTranslateProvider.tsx)
  [useManualHtmlTranslate.ts](../src/hooks/useManualHtmlTranslate.ts)
  [ArticleTranslateNotice.tsx](../src/components/article/ArticleTranslateNotice.tsx)

## 四、脚本与运行时相关标识符

- `LOCAL_TRANSLATE_SCRIPT_PATH`
  当前值：
  `/vendor/translate.js/3.18.66/translate.js`
  作用：
  本地 translate.js 脚本路径。

- `TRANSLATE_SCRIPT_ID`
  当前值：
  `local-translate-js`
  作用：
  用于识别和复用注入过的翻译脚本。

- `MUTATION_TRANSLATE_DEBOUNCE_MS`
  当前值：
  `180`
  作用：
  自动翻译模式下，页面新增可翻译节点时的防抖间隔。

- `TRANSLATE_TIMEOUT_MS`
  当前值：
  `1800`
  作用：
  手动翻译临时 DOM 时的超时时间。

- `TRANSLATE_SETTLE_MS`
  当前值：
  `160`
  作用：
  手动翻译时，DOM 变更稳定后的收敛等待时间。

- `DEBOUNCE_DELAY`
  当前值：
  `150`
  作用：
  文章详情翻译提示条的状态更新防抖时间。

## 五、Zustand 状态与存储键

- `useTranslateStore`
  翻译相关的 Zustand store。
  定义位置：
  [useAppStore.ts](../src/stores/useAppStore.ts)

- `autoTranslateContent`
  自动翻译开关状态。

- `setAutoTranslateContent`
  自动翻译开关的 setter。

- `translate-storage`
  `useTranslateStore` 的持久化 key。
  当前存储位置是 `sessionStorage`。

- `to`
  文章详情翻译状态识别时会读取的 translate.js 存储键。
  读取方式：
  `translate.storage.get("to")`

## 六、全局翻译 API

全局类型声明位置：
[translate.ts](../src/types/translate.ts)

- `window.translate`
  翻译能力的全局入口对象。

- `window.translate.execute(documents)`
  对指定节点集合执行翻译。

- `window.translate.changeLanguage(language)`
  切换目标语言。

- `window.translate.reset()`
  恢复原文。

- `window.translate.setDocuments(documents)`
  注册本次要翻译的节点集合。

- `window.translate.listener.start()`
  启动内部监听器。

- `window.translate.language.setLocal(language)`
  设置源语言。

- `window.translate.language.getCurrent()`
  获取当前目标语言。

- `window.translate.service.use(service)`
  设置翻译服务。
  当前项目使用的是：
  `client.edge`

- `window.translate.selectLanguageTag.show`
  translate.js 自带语言选择器的显示开关。
  当前项目会强制设为 `false`。

- `window.translate.storage.set(key, value)`
  当前项目重写后用于写入 `sessionStorage`。

- `window.translate.storage.get(key)`
  当前项目重写后用于读取 `sessionStorage`。

- `window.translate.node.data`
  文章详情翻译状态识别时用来判断当前页面是否已有翻译节点。

- `window.translate.to`
  在全局类型定义里保留的可能目标语言字段。

## 七、主要入口文件

- `ContentAutoTranslateProvider`
  全站自动翻译协调入口。
  文件：
  [ContentAutoTranslateProvider.tsx](../src/components/providers/ContentAutoTranslateProvider.tsx)

- `useManualHtmlTranslate`
  评论等 HTML 片段的手动翻译 Hook。
  文件：
  [useManualHtmlTranslate.ts](../src/hooks/useManualHtmlTranslate.ts)

- `ArticleTranslateNotice`
  文章详情页翻译提示条，以及“查看翻译 / 查看原文”的切换逻辑。
  文件：
  [ArticleTranslateNotice.tsx](../src/components/article/ArticleTranslateNotice.tsx)

## 八、界面文案 key

- `commentList.translate`
  评论相关翻译按钮文案。

- `articleDetail.translatedBy`
  文章详情页“由 xxx 翻译”提示文案。

- `articleDetail.viewTranslation`
  切换到翻译内容。

- `articleDetail.viewOriginal`
  切换回原文。

- `header.autoTranslate`
  自动翻译开关文案。

## 九、当前翻译流程概览

- 自动翻译
  由 `ContentAutoTranslateProvider` 驱动。
  目标节点为 `AUTO_TRANSLATE_SELECTOR` 选中的内容。

- 手动翻译
  由 `useManualHtmlTranslate` 驱动。
  通过临时挂载一个带 `data-manual-translate-comment` 的隐藏 DOM 来完成翻译。

- 文章详情局部翻译
  由 `ArticleTranslateNotice` 驱动。
  目标范围为 `DETAIL_TRANSLATE_SCOPE_SELECTOR`。

## 十、维护建议

- 新增普通内容块，如果希望参与全站自动翻译，请添加 `data-auto-translate-content`。
- 新增评论类 HTML 内容，如果希望参与评论翻译链路，请添加 `data-auto-translate-comment`。
- 如果以后调整语言代码或替换 translate.js，需要同步更新 `TRANSLATE_LANGUAGE_MAP`、`TRANSLATE_LOCAL_LANGUAGE` 和这份文档。
- 如果以后修改本地翻译脚本版本或来源，需要同步更新 `LOCAL_TRANSLATE_SCRIPT_PATH` 和这份文档。

