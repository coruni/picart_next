/**
 * 全局常量
 */

// API 基础路径
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

// 应用名称
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "PicArt";

// 应用版本
export const APP_VERSION = "1.0.0";

// 本地存储键名前缀
export const STORAGE_PREFIX = "picart_";

// Token 键名
export const TOKEN_KEY = `${STORAGE_PREFIX}token`;

// 用户信息键名
export const USER_KEY = `${STORAGE_PREFIX}user`;

// 语言键名
export const LOCALE_KEY = `${STORAGE_PREFIX}locale`;

// 主题键名
export const THEME_KEY = `${STORAGE_PREFIX}theme`;

// 分页默认配置
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// 文件上传限制
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

// 请求超时时间
export const REQUEST_TIMEOUT = 30000; // 30秒

// 防抖延迟
export const DEBOUNCE_DELAY = 300;

// 节流延迟
export const THROTTLE_DELAY = 1000;

// 响应式断点
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1536,
} as const;

// HTTP 状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// 正则表达式
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  URL: /^https?:\/\/.+/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
} as const;
