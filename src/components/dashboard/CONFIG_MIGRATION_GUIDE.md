# 后台配置系统 v2 迁移指南

## 概述

新的配置系统采用 **Schema-First** 设计，提供更直观、更灵活的配置管理方式。

## 主要改进

| 特性 | 旧系统 | 新系统 v2 |
|------|--------|-----------|
| 类型系统 | 简单的字符串标签 | 15+ 种强类型支持 |
| 编辑器推断 | 基于关键词猜测 | 声明式配置，精确匹配 |
| 验证规则 | 无 | 完整的验证系统 |
| 条件显示 | 不支持 | 支持配置项依赖 |
| 默认值 | 无 | 支持默认值和空值处理 |
| UI 配置 | 无 | 丰富的 UI 配置选项 |
| 类型安全 | 弱 | 完整的 TypeScript 支持 |

## 配置类型对比

### 旧系统
```typescript
// 类型只是字符串标签
type ConfigType = "string" | "number" | "boolean" | "json" | "text";

// 编辑器通过关键词推断
const IMAGE_KEYWORDS = ["logo", "image", "cover", "avatar"];
const TEXTAREA_KEYWORDS = ["description", "content", "message"];
```

### 新系统
```typescript
// 15+ 种精确类型
type ConfigValueType =
  | "string"
  | "number"
  | "boolean"
  | "text"
  | "json"
  | "select"       // ✅ 新增
  | "multiselect"  // ✅ 新增
  | "image"        // ✅ 原生支持
  | "file"         // ✅ 新增
  | "color"        // ✅ 新增
  | "date"         // ✅ 新增
  | "datetime"     // ✅ 新增
  | "url"          // ✅ 新增
  | "email"        // ✅ 新增
  | "password"     // ✅ 新增
  | "jsonArray";   // ✅ 新增
```

## Schema 配置示例

### 1. 基础字符串配置
```typescript
const config: ConfigSchema = {
  key: "site.name",
  label: "站点名称",
  description: "网站的显示名称",
  type: "string",
  defaultValue: "PicArt",
  public: true,
  group: "site",
  ui: {
    placeholder: "请输入站点名称",
    width: "half",
  },
  validation: {
    required: true,
    max: 50,
    message: "站点名称不能超过50个字符",
  },
};
```

### 2. 图片上传配置
```typescript
const config: ConfigSchema = {
  key: "site.logo",
  label: "站点 Logo",
  type: "image",  // ✅ 明确声明为图片
  public: true,
  group: "site",
  ui: {
    upload: {
      accept: "image/*",
      maxSize: 2,  // MB
      aspectRatio: "1:1",
      compressQuality: 0.8,
    },
  },
};
```

### 3. 下拉选择配置
```typescript
const config: ConfigSchema = {
  key: "site.language",
  label: "默认语言",
  type: "select",  // ✅ 新增类型
  defaultValue: "zh",
  public: true,
  group: "site",
  ui: {
    options: [
      { value: "zh", label: "简体中文" },
      { value: "en", label: "English" },
      { value: "ja", label: "日本語" },
    ],
  },
};
```

### 4. 带依赖的条件配置
```typescript
const configs: ConfigSchema[] = [
  {
    key: "site.maintenance.enabled",
    label: "启用维护模式",
    type: "boolean",
    defaultValue: "false",
    public: false,
    group: "site",
  },
  {
    key: "site.maintenance.message",
    label: "维护提示信息",
    type: "text",
    defaultValue: "网站正在维护中...",
    public: true,
    group: "site",
    // ✅ 仅当 maintenance.enabled 为 true 时显示
    when: {
      key: "site.maintenance.enabled",
      operator: "eq",
      value: "true",
    },
  },
];
```

### 5. JSON 配置
```typescript
const config: ConfigSchema = {
  key: "membership.levels",
  label: "会员等级配置",
  type: "json",
  defaultValue: JSON.stringify([
    { level: 1, name: "普通会员", price: 0 },
    { level: 2, name: "高级会员", price: 99 },
  ]),
  public: true,
  group: "membership",
  validation: {
    required: true,
  },
  // JSON 编辑器自带格式化功能
};
```

### 6. 颜色选择器
```typescript
const config: ConfigSchema = {
  key: "theme.primaryColor",
  label: "主题色",
  type: "color",
  defaultValue: "#3b82f6",
  public: true,
  group: "theme",
  ui: {
    colorFormat: "hex",  // hex | rgb | hsl
  },
};
```

### 7. 数字配置（带范围）
```typescript
const config: ConfigSchema = {
  key: "upload.maxFileSize",
  label: "最大文件大小",
  type: "number",
  defaultValue: "10",
  public: true,
  group: "upload",
  ui: {
    min: 1,
    max: 100,
    step: 1,
    suffix: "MB",
  },
  validation: {
    required: true,
    min: 1,
    max: 100,
  },
};
```

### 8. 多选配置
```typescript
const config: ConfigSchema = {
  key: "site.enabledFeatures",
  label: "启用的功能",
  type: "multiselect",
  defaultValue: "article,comment",
  public: true,
  group: "site",
  ui: {
    options: [
      { value: "article", label: "文章" },
      { value: "comment", label: "评论" },
      { value: "like", label: "点赞" },
      { value: "follow", label: "关注" },
    ],
  },
};
```

## API 变更

### 数据格式对比

#### 旧格式
```json
{
  "id": 1,
  "key": "site_name",
  "value": "PicArt",
  "description": "站点名称",
  "type": "string",
  "group": "site",
  "public": true
}
```

#### 新格式
```json
{
  "id": 1,
  "key": "site.name",
  "value": "PicArt",
  "label": "站点名称",
  "description": "网站的显示名称，用于标题和 SEO",
  "type": "string",
  "group": "site",
  "public": true,
  "defaultValue": "PicArt",
  "sort": 1,
  "ui": {
    "placeholder": "请输入站点名称",
    "width": "half"
  },
  "validation": {
    "required": true,
    "max": 50,
    "message": "站点名称不能超过50个字符"
  }
}
```

## 迁移步骤

### 1. 后端 API 变更

**获取配置列表**
```typescript
// 旧接口返回
GET /config
{
  data: {
    data: ConfigItem[]
  }
}

// 新接口建议返回
GET /config/v2
{
  data: {
    schemas: ConfigSchema[],  // Schema 定义
    values: Record<string, string>,  // 配置值
    groups: ConfigGroup[],     // 分组信息
  }
}
```

**更新配置**
```typescript
// 保持兼容，仍使用批量更新
POST /config/update-all
{
  configs: [
    { id: number, key: string, value: string }
  ]
}
```

### 2. 前端组件使用

```typescript
import { DashboardConfigsPageV2 } from "@/components/dashboard";

// 在页面中使用
export default function ConfigsPage() {
  return <DashboardConfigsPageV2 />;
}
```

### 3. 自定义 Schema 配置

```typescript
import type { ConfigSchema } from "@/components/dashboard";

const customSchemas: ConfigSchema[] = [
  {
    key: "custom.setting",
    label: "自定义设置",
    type: "select",
    public: true,
    group: "custom",
    ui: {
      options: [
        { value: "option1", label: "选项1" },
        { value: "option2", label: "选项2" },
      ],
    },
  },
];

// 将自定义配置合并到 PRESET_SCHEMAS 中
```

## 验证规则参考

| 规则 | 类型 | 说明 |
|------|------|------|
| required | boolean | 是否必填 |
| requiredMessage | string | 必填错误提示 |
| min | number | 最小值/长度 |
| max | number | 最大值/长度 |
| pattern | string | 正则表达式 |
| patternMessage | string | 正则错误提示 |
| message | string | 通用错误提示 |

### 类型内置验证

- **url**: 自动验证 URL 格式
- **email**: 自动验证邮箱格式
- **json**: 自动验证 JSON 格式
- **color**: 自动验证 HEX 颜色格式

## UI 配置参考

| 属性 | 类型 | 说明 |
|------|------|------|
| placeholder | string | 占位符文本 |
| tooltip | string | 帮助提示 |
| prefix | string | 前缀 |
| suffix | string | 后缀 |
| disabled | boolean | 是否禁用 |
| readOnly | boolean | 是否只读 |
| width | string | full/half/third/quarter |
| rows | number | 文本域行数 |
| min/max/step | number | 数字输入限制 |
| colorFormat | string | hex/rgb/hsl |
| dateFormat | string | 日期格式 |
| options | ConfigOption[] | 下拉选项 |

## 条件显示运算符

| 运算符 | 说明 | 示例 |
|--------|------|------|
| eq | 等于 | `{ key: "x", operator: "eq", value: "true" }` |
| neq | 不等于 | `{ key: "x", operator: "neq", value: "false" }` |
| gt | 大于 | `{ key: "x", operator: "gt", value: 10 }` |
| gte | 大于等于 | `{ key: "x", operator: "gte", value: 10 }` |
| lt | 小于 | `{ key: "x", operator: "lt", value: 100 }` |
| lte | 小于等于 | `{ key: "x", operator: "lte", value: 100 }` |
| contains | 包含 | `{ key: "x", operator: "contains", value: "test" }` |
| in | 在数组中 | `{ key: "x", operator: "in", value: ["a", "b"] }` |
| regex | 正则匹配 | `{ key: "x", operator: "regex", value: "^test" }` |

## 工具函数

```typescript
import {
  getConfigDefaultValue,    // 获取默认值
  validateConfigValue,      // 验证配置值
  checkCondition,           // 检查条件
  parseConfigValue,         // 解析配置值
  stringifyConfigValue,     // 序列化配置值
} from "@/components/dashboard";

// 示例
const value = parseConfigValue<boolean>("true", "boolean");  // true
const str = stringifyConfigValue({ a: 1 }, "json");  // '{"a":1}'
```

## 总结

新系统的优势：

1. **更直观**: 每个配置项都有清晰的 label 和 description
2. **更灵活**: 15+ 种类型满足各种场景
3. **更安全**: 完整的类型验证和约束
4. **更智能**: 支持条件显示和联动
5. **更易维护**: Schema 驱动的设计，修改配置不再需要改代码

建议逐步迁移：
1. 新配置使用新系统
2. 存量配置可保持不变或逐步转换
3. 后端可以先兼容旧格式，逐步迁移
