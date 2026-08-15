# 编辑器 Toolbar 增强计划

## 摘要
基于对项目 `src/components/editor/` 目录下 Quill.js 编辑器实现的扫描，完善 toolbar 的 4 项功能：
1. 在"更多"下拉菜单中添加"插入代码块"功能；
2. 通过补全 `indent` format 支持，完善列表的层级缩进与排序编号行为；
3. 通过启用 Quill 内置 Tab 键盘绑定，完善列表与代码块中的 Tab 缩进；
4. 删除 toolbar 中 header / align / list 下拉菜单项的文字标签，只保留图标。

---

## 当前状态分析

### 编辑器架构
- 基于 **Quill.js**，自定义 toolbar 通过 `src/components/editor/toolbar.ts` 中的原生 DOM API 构建。
- `src/components/editor/Editor.tsx` 负责 Quill 实例初始化、模块配置、事件监听。
- `src/components/editor/constants.tsx` 集中管理图标、字号、颜色、允许格式等常量。
- `src/components/editor/styles.ts` 覆盖 Quill 默认样式。
- 翻译位于 `messages/zh.json` 和 `messages/en.json` 的 `editor.toolbar` 命名空间下。

### 现有问题诊断
1. **`defaultFormats` 缺少 `"indent"`**：`constants.tsx` 的 `defaultFormats` 已包含 `code-block`，但缺少 `indent`。这导致 Quill 内置的 `indent` / `outdent` 键盘绑定在列表中虽然会触发，但 `indent` format 不在允许格式白名单中，无法生效。
2. **more dropdown 缺少 code-block 入口**：`code-block` 已在 `defaultFormats` 中，但 toolbar 的"更多"菜单中没有对应按钮。
3. **下拉菜单项同时显示图标+文字**：header、align、list 的 dropdown 菜单项当前都渲染了图标和 `<span>${label}</span>` 文字，视觉冗余。
4. **Tab 键未在列表/代码块中生效**：由于问题 1，列表内按 Tab 无法缩进，影响列表层级排序行为；代码块内的 Tab 也可能受影响。

### 安全清理验证
`src/lib/rich-text.ts` 的 `ALLOWED_TAGS` 已包含 `pre`、`code`，且 class 白名单包含 `ql-` 前缀。code-block 生成的 HTML（如 `<pre class="ql-syntax" ...>`）会被正确保留。

---

## 拟议修改

### 1. `src/components/editor/constants.tsx`
**目标**：补充 `Code` 图标和 `indent` format。

- 从 `lucide-react` 导入 `Code`。
- 在 `icons` 导出对象中增加 `Code`。
- 在 `defaultFormats` 数组中追加 `"indent"`。

### 2. `src/components/editor/toolbar.ts`
**目标**：添加 code-block 按钮，并移除下拉菜单文字。

- **导入 `Code` 图标**：在 `icons` 解构区域加入 `Code`。
- **添加 code-block 菜单项**：在 more dropdown（`moreDropdown`）的 `cleanItem` 之后添加一个新按钮：
  - 图标使用 `Code`，文案使用 `t("codeBlock")`。
  - `onmousedown` 阻止默认行为防止编辑器失焦。
  - `onclick` 使用 `quill.formatLine(selection.index, selection.length || 1, 'code-block', !isCodeBlock)` 切换当前行的代码块状态（`code-block` 是 block-level format）。
- **移除 header dropdown 文字**：将 header 选项的 `item.innerHTML` 从 `...<span>${label}</span>` 改为仅渲染图标。
- **移除 align dropdown 文字**：同上，仅保留图标。
- **移除 list dropdown 文字**：同上，仅保留图标。
- **size dropdown 保持现状**：size 选项（12px, 14px...）没有对应图标，去掉文字后无法表达含义，故保留纯文字。

### 3. `messages/zh.json` & `messages/en.json`
**目标**：添加 code-block 的翻译键。

- 在 `editor.toolbar` 下新增：
  - zh: `"codeBlock": "代码块"`
  - en: `"codeBlock": "Code Block"`

### 4. `src/components/editor/Editor.tsx`
**目标**：确保 Tab 缩进行为生效。

- **首选方案**：当前 Quill 初始化未自定义 `keyboard.bindings`，在步骤 1 添加 `"indent"` 到 `defaultFormats` 后，Quill 内置的以下绑定将自动生效：
  - 列表内 **Tab**：`indent +1`
  - 列表内 **Shift+Tab**：`indent -1`
  - code-block 内 **Tab**：插入缩进空格（由 Quill 内置 `makeCodeBlockHandler` 处理）
- **备选方案**（仅当测试发现默认行为不生效时启用）：在 Quill 配置中显式添加 `keyboard.bindings`，保留默认的 `indent` / `outdent` / `indent code-block` 逻辑。

---

## 假设与决策

1. **"完善列表排序行为"的界定**：经代码扫描，Quill 的有序列表编号、回车换项、空项退出行等基础行为已由 Quill 内核处理。当前项目中影响列表层级体验的主要障碍是 `indent` format 缺失。因此将本需求聚焦于**补全 indent 支持，使列表可通过 Tab/Shift+Tab 进行层级缩进**，从而让有序列表的层级编号（如 1 → 1.1 → 2）正确呈现。
2. **"完善tab缩进"的界定**：在列表和代码块场景下，Tab 缩进由 Quill 内置绑定提供；普通文本中 Quill 默认插入 `\t`。本计划优先恢复列表/code-block 的 Tab 行为（这是当前明确损坏的），普通文本 Tab 保持 Quill 默认。
3. **"删除toolbar标题的文本"的界定**：用户字面诉求是去掉"标题"（即 header/heading）下拉中的文字。为保持视觉一致性，同步去掉 align 和 list 下拉中的文字。size 下拉无图标，保留文字。more dropdown 中的功能项保持图标+文字（这些不是"标题"，且文字有助于功能识别）。
4. **code-block 使用 `formatLine`**：`code-block` 是 block format，作用于整行而非选区内联文本。使用 `formatLine` 可确保多行选区时所有覆盖的行都被正确切换为代码块。

---

## 验证步骤

1. 打开 create/post 编辑器页面。
2. **验证 code-block**：
   - 点击 toolbar "更多"（+ 号）下拉，应出现"代码块"选项。
   - 点击后，当前行应变为代码块样式（`pre.ql-syntax`）。
   - 再次点击应取消代码块。
3. **验证列表 Tab 缩进**：
   - 创建一个有序列表（1. 2. 3.）。
   - 将光标放在第二项，按 Tab，该项应向右缩进一级，编号变为 `a.` 或保持子层级样式。
   - 按 Shift+Tab 应取消缩进。
4. **验证代码块 Tab 缩进**：
   - 在代码块内按 Tab，应插入空格缩进而非跳出代码块。
5. **验证图标-only 下拉**：
   - header、align、list 的下拉菜单中，每个选项应只显示图标，无文字标签。
   - size 下拉仍显示 `12px` / `14px` 等文字。
6. **验证翻译**：
   - 切换中英文，"代码块"文案应正确切换。
