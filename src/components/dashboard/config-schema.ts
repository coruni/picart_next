/**
 * 后台配置系统设计方案 v2
 *
 * 核心改进：
 * 1. 基于 JSON Schema 的配置定义，支持丰富的数据类型
 * 2. 声明式的 UI 配置，不再依赖关键词推断
 * 3. 支持配置项验证规则
 * 4. 支持配置项之间的依赖和联动
 * 5. 类型安全，与 TypeScript 完美结合
 */

// ==================== 基础类型系统 ====================

/**
 * 配置项数据类型
 */
export type ConfigValueType =
  | "string"      // 字符串
  | "number"      // 数字
  | "boolean"     // 布尔值
  | "text"        // 长文本
  | "json"        // JSON对象
  | "select"      // 单选下拉
  | "multiselect" // 多选
  | "image"       // 图片上传
  | "file"        // 文件上传
  | "color"       // 颜色选择器
  | "date"        // 日期
  | "datetime"    // 日期时间
  | "time"        // 时间
  | "url"         // URL
  | "email"       // 邮箱
  | "password"    // 密码（加密显示）
  | "jsonArray";  // JSON数组

/**
 * 配置项基础定义
 */
export interface ConfigSchema {
  /** 配置键名，全局唯一，建议用点分隔命名空间如: site.name */
  key: string;

  /** 显示名称 */
  label: string;

  /** 详细描述 */
  description?: string;

  /** 数据类型 */
  type: ConfigValueType;

  /** 默认值 */
  defaultValue?: string;

  /** 是否公开访问 */
  public: boolean;

  /** 所属分组 */
  group: string;

  /** 排序权重，数字越小越靠前 */
  sort?: number;

  /** UI 配置 */
  ui?: ConfigUIConfig;

  /** 验证规则 */
  validation?: ConfigValidation;

  /** 条件显示：当满足条件时才显示此配置 */
  when?: ConfigCondition;
}

/**
 * UI 配置
 */
export interface ConfigUIConfig {
  /** 组件变体 */
  variant?: string;

  /** 占位符文本 */
  placeholder?: string;

  /** 帮助提示 */
  tooltip?: string;

  /** 前缀图标或文本 */
  prefix?: string;

  /** 后缀图标或文本 */
  suffix?: string;

  /** 是否禁用 */
  disabled?: boolean;

  /** 是否只读 */
  readOnly?: boolean;

  /** 输入框行数（用于 text 类型） */
  rows?: number;

  /** 最小值（用于 number 类型） */
  min?: number;

  /** 最大值（用于 number 类型） */
  max?: number;

  /** 步进值（用于 number 类型） */
  step?: number;

  /** 选项列表（用于 select/multiselect 类型） */
  options?: ConfigOption[];

  /** 是否允许多选（用于 multiselect 类型） */
  multiple?: boolean;

  /** 颜色格式（用于 color 类型）: hex, rgb, hsl */
  colorFormat?: "hex" | "rgb" | "hsl";

  /** 图片上传配置 */
  upload?: ConfigUploadConfig;

  /** 日期格式 */
  dateFormat?: string;

  /** 宽度：full, half, third, quarter */
  width?: "full" | "half" | "third" | "quarter";

  /** 自定义 CSS 类 */
  className?: string;
}

/**
 * 选项定义
 */
export interface ConfigOption {
  /** 选项值 */
  value: string;
  /** 显示标签 */
  label: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 图标（可选） */
  icon?: string;
}

/**
 * 上传配置
 */
export interface ConfigUploadConfig {
  /** 允许的文件类型 */
  accept?: string;
  /** 最大文件大小（MB） */
  maxSize?: number;
  /** 图片比例限制，如 "16:9" */
  aspectRatio?: string;
  /** 最大宽度（像素） */
  maxWidth?: number;
  /** 最大高度（像素） */
  maxHeight?: number;
  /** 是否允许多文件上传 */
  multiple?: boolean;
  /** 压缩质量 0-1 */
  compressQuality?: number;
}

/**
 * 验证规则
 */
export interface ConfigValidation {
  /** 是否必填 */
  required?: boolean;
  /** 必填提示信息 */
  requiredMessage?: string;
  /** 最小长度/值 */
  min?: number;
  /** 最大长度/值 */
  max?: number;
  /** 正则表达式模式 */
  pattern?: string;
  /** 正则错误提示 */
  patternMessage?: string;
  /** 自定义验证函数（前端用） */
  validator?: string;
  /** 错误提示信息 */
  message?: string;
}

/**
 * 条件配置 - 用于配置项之间的依赖
 */
export interface ConfigCondition {
  /** 依赖的配置项 key */
  key: string;
  /** 运算符 */
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "startsWith" | "endsWith" | "in" | "regex";
  /** 比较值 */
  value: string | string[] | boolean | number;
}

// ==================== 分组配置 ====================

/**
 * 配置分组定义
 */
export interface ConfigGroup {
  /** 分组标识 */
  key: string;
  /** 显示名称 */
  label: string;
  /** 描述 */
  description?: string;
  /** 图标 */
  icon?: string;
  /** 排序权重 */
  sort?: number;
  /** 子分组 */
  children?: ConfigGroup[];
}

// ==================== 运行时类型 ====================

/**
 * 配置项（运行时 - API 返回）
 */
export interface ConfigItem {
  id: number;
  key: string;
  value: string;
  description: string;
  type: string;
  group: string;
  public: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 配置项（完整 - 包含 Schema）
 */
export type ConfigItemWithSchema = ConfigItem & Omit<ConfigSchema, "description">;

/**
 * 配置存储（前端用）
 */
export interface ConfigStore {
  /** 所有配置值 */
  values: Record<string, string>;
  /** 原始配置定义 */
  schemas: ConfigSchema[];
  /** 分组定义 */
  groups: ConfigGroup[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error?: string;
  /** 被修改的配置 key 列表 */
  modified: string[];
}

// ==================== 示例配置 ====================

/**
 * 站点基础配置示例
 */
export const siteConfigExamples: ConfigSchema[] = [
  {
    key: "site.name",
    label: "站点名称",
    description: "网站的显示名称，用于标题和 SEO",
    type: "string",
    defaultValue: "PicArt",
    public: true,
    group: "site",
    sort: 1,
    ui: {
      placeholder: "请输入站点名称",
      width: "half",
    },
    validation: {
      required: true,
      max: 50,
      message: "站点名称不能超过50个字符",
    },
  },
  {
    key: "site.logo",
    label: "站点 Logo",
    description: "网站的 Logo 图片",
    type: "image",
    public: true,
    group: "site",
    sort: 2,
    ui: {
      upload: {
        accept: "image/*",
        maxSize: 2,
        aspectRatio: "1:1",
        compressQuality: 0.8,
      },
    },
  },
  {
    key: "site.favicon",
    label: "站点图标",
    description: "浏览器标签页上显示的图标",
    type: "image",
    public: true,
    group: "site",
    sort: 3,
    ui: {
      upload: {
        accept: ".ico,.png",
        maxSize: 1,
        maxWidth: 32,
        maxHeight: 32,
      },
    },
  },
  {
    key: "site.description",
    label: "站点描述",
    description: "用于 SEO 和 meta 标签",
    type: "text",
    public: true,
    group: "site",
    sort: 4,
    ui: {
      placeholder: "请输入站点描述",
      rows: 3,
      width: "full",
    },
    validation: {
      max: 200,
    },
  },
  {
    key: "site.maintenance.enabled",
    label: "启用维护模式",
    description: "开启后只有管理员可以访问网站",
    type: "boolean",
    defaultValue: "false",
    public: false,
    group: "site",
    sort: 5,
  },
  {
    key: "site.maintenance.message",
    label: "维护提示信息",
    description: "维护模式下显示的消息",
    type: "text",
    defaultValue: "网站正在维护中，请稍后再访问",
    public: true,
    group: "site",
    sort: 6,
    ui: {
      rows: 2,
    },
    when: {
      key: "site.maintenance.enabled",
      operator: "eq",
      value: "true",
    },
  },
];

/**
 * 会员配置示例
 */
export const membershipConfigExamples: ConfigSchema[] = [
  {
    key: "membership.enabled",
    label: "启用会员系统",
    description: "是否开启会员功能",
    type: "boolean",
    defaultValue: "true",
    public: true,
    group: "membership",
    sort: 1,
  },
  {
    key: "membership.levels",
    label: "会员等级配置",
    description: "配置会员等级及对应的价格和权益",
    type: "json",
    defaultValue: JSON.stringify([
      { level: 1, name: "普通会员", price: 0, benefits: ["基础功能"] },
      { level: 2, name: "高级会员", price: 99, benefits: ["全部功能", "去广告"] },
    ]),
    public: true,
    group: "membership",
    sort: 2,
    ui: {
      width: "full",
    },
  },
  {
    key: "membership.currency",
    label: "货币单位",
    description: "会员价格的显示货币",
    type: "select",
    defaultValue: "CNY",
    public: true,
    group: "membership",
    sort: 3,
    ui: {
      options: [
        { value: "CNY", label: "人民币 (CNY)" },
        { value: "USD", label: "美元 (USD)" },
        { value: "EUR", label: "欧元 (EUR)" },
      ],
    },
  },
];

/**
 * 主题配置示例
 */
export const themeConfigExamples: ConfigSchema[] = [
  {
    key: "theme.primaryColor",
    label: "主题色",
    description: "网站的主色调",
    type: "color",
    defaultValue: "#3b82f6",
    public: true,
    group: "theme",
    sort: 1,
    ui: {
      colorFormat: "hex",
    },
  },
  {
    key: "theme.darkMode.enabled",
    label: "启用暗黑模式",
    description: "是否允许用户切换到暗黑主题",
    type: "boolean",
    defaultValue: "true",
    public: true,
    group: "theme",
    sort: 2,
  },
  {
    key: "theme.darkMode.default",
    label: "默认暗黑模式",
    description: "新用户默认使用暗黑主题",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "theme",
    sort: 3,
    when: {
      key: "theme.darkMode.enabled",
      operator: "eq",
      value: "true",
    },
  },
];

/**
 * 内容审核配置示例
 * 按重要级别排序：核心开关(1-10) > 服务商配置(11-20) > 高级设置(21-30) > 云平台密钥(31-50)
 * 相似度分组：同一服务商的配置放在一起
 */
export const auditConfigExamples: ConfigSchema[] = [
  // ==================== 核心开关（最重要） ====================
  {
    key: "content_audit_provider",
    label: "审核服务商",
    description: "选择内容审核服务提供商",
    type: "select",
    defaultValue: "none",
    public: true,
    group: "audit",
    sort: 1,
    ui: {
      options: [
        { value: "none", label: "不启用" },
        { value: "tencent", label: "腾讯云" },
        { value: "aliyun", label: "阿里云" },
      ],
    },
    validation: {
      required: true,
    },
  },
  {
    key: "content_audit_review_mode",
    label: "审核模式",
    description: "选择内容审核的工作模式",
    type: "select",
    defaultValue: "manual",
    public: true,
    group: "audit",
    sort: 2,
    ui: {
      options: [
        { value: "manual", label: "人工审核" },
        { value: "auto", label: "自动审核" },
        { value: "semi", label: "半自动（机审+人审）" },
      ],
    },
    when: {
      key: "content_audit_provider",
      operator: "neq",
      value: "none",
    },
  },
  {
    key: "content_audit_sensitivity",
    label: "审核敏感度",
    description: "审核的严格程度，敏感度越高拦截越严格",
    type: "select",
    defaultValue: "medium",
    public: true,
    group: "audit",
    sort: 3,
    ui: {
      options: [
        { value: "low", label: "低（宽松）" },
        { value: "medium", label: "中（推荐）" },
        { value: "high", label: "高（严格）" },
      ],
    },
    when: {
      key: "content_audit_provider",
      operator: "neq",
      value: "none",
    },
  },
  {
    key: "content_audit_auto_block",
    label: "自动拦截违规内容",
    description: "审核不通过时是否自动拦截或删除内容",
    type: "boolean",
    defaultValue: "true",
    public: true,
    group: "audit",
    sort: 4,
    when: {
      key: "content_audit_provider",
      operator: "neq",
      value: "none",
    },
  },

  // ==================== 各内容类型审核开关 ====================
  {
    key: "content_audit_article_enabled",
    label: "启用文章审核",
    description: "是否对发布的文章进行内容审核",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "audit",
    sort: 10,
    when: {
      key: "content_audit_provider",
      operator: "neq",
      value: "none",
    },
  },
  {
    key: "content_audit_comment_enabled",
    label: "启用评论审核",
    description: "是否对用户评论进行内容审核",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "audit",
    sort: 11,
    when: {
      key: "content_audit_provider",
      operator: "neq",
      value: "none",
    },
  },
  {
    key: "content_audit_image_enabled",
    label: "启用图片审核",
    description: "是否对用户上传的图片进行内容审核",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "audit",
    sort: 12,
    when: {
      key: "content_audit_provider",
      operator: "neq",
      value: "none",
    },
  },
  {
    key: "content_audit_avatar_enabled",
    label: "启用头像审核",
    description: "是否对用户头像进行内容审核",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "audit",
    sort: 13,
    when: {
      key: "content_audit_provider",
      operator: "neq",
      value: "none",
    },
  },

  // ==================== 腾讯云配置（相似度分组） ====================
  {
    key: "tencent_region",
    label: "腾讯云地域",
    description: "腾讯云内容审核服务所在地域",
    type: "select",
    defaultValue: "ap-beijing",
    public: true,
    group: "audit",
    sort: 31,
    ui: {
      options: [
        { value: "ap-beijing", label: "北京" },
        { value: "ap-shanghai", label: "上海" },
        { value: "ap-guangzhou", label: "广州" },
        { value: "ap-chengdu", label: "成都" },
        { value: "ap-hongkong", label: "香港" },
      ],
    },
    when: {
      key: "content_audit_provider",
      operator: "eq",
      value: "tencent",
    },
  },
  {
    key: "tencent_secret_id",
    label: "腾讯云 SecretId",
    description: "腾讯云 API 密钥 ID",
    type: "password",
    defaultValue: "",
    public: false,
    group: "audit",
    sort: 32,
    validation: {
      required: true,
    },
    when: {
      key: "content_audit_provider",
      operator: "eq",
      value: "tencent",
    },
  },
  {
    key: "tencent_secret_key",
    label: "腾讯云 SecretKey",
    description: "腾讯云 API 密钥",
    type: "password",
    defaultValue: "",
    public: false,
    group: "audit",
    sort: 33,
    validation: {
      required: true,
    },
    when: {
      key: "content_audit_provider",
      operator: "eq",
      value: "tencent",
    },
  },
  {
    key: "tencent_text_biz_type",
    label: "腾讯云文本审核 BizType",
    description: "文本内容审核的业务类型标识",
    type: "string",
    defaultValue: "",
    public: false,
    group: "audit",
    sort: 34,
    ui: {
      placeholder: "请输入 BizType",
    },
    when: {
      key: "content_audit_provider",
      operator: "eq",
      value: "tencent",
    },
  },
  {
    key: "tencent_image_biz_type",
    label: "腾讯云图片审核 BizType",
    description: "图片内容审核的业务类型标识",
    type: "string",
    defaultValue: "",
    public: false,
    group: "audit",
    sort: 35,
    ui: {
      placeholder: "请输入 BizType",
    },
    when: {
      key: "content_audit_provider",
      operator: "eq",
      value: "tencent",
    },
  },

  // ==================== 阿里云配置（相似度分组） ====================
  {
    key: "aliyun_region",
    label: "阿里云地域",
    description: "阿里云内容审核服务所在地域",
    type: "select",
    defaultValue: "cn-beijing",
    public: true,
    group: "audit",
    sort: 41,
    ui: {
      options: [
        { value: "cn-beijing", label: "北京" },
        { value: "cn-shanghai", label: "上海" },
        { value: "cn-hangzhou", label: "杭州" },
        { value: "cn-shenzhen", label: "深圳" },
        { value: "cn-hongkong", label: "香港" },
      ],
    },
    when: {
      key: "content_audit_provider",
      operator: "eq",
      value: "aliyun",
    },
  },
  {
    key: "aliyun_access_key_id",
    label: "阿里云 AccessKeyId",
    description: "阿里云访问密钥 ID",
    type: "password",
    defaultValue: "",
    public: false,
    group: "audit",
    sort: 42,
    validation: {
      required: true,
    },
    when: {
      key: "content_audit_provider",
      operator: "eq",
      value: "aliyun",
    },
  },
  {
    key: "aliyun_access_key_secret",
    label: "阿里云 AccessKeySecret",
    description: "阿里云访问密钥",
    type: "password",
    defaultValue: "",
    public: false,
    group: "audit",
    sort: 43,
    validation: {
      required: true,
    },
    when: {
      key: "content_audit_provider",
      operator: "eq",
      value: "aliyun",
    },
  },

  // ==================== 收藏夹配置（补充） ====================
  {
    key: "favorite_max_free_count",
    label: "免费收藏夹数量",
    description: "用户可以免费创建的收藏夹最大数量",
    type: "number",
    defaultValue: "6",
    public: true,
    group: "favorite",
    sort: 1,
    ui: {
      min: 1,
      max: 20,
      suffix: "个",
    },
    validation: {
      min: 1,
      max: 20,
    },
  },
  {
    key: "favorite_create_cost",
    label: "收藏夹创建成本",
    description: "超出免费数量后，创建收藏夹所需的积分",
    type: "number",
    defaultValue: "10",
    public: true,
    group: "favorite",
    sort: 2,
    ui: {
      min: 0,
      max: 1000,
      suffix: "积分",
    },
    validation: {
      min: 0,
    },
  },
];

// ==================== 工具函数 ====================

/**
 * 推断配置项的类型
 * 后端只返回 boolean/string，需要根据 key 特征推断实际类型
 */
export function inferConfigType(key: string): ConfigValueType {
  const lowerKey = key.toLowerCase();

  // 1. 布尔值开关（以 _enabled 结尾 或包含 enabled/disabled）
  if (
    lowerKey.endsWith("_enabled") ||
    lowerKey.endsWith("_disabled") ||
    lowerKey.includes("_enable") ||
    lowerKey.includes("_disable") ||
    lowerKey.includes("force_") ||
    lowerKey.startsWith("enable_") ||
    lowerKey.startsWith("disable_")
  ) {
    return "boolean";
  }

  // 2. 图片上传（明确包含图片相关关键词，但排除 scene/type/scenes 等场景配置）
  if (
    (lowerKey.endsWith("_logo") ||
      lowerKey.endsWith("_icon") ||
      lowerKey.endsWith("_cover") ||
      lowerKey.endsWith("_avatar") ||
      lowerKey.endsWith("_background") ||
      lowerKey.endsWith("_banner") ||
      lowerKey.endsWith("_image") ||
      lowerKey.endsWith("_qrcode") ||
      lowerKey.endsWith("_qr")) &&
    !lowerKey.includes("_scene") &&
    !lowerKey.includes("_scenes") &&
    !lowerKey.includes("_type") &&
    !lowerKey.includes("biztype")
  ) {
    return "image";
  }

  // 3. URL 类型
  if (
    lowerKey.endsWith("_url") ||
    lowerKey.endsWith("_link") ||
    lowerKey.includes("callback") ||
    lowerKey.includes("redirect") ||
    lowerKey.includes("webhook") ||
    lowerKey.includes("_api_") ||
    lowerKey.endsWith("_endpoint") ||
    lowerKey.endsWith("_gateway")
  ) {
    return "url";
  }

  // 4. 邮箱类型
  if (
    lowerKey.endsWith("_email") ||
    lowerKey.endsWith("_mail") ||
    lowerKey.includes("email_") ||
    lowerKey.includes("contact_")
  ) {
    return "email";
  }

  // 5. 密码/密钥类型（敏感信息）
  if (
    lowerKey.endsWith("_key") ||
    lowerKey.endsWith("_secret") ||
    lowerKey.endsWith("_password") ||
    lowerKey.endsWith("_token") ||
    lowerKey.includes("secret_") ||
    lowerKey.includes("private_") ||
    lowerKey.includes("apikey") ||
    lowerKey.includes("api_secret") ||
    lowerKey.includes("access_key_secret") ||
    lowerKey.endsWith("_private_key")
  ) {
    return "password";
  }

  // 6. 数字类型
  if (
    lowerKey.endsWith("_count") ||
    lowerKey.endsWith("_limit") ||
    lowerKey.endsWith("_min") ||
    lowerKey.endsWith("_max") ||
    lowerKey.endsWith("_size") ||
    lowerKey.endsWith("_days") ||
    lowerKey.endsWith("_hours") ||
    lowerKey.endsWith("_minutes") ||
    lowerKey.endsWith("_seconds") ||
    lowerKey.endsWith("_timeout") ||
    lowerKey.endsWith("_price") ||
    lowerKey.endsWith("_rate") ||
    lowerKey.endsWith("_version") ||
    lowerKey.endsWith("_level") ||
    lowerKey.endsWith("_sort") ||
    lowerKey.endsWith("_sort_order") ||
    lowerKey.endsWith("_expire") ||
    lowerKey.endsWith("_duration") ||
    lowerKey.includes("_cost_") ||
    lowerKey.includes("_max_") ||
    lowerKey.includes("_min_") ||
    lowerKey.includes("_per_") ||
    lowerKey.endsWith("_id") && !lowerKey.includes("_secret_id")
  ) {
    return "number";
  }

  // 7. 颜色类型
  if (
    lowerKey.endsWith("_color") ||
    lowerKey.endsWith("_colour") ||
    lowerKey.includes("color_") ||
    lowerKey.includes("theme_")
  ) {
    return "color";
  }

  // 8. JSON 配置
  if (
    lowerKey.endsWith("_json") ||
    lowerKey.endsWith("_config") ||
    lowerKey.endsWith("_settings") ||
    lowerKey.endsWith("_levels") ||
    lowerKey.includes("levels_") ||
    // 注意：_scenes（复数）属于 multiselect，不是 json
    // _scene（单数）如果没有 _image 则是 json
    (lowerKey.endsWith("_scene") && !lowerKey.includes("_image")) ||
    lowerKey.endsWith("_rules") ||
    lowerKey.endsWith("_data")
  ) {
    return "json";
  }

  // 9. 长文本/富文本
  if (
    lowerKey.endsWith("_description") ||
    lowerKey.endsWith("_content") ||
    lowerKey.endsWith("_message") ||
    lowerKey.endsWith("_notice") ||
    lowerKey.endsWith("_announcement") ||
    lowerKey.endsWith("_html") ||
    lowerKey.endsWith("_css") ||
    lowerKey.endsWith("_style") ||
    lowerKey.endsWith("_script") ||
    lowerKey.endsWith("_template") ||
    lowerKey.endsWith("_contact") ||
    lowerKey.includes("keywords") ||
    lowerKey.includes("_long_text") ||
    lowerKey.includes("_rich_text")
  ) {
    return "text";
  }

  // 10. 下拉选择（以 _mode 或 _type 结尾的配置）
  if (
    lowerKey.endsWith("_mode") ||
    lowerKey.endsWith("_provider") ||
    (lowerKey.endsWith("_type") && !lowerKey.includes("_biz")) ||
    lowerKey.endsWith("_method") ||
    lowerKey.endsWith("_strategy") ||
    lowerKey.endsWith("_sensitivity") ||
    lowerKey.includes("_layout") ||
    lowerKey.includes("_format")
  ) {
    return "select";
  }

  // 11. 多选（包含 scenes, tags, categories, features 等复数名词）
  if (
    lowerKey.endsWith("_scenes") ||
    lowerKey.endsWith("_features") ||
    lowerKey.endsWith("_tags") ||
    lowerKey.endsWith("_categories") ||
    lowerKey.endsWith("_scopes") ||
    lowerKey.endsWith("_permissions") ||
    lowerKey.endsWith("_roles") ||
    lowerKey.includes("_biz_types")
  ) {
    return "multiselect";
  }

  // 12. 日期时间
  if (
    lowerKey.endsWith("_date") ||
    lowerKey.endsWith("_time") ||
    lowerKey.includes("expire_") ||
    lowerKey.includes("expiry_") ||
    lowerKey.includes("created_") ||
    lowerKey.includes("updated_")
  ) {
    return "date";
  }

  // 默认字符串
  return "string";
}

/**
 * 根据 key 推断配置的 UI 选项（用于 select/multiselect）
 */
export function inferConfigOptions(key: string): ConfigOption[] | undefined {
  const lowerKey = key.toLowerCase();

  // 审核服务商
  if (lowerKey.includes("_provider") && lowerKey.includes("audit")) {
    return [
      { value: "none", label: "不启用" },
      { value: "tencent", label: "腾讯云" },
      { value: "aliyun", label: "阿里云" },
    ];
  }

  // 审核模式
  if (lowerKey.includes("_review_mode") || lowerKey.includes("_audit_mode")) {
    return [
      { value: "manual", label: "人工审核" },
      { value: "auto", label: "自动审核" },
      { value: "semi", label: "半自动" },
    ];
  }

  // 敏感度
  if (lowerKey.includes("_sensitivity")) {
    return [
      { value: "low", label: "低（宽松）" },
      { value: "medium", label: "中（推荐）" },
      { value: "high", label: "高（严格）" },
    ];
  }

  // 云服务商地域
  if (lowerKey.includes("_region")) {
    if (lowerKey.includes("tencent")) {
      return [
        { value: "ap-beijing", label: "北京" },
        { value: "ap-shanghai", label: "上海" },
        { value: "ap-guangzhou", label: "广州" },
        { value: "ap-chengdu", label: "成都" },
        { value: "ap-hongkong", label: "香港" },
      ];
    }
    if (lowerKey.includes("aliyun")) {
      return [
        { value: "cn-beijing", label: "北京" },
        { value: "cn-shanghai", label: "上海" },
        { value: "cn-hangzhou", label: "杭州" },
        { value: "cn-shenzhen", label: "深圳" },
        { value: "cn-hongkong", label: "香港" },
      ];
    }
  }

  // 布局类型
  if (lowerKey.includes("_layout")) {
    return [
      { value: "grid", label: "网格布局" },
      { value: "list", label: "列表布局" },
      { value: "masonry", label: "瀑布流布局" },
      { value: "carousel", label: "轮播布局" },
    ];
  }

  // 广告位置
  if (lowerKey.includes("ad_") && lowerKey.includes("_position")) {
    return [
      { value: "top", label: "顶部" },
      { value: "bottom", label: "底部" },
      { value: "sidebar", label: "侧边栏" },
      { value: "floating", label: "浮动" },
    ];
  }

  return undefined;
}

/**
 * 根据 key 推断默认分组
 */
export function inferConfigGroup(key: string): string {
  const lowerKey = key.toLowerCase();

  if (lowerKey.startsWith("site_")) return "site";
  if (lowerKey.startsWith("user_")) return "user";
  if (lowerKey.startsWith("article_")) return "content";
  if (lowerKey.startsWith("comment_")) return "content";
  if (lowerKey.startsWith("content_audit")) return "audit";
  if (lowerKey.startsWith("tencent_")) return "audit";
  if (lowerKey.startsWith("aliyun_")) return "audit";
  if (lowerKey.startsWith("payment_")) return "payment";
  if (lowerKey.startsWith("membership_")) return "membership";
  if (lowerKey.startsWith("ad_")) return "advertisement";
  if (lowerKey.startsWith("seo_")) return "seo";
  if (lowerKey.startsWith("app_")) return "app";
  if (lowerKey.startsWith("theme_")) return "theme";
  if (lowerKey.startsWith("invite_")) return "invite";
  if (lowerKey.startsWith("commission_")) return "commission";
  if (lowerKey.startsWith("favorite_")) return "favorite";
  if (lowerKey.startsWith("maintenance")) return "system";

  return "other";
}

/**
 * 将后端返回的配置项转换为 Schema
 */
export function convertConfigToSchema(item: ConfigItem): ConfigSchema {
  // 推断类型
  const inferredType = inferConfigType(item.key);

  // 推断选项
  const options = inferConfigOptions(item.key);

  // 推断分组
  const group = inferConfigGroup(item.key);

  // 构建基础 Schema
  const schema: ConfigSchema = {
    key: item.key,
    label: item.key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    description: item.description || `${item.key} 配置项`,
    type: inferredType,
    defaultValue: item.value,
    public: item.public,
    group: item.group || group,
  };

  // 如果有推断出的选项，添加到 UI 配置
  if (options && (inferredType === "select" || inferredType === "multiselect")) {
    schema.ui = {
      options,
    };
  }

  // 密码类型需要特殊处理
  if (inferredType === "password") {
    schema.description = schema.description + "（敏感信息，请妥善保管）";
  }

  return schema;
}

/**
 * 完整的配置映射表
 * key -> Schema 映射，不用推断，直接查找
 */
export const CONFIG_SCHEMA_MAP: Record<string, ConfigSchema> = {
  // ==================== 广告配置 ====================
  "ad_homepage_enabled": {
    key: "ad_homepage_enabled",
    label: "启用首页广告",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "advertisement",
    sort: 1,
  },
  "ad_homepage_content": {
    key: "ad_homepage_content",
    label: "首页广告内容",
    description: "支持 HTML",
    type: "text",
    defaultValue: "",
    public: true,
    group: "advertisement",
    sort: 2,
    when: { key: "ad_homepage_enabled", operator: "eq", value: "true" },
  },
  "ad_homepage_position": {
    key: "ad_homepage_position",
    label: "首页广告位置",
    type: "select",
    defaultValue: "top",
    public: true,
    group: "advertisement",
    sort: 3,
    ui: {
      options: [
        { value: "top", label: "顶部" },
        { value: "bottom", label: "底部" },
        { value: "sidebar", label: "侧边栏" },
      ],
    },
    when: { key: "ad_homepage_enabled", operator: "eq", value: "true" },
  },
  "ad_article_top_enabled": {
    key: "ad_article_top_enabled",
    label: "启用文章顶部广告",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "advertisement",
    sort: 4,
  },
  "ad_article_top_content": {
    key: "ad_article_top_content",
    label: "文章顶部广告内容",
    description: "支持 HTML",
    type: "text",
    defaultValue: "",
    public: true,
    group: "advertisement",
    sort: 5,
    when: { key: "ad_article_top_enabled", operator: "eq", value: "true" },
  },
  "ad_article_bottom_enabled": {
    key: "ad_article_bottom_enabled",
    label: "启用文章底部广告",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "advertisement",
    sort: 6,
  },
  "ad_article_bottom_content": {
    key: "ad_article_bottom_content",
    label: "文章底部广告内容",
    description: "支持 HTML",
    type: "text",
    defaultValue: "",
    public: true,
    group: "advertisement",
    sort: 7,
    when: { key: "ad_article_bottom_enabled", operator: "eq", value: "true" },
  },
  "ad_global_enabled": {
    key: "ad_global_enabled",
    label: "启用全局广告",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "advertisement",
    sort: 8,
  },
  "ad_global_content": {
    key: "ad_global_content",
    label: "全局广告内容",
    description: "支持 HTML",
    type: "text",
    defaultValue: "",
    public: true,
    group: "advertisement",
    sort: 9,
    when: { key: "ad_global_enabled", operator: "eq", value: "true" },
  },
  "ad_global_position": {
    key: "ad_global_position",
    label: "全局广告位置",
    type: "select",
    defaultValue: "fixed-bottom",
    public: true,
    group: "advertisement",
    sort: 10,
    ui: {
      options: [
        { value: "fixed-top", label: "固定顶部" },
        { value: "fixed-bottom", label: "固定底部" },
        { value: "floating", label: "浮动" },
      ],
    },
    when: { key: "ad_global_enabled", operator: "eq", value: "true" },
  },
  "ad_global_style": {
    key: "ad_global_style",
    label: "全局广告样式",
    description: "CSS 样式",
    type: "text",
    defaultValue: "background: #f8f9fa; padding: 10px; text-align: center;",
    public: true,
    group: "advertisement",
    sort: 11,
    when: { key: "ad_global_enabled", operator: "eq", value: "true" },
  },

  // ==================== APP 配置 ====================
  "app_name": {
    key: "app_name",
    label: "APP 名称",
    type: "string",
    defaultValue: "PicArt",
    public: true,
    group: "app",
    sort: 1,
  },
  "app_version": {
    key: "app_version",
    label: "APP 版本号",
    type: "string",
    defaultValue: "1.0.0",
    public: true,
    group: "app",
    sort: 2,
  },
  "app_ios_version": {
    key: "app_ios_version",
    label: "iOS APP 最新版本",
    type: "string",
    defaultValue: "1.0.0",
    public: true,
    group: "app",
    sort: 3,
  },
  "app_android_version": {
    key: "app_android_version",
    label: "Android APP 最新版本",
    type: "string",
    defaultValue: "1.0.0",
    public: true,
    group: "app",
    sort: 4,
  },
  "app_ios_download_url": {
    key: "app_ios_download_url",
    label: "iOS APP 下载地址",
    type: "url",
    defaultValue: "",
    public: true,
    group: "app",
    sort: 5,
  },
  "app_android_download_url": {
    key: "app_android_download_url",
    label: "Android APP 下载地址",
    type: "url",
    defaultValue: "",
    public: true,
    group: "app",
    sort: 6,
  },
  "app_force_update": {
    key: "app_force_update",
    label: "启用强制更新",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "app",
    sort: 7,
  },
  "app_ios_force_update_version": {
    key: "app_ios_force_update_version",
    label: "iOS 强制更新版本号",
    type: "string",
    defaultValue: "",
    public: true,
    group: "app",
    sort: 8,
    when: { key: "app_force_update", operator: "eq", value: "true" },
  },
  "app_android_force_update_version": {
    key: "app_android_force_update_version",
    label: "Android 强制更新版本号",
    type: "string",
    defaultValue: "",
    public: true,
    group: "app",
    sort: 9,
    when: { key: "app_force_update", operator: "eq", value: "true" },
  },
  "app_update_message": {
    key: "app_update_message",
    label: "更新提示消息",
    type: "string",
    defaultValue: "发现新版本，请更新",
    public: true,
    group: "app",
    sort: 10,
  },
  "app_maintenance": {
    key: "app_maintenance",
    label: "APP 维护模式",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "app",
    sort: 11,
  },
  "app_maintenance_message": {
    key: "app_maintenance_message",
    label: "APP 维护提示消息",
    type: "string",
    defaultValue: "APP 维护中，请稍后再试",
    public: true,
    group: "app",
    sort: 12,
    when: { key: "app_maintenance", operator: "eq", value: "true" },
  },

  // ==================== 审核配置 ====================
  "content_audit_provider": {
    key: "content_audit_provider",
    label: "审核服务商",
    type: "select",
    defaultValue: "none",
    public: true,
    group: "audit",
    sort: 1,
    ui: {
      options: [
        { value: "none", label: "不启用" },
        { value: "tencent", label: "腾讯云" },
        { value: "aliyun", label: "阿里云" },
      ],
    },
  },
  "content_audit_review_mode": {
    key: "content_audit_review_mode",
    label: "审核模式",
    type: "select",
    defaultValue: "manual",
    public: true,
    group: "audit",
    sort: 2,
    ui: {
      options: [
        { value: "manual", label: "人工审核" },
        { value: "auto", label: "自动审核" },
        { value: "semi", label: "半自动" },
      ],
    },
    when: { key: "content_audit_provider", operator: "neq", value: "none" },
  },
  "content_audit_sensitivity": {
    key: "content_audit_sensitivity",
    label: "审核敏感度",
    type: "select",
    defaultValue: "medium",
    public: true,
    group: "audit",
    sort: 3,
    ui: {
      options: [
        { value: "low", label: "低（宽松）" },
        { value: "medium", label: "中（推荐）" },
        { value: "high", label: "高（严格）" },
      ],
    },
    when: { key: "content_audit_provider", operator: "neq", value: "none" },
  },
  "content_audit_auto_block": {
    key: "content_audit_auto_block",
    label: "自动拦截违规内容",
    type: "boolean",
    defaultValue: "true",
    public: true,
    group: "audit",
    sort: 4,
    when: { key: "content_audit_provider", operator: "neq", value: "none" },
  },
  "content_audit_article_enabled": {
    key: "content_audit_article_enabled",
    label: "启用文章审核",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "audit",
    sort: 10,
    when: { key: "content_audit_provider", operator: "neq", value: "none" },
  },
  "content_audit_comment_enabled": {
    key: "content_audit_comment_enabled",
    label: "启用评论审核",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "audit",
    sort: 11,
    when: { key: "content_audit_provider", operator: "neq", value: "none" },
  },
  "content_audit_image_enabled": {
    key: "content_audit_image_enabled",
    label: "启用图片审核",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "audit",
    sort: 12,
    when: { key: "content_audit_provider", operator: "neq", value: "none" },
  },
  "content_audit_avatar_enabled": {
    key: "content_audit_avatar_enabled",
    label: "启用头像审核",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "audit",
    sort: 13,
    when: { key: "content_audit_provider", operator: "neq", value: "none" },
  },

  // 腾讯云配置
  "tencent_region": {
    key: "tencent_region",
    label: "腾讯云地域",
    type: "select",
    defaultValue: "ap-beijing",
    public: false,
    group: "audit",
    sort: 31,
    ui: {
      options: [
        { value: "ap-beijing", label: "北京" },
        { value: "ap-shanghai", label: "上海" },
        { value: "ap-guangzhou", label: "广州" },
        { value: "ap-chengdu", label: "成都" },
        { value: "ap-hongkong", label: "香港" },
      ],
    },
    when: { key: "content_audit_provider", operator: "eq", value: "tencent" },
  },
  "tencent_secret_id": {
    key: "tencent_secret_id",
    label: "腾讯云 SecretId",
    type: "password",
    defaultValue: "",
    public: false,
    group: "audit",
    sort: 32,
    when: { key: "content_audit_provider", operator: "eq", value: "tencent" },
  },
  "tencent_secret_key": {
    key: "tencent_secret_key",
    label: "腾讯云 SecretKey",
    type: "password",
    defaultValue: "",
    public: false,
    group: "audit",
    sort: 33,
    when: { key: "content_audit_provider", operator: "eq", value: "tencent" },
  },
  "tencent_text_biz_type": {
    key: "tencent_text_biz_type",
    label: "腾讯云文本审核 BizType",
    type: "string",
    defaultValue: "",
    public: false,
    group: "audit",
    sort: 34,
    when: { key: "content_audit_provider", operator: "eq", value: "tencent" },
  },
  "tencent_image_biz_type": {
    key: "tencent_image_biz_type",
    label: "腾讯云图片审核 BizType",
    type: "string",
    defaultValue: "",
    public: false,
    group: "audit",
    sort: 35,
    when: { key: "content_audit_provider", operator: "eq", value: "tencent" },
  },

  // 阿里云配置
  "aliyun_region": {
    key: "aliyun_region",
    label: "阿里云地域",
    type: "select",
    defaultValue: "cn-beijing",
    public: false,
    group: "audit",
    sort: 41,
    ui: {
      options: [
        { value: "cn-beijing", label: "北京" },
        { value: "cn-shanghai", label: "上海" },
        { value: "cn-hangzhou", label: "杭州" },
        { value: "cn-shenzhen", label: "深圳" },
        { value: "cn-hongkong", label: "香港" },
      ],
    },
    when: { key: "content_audit_provider", operator: "eq", value: "aliyun" },
  },
  "aliyun_access_key_id": {
    key: "aliyun_access_key_id",
    label: "阿里云 AccessKeyId",
    type: "password",
    defaultValue: "",
    public: false,
    group: "audit",
    sort: 42,
    when: { key: "content_audit_provider", operator: "eq", value: "aliyun" },
  },
  "aliyun_access_key_secret": {
    key: "aliyun_access_key_secret",
    label: "阿里云 AccessKeySecret",
    type: "password",
    defaultValue: "",
    public: false,
    group: "audit",
    sort: 43,
    when: { key: "content_audit_provider", operator: "eq", value: "aliyun" },
  },

  // ==================== 内容配置 ====================
  "article_approval_required": {
    key: "article_approval_required",
    label: "文章需要审核",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "content",
    sort: 1,
  },
  "article_free_images_count": {
    key: "article_free_images_count",
    label: "免费图片数量",
    description: "需要权限的文章默认展示的免费图片数量",
    type: "number",
    defaultValue: "3",
    public: true,
    group: "content",
    sort: 2,
    ui: { min: 0, max: 10 },
  },
  "article_hot_min_views": {
    key: "article_hot_min_views",
    label: "热门文章最低浏览量",
    type: "number",
    defaultValue: "20000",
    public: false,
    group: "content",
    sort: 3,
  },
  "article_hot_min_comments": {
    key: "article_hot_min_comments",
    label: "热门文章最低评论数",
    type: "number",
    defaultValue: "50",
    public: false,
    group: "content",
    sort: 4,
  },
  "article_hot_min_likes": {
    key: "article_hot_min_likes",
    label: "热门文章最低点赞数",
    type: "number",
    defaultValue: "300",
    public: false,
    group: "content",
    sort: 5,
  },
  "article_hot_min_favorites": {
    key: "article_hot_min_favorites",
    label: "热门文章最低收藏数",
    type: "number",
    defaultValue: "120",
    public: false,
    group: "content",
    sort: 6,
  },
  "comment_approval_required": {
    key: "comment_approval_required",
    label: "评论需要审核",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "content",
    sort: 7,
  },

  // ==================== 收藏夹配置 ====================
  "favorite_max_free_count": {
    key: "favorite_max_free_count",
    label: "免费收藏夹数量",
    type: "number",
    defaultValue: "6",
    public: true,
    group: "favorite",
    sort: 1,
    ui: { min: 1, max: 20, suffix: "个" },
  },
  "favorite_create_cost": {
    key: "favorite_create_cost",
    label: "收藏夹创建成本",
    description: "超出免费数量后创建收藏夹所需积分",
    type: "number",
    defaultValue: "10",
    public: true,
    group: "favorite",
    sort: 2,
    ui: { min: 0, suffix: "积分" },
  },

  // ==================== 邀请配置 ====================
  "invite_code_required": {
    key: "invite_code_required",
    label: "注册需要邀请码",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "invite",
    sort: 1,
  },
  "invite_code_enabled": {
    key: "invite_code_enabled",
    label: "启用邀请码功能",
    type: "boolean",
    defaultValue: "true",
    public: true,
    group: "invite",
    sort: 2,
  },
  "invite_code_expire_days": {
    key: "invite_code_expire_days",
    label: "邀请码过期天数",
    description: "0 表示永不过期",
    type: "number",
    defaultValue: "30",
    public: false,
    group: "invite",
    sort: 3,
    ui: { min: 0, suffix: "天" },
  },
  "invite_default_commission_rate": {
    key: "invite_default_commission_rate",
    label: "默认邀请分成比例",
    type: "number",
    defaultValue: "0.05",
    public: false,
    group: "invite",
    sort: 4,
    ui: { min: 0, max: 1, step: 0.01 },
  },

  // ==================== 会员配置 ====================
  "membership_enabled": {
    key: "membership_enabled",
    label: "启用会员功能",
    type: "boolean",
    defaultValue: "true",
    public: true,
    group: "membership",
    sort: 1,
  },
  "membership_name": {
    key: "membership_name",
    label: "会员名称",
    type: "string",
    defaultValue: "VIP会员",
    public: true,
    group: "membership",
    sort: 2,
  },
  "membership_price": {
    key: "membership_price",
    label: "会员月价格",
    type: "number",
    defaultValue: "19.9",
    public: true,
    group: "membership",
    sort: 3,
    ui: { min: 0, suffix: "元" },
  },
  "membership_price_1m": {
    key: "membership_price_1m",
    label: "1个月会员价格",
    type: "number",
    defaultValue: "19.9",
    public: true,
    group: "membership",
    sort: 4,
    ui: { min: 0, suffix: "元" },
  },
  "membership_price_3m": {
    key: "membership_price_3m",
    label: "3个月会员价格",
    type: "number",
    defaultValue: "59.7",
    public: true,
    group: "membership",
    sort: 5,
    ui: { min: 0, suffix: "元" },
  },
  "membership_price_6m": {
    key: "membership_price_6m",
    label: "6个月会员价格",
    type: "number",
    defaultValue: "119.4",
    public: true,
    group: "membership",
    sort: 6,
    ui: { min: 0, suffix: "元" },
  },
  "membership_price_12m": {
    key: "membership_price_12m",
    label: "12个月会员价格",
    type: "number",
    defaultValue: "238.8",
    public: true,
    group: "membership",
    sort: 7,
    ui: { min: 0, suffix: "元" },
  },
  "membership_price_lifetime": {
    key: "membership_price_lifetime",
    label: "永久会员价格",
    type: "number",
    defaultValue: "999",
    public: true,
    group: "membership",
    sort: 8,
    ui: { min: 0, suffix: "元" },
  },

  // ==================== 支付配置 ====================
  "payment_alipay_enabled": {
    key: "payment_alipay_enabled",
    label: "启用支付宝支付",
    type: "boolean",
    defaultValue: "true",
    public: true,
    group: "payment",
    sort: 1,
  },
  "payment_alipay_app_id": {
    key: "payment_alipay_app_id",
    label: "支付宝应用 ID",
    type: "string",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 2,
    when: { key: "payment_alipay_enabled", operator: "eq", value: "true" },
  },
  "payment_alipay_private_key": {
    key: "payment_alipay_private_key",
    label: "支付宝私钥",
    type: "password",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 3,
    when: { key: "payment_alipay_enabled", operator: "eq", value: "true" },
  },
  "payment_alipay_public_key": {
    key: "payment_alipay_public_key",
    label: "支付宝公钥",
    type: "password",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 4,
    when: { key: "payment_alipay_enabled", operator: "eq", value: "true" },
  },
  "payment_alipay_gateway": {
    key: "payment_alipay_gateway",
    label: "支付宝网关地址",
    type: "url",
    defaultValue: "https://openapi.alipay.com/gateway.do",
    public: false,
    group: "payment",
    sort: 5,
    when: { key: "payment_alipay_enabled", operator: "eq", value: "true" },
  },
  "payment_wechat_enabled": {
    key: "payment_wechat_enabled",
    label: "启用微信支付",
    type: "boolean",
    defaultValue: "true",
    public: true,
    group: "payment",
    sort: 10,
  },
  "payment_wechat_app_id": {
    key: "payment_wechat_app_id",
    label: "微信支付应用 ID",
    type: "string",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 11,
    when: { key: "payment_wechat_enabled", operator: "eq", value: "true" },
  },
  "payment_wechat_mch_id": {
    key: "payment_wechat_mch_id",
    label: "微信支付商户号",
    type: "string",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 12,
    when: { key: "payment_wechat_enabled", operator: "eq", value: "true" },
  },
  "payment_wechat_api_key": {
    key: "payment_wechat_api_key",
    label: "微信支付 API 密钥",
    type: "password",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 13,
    when: { key: "payment_wechat_enabled", operator: "eq", value: "true" },
  },
  "payment_wechat_private_key": {
    key: "payment_wechat_private_key",
    label: "微信支付私钥",
    type: "password",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 14,
    when: { key: "payment_wechat_enabled", operator: "eq", value: "true" },
  },
  "payment_wechat_serial_no": {
    key: "payment_wechat_serial_no",
    label: "微信支付证书序列号",
    type: "string",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 15,
    when: { key: "payment_wechat_enabled", operator: "eq", value: "true" },
  },
  "payment_wechat_public_key": {
    key: "payment_wechat_public_key",
    label: "微信支付公钥",
    type: "password",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 16,
    when: { key: "payment_wechat_enabled", operator: "eq", value: "true" },
  },
  "payment_epay_enabled": {
    key: "payment_epay_enabled",
    label: "启用易支付",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "payment",
    sort: 20,
  },
  "payment_epay_app_id": {
    key: "payment_epay_app_id",
    label: "易支付应用 ID",
    type: "string",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 21,
    when: { key: "payment_epay_enabled", operator: "eq", value: "true" },
  },
  "payment_epay_app_key": {
    key: "payment_epay_app_key",
    label: "易支付应用密钥",
    type: "password",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 22,
    when: { key: "payment_epay_enabled", operator: "eq", value: "true" },
  },
  "payment_epay_gateway": {
    key: "payment_epay_gateway",
    label: "易支付网关地址",
    type: "url",
    defaultValue: "https://pay.example.com",
    public: false,
    group: "payment",
    sort: 23,
    when: { key: "payment_epay_enabled", operator: "eq", value: "true" },
  },
  "payment_epay_notify_url": {
    key: "payment_epay_notify_url",
    label: "易支付回调通知地址",
    type: "url",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 24,
    when: { key: "payment_epay_enabled", operator: "eq", value: "true" },
  },
  "payment_epay_wxpay_enabled": {
    key: "payment_epay_wxpay_enabled",
    label: "启用易支付微信支付",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "payment",
    sort: 25,
    when: { key: "payment_epay_enabled", operator: "eq", value: "true" },
  },
  "payment_epay_alipay_enabled": {
    key: "payment_epay_alipay_enabled",
    label: "启用易支付支付宝",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "payment",
    sort: 26,
    when: { key: "payment_epay_enabled", operator: "eq", value: "true" },
  },
  "payment_epay_usdt_enabled": {
    key: "payment_epay_usdt_enabled",
    label: "启用易支付 USDT",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "payment",
    sort: 27,
    when: { key: "payment_epay_enabled", operator: "eq", value: "true" },
  },
  "payment_notify_url": {
    key: "payment_notify_url",
    label: "支付回调通知地址",
    type: "url",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 30,
  },
  "payment_return_url": {
    key: "payment_return_url",
    label: "支付完成返回地址",
    type: "url",
    defaultValue: "",
    public: false,
    group: "payment",
    sort: 31,
  },

  // ==================== SEO 配置 ====================
  "seo_long_tail_keywords": {
    key: "seo_long_tail_keywords",
    label: "SEO 长尾关键词",
    description: "逗号分隔",
    type: "text",
    defaultValue: "",
    public: true,
    group: "seo",
    sort: 1,
  },
  "seo_home_keywords": {
    key: "seo_home_keywords",
    label: "首页专属关键词",
    type: "text",
    defaultValue: "",
    public: true,
    group: "seo",
    sort: 2,
  },
  "seo_author_page_keywords": {
    key: "seo_author_page_keywords",
    label: "作者页面关键词",
    type: "text",
    defaultValue: "",
    public: true,
    group: "seo",
    sort: 3,
  },
  "seo_article_page_keywords": {
    key: "seo_article_page_keywords",
    label: "文章页面关键词",
    type: "text",
    defaultValue: "",
    public: true,
    group: "seo",
    sort: 4,
  },

  // ==================== 站点配置 ====================
  "site_name": {
    key: "site_name",
    label: "网站名称",
    type: "string",
    defaultValue: "PicArt",
    public: true,
    group: "site",
    sort: 1,
  },
  "site_subtitle": {
    key: "site_subtitle",
    label: "网站副标题",
    type: "string",
    defaultValue: "",
    public: true,
    group: "site",
    sort: 2,
  },
  "site_description": {
    key: "site_description",
    label: "网站描述",
    type: "text",
    defaultValue: "",
    public: true,
    group: "site",
    sort: 3,
  },
  "site_keywords": {
    key: "site_keywords",
    label: "网站关键词",
    type: "text",
    defaultValue: "",
    public: true,
    group: "site",
    sort: 4,
  },
  "site_logo": {
    key: "site_logo",
    label: "网站 Logo",
    type: "image",
    defaultValue: "",
    public: true,
    group: "site",
    sort: 5,
    ui: { upload: { accept: "image/*", maxSize: 2 } },
  },
  "site_favicon": {
    key: "site_favicon",
    label: "网站图标",
    type: "image",
    defaultValue: "",
    public: true,
    group: "site",
    sort: 6,
    ui: { upload: { accept: ".ico,.png", maxSize: 1 } },
  },
  "site_layout": {
    key: "site_layout",
    label: "网站布局样式",
    type: "select",
    defaultValue: "grid",
    public: true,
    group: "site",
    sort: 7,
    ui: {
      options: [
        { value: "grid", label: "网格布局" },
        { value: "list", label: "列表布局" },
        { value: "masonry", label: "瀑布流布局" },
      ],
    },
  },
  "site_mail": {
    key: "site_mail",
    label: "网站隐私邮箱",
    type: "email",
    defaultValue: "",
    public: true,
    group: "site",
    sort: 8,
  },
  "site_separator": {
    key: "site_separator",
    label: "站点分隔符",
    type: "string",
    defaultValue: "|",
    public: true,
    group: "site",
    sort: 9,
  },
  "site_privacy_policy": {
    key: "site_privacy_policy",
    label: "隐私政策",
    type: "text",
    defaultValue: "",
    public: true,
    group: "site",
    sort: 10,
    ui: { rows: 10 },
  },
  "site_terms_of_service": {
    key: "site_terms_of_service",
    label: "服务条款",
    type: "text",
    defaultValue: "",
    public: true,
    group: "site",
    sort: 11,
    ui: { rows: 10 },
  },
  "site_contact": {
    key: "site_contact",
    label: "站点联系方式",
    description: "支持 HTML",
    type: "text",
    defaultValue: "",
    public: true,
    group: "site",
    sort: 12,
    ui: { rows: 5 },
  },

  // ==================== 系统配置 ====================
  "maintenance_mode": {
    key: "maintenance_mode",
    label: "维护模式",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "system",
    sort: 1,
  },
  "maintenance_message": {
    key: "maintenance_message",
    label: "维护模式消息",
    type: "string",
    defaultValue: "系统维护中，请稍后再试",
    public: true,
    group: "system",
    sort: 2,
    when: { key: "maintenance_mode", operator: "eq", value: "true" },
  },

  // ==================== 用户配置 ====================
  "user_registration_enabled": {
    key: "user_registration_enabled",
    label: "允许用户注册",
    type: "boolean",
    defaultValue: "true",
    public: true,
    group: "user",
    sort: 1,
  },
  "user_email_verification": {
    key: "user_email_verification",
    label: "需要邮箱验证",
    type: "boolean",
    defaultValue: "false",
    public: true,
    group: "user",
    sort: 2,
  },

  // ==================== 分成配置 ====================
  "commission_inviter_rate": {
    key: "commission_inviter_rate",
    label: "邀请者分成比例",
    type: "number",
    defaultValue: "0.05",
    public: false,
    group: "commission",
    sort: 1,
    ui: { min: 0, max: 1, step: 0.01 },
  },
  "commission_platform_rate": {
    key: "commission_platform_rate",
    label: "平台分成比例",
    type: "number",
    defaultValue: "0.1",
    public: false,
    group: "commission",
    sort: 2,
    ui: { min: 0, max: 1, step: 0.01 },
  },
  "commission_author_rate": {
    key: "commission_author_rate",
    label: "作者分成比例",
    type: "number",
    defaultValue: "0.85",
    public: false,
    group: "commission",
    sort: 3,
    ui: { min: 0, max: 1, step: 0.01 },
  },
};

/**
 * 通过 key 获取配置 Schema
 * 如果映射表中有，直接返回；否则返回基础 Schema
 */
export function getConfigSchemaByKey(item: ConfigItem): ConfigSchema {
  // 查找映射表
  const mappedSchema = CONFIG_SCHEMA_MAP[item.key];

  if (mappedSchema) {
    // 使用映射表的配置，但更新后端返回的值
    return {
      ...mappedSchema,
      defaultValue: item.value,
      public: item.public,
      // 如果后端有分组，使用后端的分组
      group: item.group || mappedSchema.group,
    };
  }

  // 映射表中没有，返回基础 Schema
  return {
    key: item.key,
    label: item.key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    description: item.description || `${item.key} 配置项`,
    type: item.type === "boolean" ? "boolean" : "string",
    defaultValue: item.value,
    public: item.public,
    group: item.group || "other",
  };
}

/**
 * 获取配置项的默认值
 */
export function getConfigDefaultValue(schema: ConfigSchema): string {
  if (schema.defaultValue !== undefined) {
    return schema.defaultValue;
  }

  switch (schema.type) {
    case "boolean":
      return "false";
    case "number":
      return "0";
    case "json":
    case "jsonArray":
      return "{}";
    case "select":
      return schema.ui?.options?.[0]?.value ?? "";
    default:
      return "";
  }
}

/**
 * 验证配置值
 */
export function validateConfigValue(
  value: string,
  schema: ConfigSchema
): { valid: boolean; message?: string } {
  const validation = schema.validation;
  if (!validation) {
    return { valid: true };
  }

  // 必填验证
  if (validation.required && !value.trim()) {
    return { valid: false, message: validation.requiredMessage || "此项为必填" };
  }

  // 最小长度/值验证
  if (validation.min !== undefined) {
    if (schema.type === "number") {
      const num = parseFloat(value);
      if (!isNaN(num) && num < validation.min) {
        return { valid: false, message: `不能小于 ${validation.min}` };
      }
    } else if (value.length < validation.min) {
      return { valid: false, message: `长度不能少于 ${validation.min} 个字符` };
    }
  }

  // 最大长度/值验证
  if (validation.max !== undefined) {
    if (schema.type === "number") {
      const num = parseFloat(value);
      if (!isNaN(num) && num > validation.max) {
        return { valid: false, message: `不能大于 ${validation.max}` };
      }
    } else if (value.length > validation.max) {
      return { valid: false, message: `长度不能超过 ${validation.max} 个字符` };
    }
  }

  // 正则验证
  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      return { valid: false, message: validation.patternMessage || "格式不正确" };
    }
  }

  // 类型特定验证
  switch (schema.type) {
    case "url":
      try {
        new URL(value);
      } catch {
        return { valid: false, message: "请输入有效的 URL" };
      }
      break;
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { valid: false, message: "请输入有效的邮箱地址" };
      }
      break;
    case "json":
    case "jsonArray":
      try {
        JSON.parse(value);
      } catch {
        return { valid: false, message: "请输入有效的 JSON" };
      }
      break;
    case "color":
      if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
        return { valid: false, message: "请输入有效的颜色值 (#RRGGBB)" };
      }
      break;
  }

  return { valid: true };
}

/**
 * 检查条件是否满足
 */
export function checkCondition(
  condition: ConfigCondition,
  values: Record<string, string>
): boolean {
  const dependentValue = values[condition.key];
  const expectedValue = condition.value;

  switch (condition.operator) {
    case "eq":
      return dependentValue === String(expectedValue);
    case "neq":
      return dependentValue !== String(expectedValue);
    case "gt":
      return parseFloat(dependentValue) > Number(expectedValue);
    case "gte":
      return parseFloat(dependentValue) >= Number(expectedValue);
    case "lt":
      return parseFloat(dependentValue) < Number(expectedValue);
    case "lte":
      return parseFloat(dependentValue) <= Number(expectedValue);
    case "contains":
      return dependentValue.includes(String(expectedValue));
    case "startsWith":
      return dependentValue.startsWith(String(expectedValue));
    case "endsWith":
      return dependentValue.endsWith(String(expectedValue));
    case "in":
      return Array.isArray(expectedValue) && expectedValue.includes(dependentValue);
    case "regex":
      return new RegExp(String(expectedValue)).test(dependentValue);
    default:
      return false;
  }
}

/**
 * 解析配置值为合适类型
 */
export function parseConfigValue<T>(
  value: string,
  type: ConfigValueType
): T | null {
  if (!value) return null;

  switch (type) {
    case "boolean":
      return (value === "true") as T;
    case "number":
      const num = parseFloat(value);
      return (isNaN(num) ? null : num) as T;
    case "json":
    case "jsonArray":
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    default:
      return value as T;
  }
}

/**
 * 序列化值为字符串存储
 */
export function stringifyConfigValue<T>(value: T, type: ConfigValueType): string {
  switch (type) {
    case "boolean":
      return String(value);
    case "number":
      return String(value);
    case "json":
    case "jsonArray":
      return JSON.stringify(value);
    default:
      return String(value ?? "");
  }
}
