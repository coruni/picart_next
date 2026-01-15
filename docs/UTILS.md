# 工具函数使用文档

## 目录结构

```
src/
├── lib/              # 工具函数库
│   ├── utils.ts      # 通用工具函数
│   ├── storage.ts    # 本地存储工具
│   ├── validation.ts # 数据验证工具
│   └── request.ts    # HTTP 请求工具
├── hooks/            # React Hooks
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   ├── useCopyToClipboard.ts
│   ├── useToggle.ts
│   ├── useClickOutside.ts
│   └── useWindowSize.ts
├── constants/        # 常量定义
│   └── index.ts
├── types/           # 类型定义
│   └── index.ts
└── config/          # 配置文件
    └── site.ts
```

## 工具函数 (lib/utils.ts)

### cn - 合并 Tailwind CSS 类名
```typescript
import { cn } from "@/lib/utils";

<div className={cn("text-base", isActive && "text-blue-500")} />
```

### formatDate - 格式化日期
```typescript
import { formatDate } from "@/lib/utils";

formatDate(new Date()); // "2026年1月15日"
formatDate("2026-01-15", "en-US"); // "January 15, 2026"
```

### formatRelativeTime - 格式化相对时间
```typescript
import { formatRelativeTime } from "@/lib/utils";

formatRelativeTime(new Date(Date.now() - 3600000)); // "1小时前"
```

### debounce - 防抖函数
```typescript
import { debounce } from "@/lib/utils";

const handleSearch = debounce((value: string) => {
  console.log("搜索:", value);
}, 300);
```

### throttle - 节流函数
```typescript
import { throttle } from "@/lib/utils";

const handleScroll = throttle(() => {
  console.log("滚动事件");
}, 1000);
```

### 其他工具
- `deepClone<T>(obj: T)` - 深拷贝
- `randomString(length)` - 生成随机字符串
- `sleep(ms)` - 睡眠函数
- `formatFileSize(bytes)` - 格式化文件大小
- `getQueryParams(url)` - 获取URL查询参数
- `copyToClipboard(text)` - 复制到剪贴板

## 本地存储 (lib/storage.ts)

### Storage 类
```typescript
import { storage } from "@/lib/storage";

// 设置
storage.set("user", { name: "张三", age: 25 });

// 获取
const user = storage.get<User>("user");

// 删除
storage.remove("user");

// 清空
storage.clear();

// 检查是否存在
storage.has("user");
```

### SessionStorage 类
```typescript
import { sessionStore } from "@/lib/storage";

sessionStore.set("token", "abc123");
const token = sessionStore.get<string>("token");
```

## 数据验证 (lib/validation.ts)

```typescript
import {
  isEmail,
  isPhone,
  isUrl,
  isIdCard,
  getPasswordStrength,
  isEmpty,
  isInRange,
  isLengthValid,
  isNumeric,
  isInteger,
  isPositive,
  isBankCard,
  isChinese,
  isIP,
} from "@/lib/validation";

// 验证邮箱
isEmail("test@example.com"); // true

// 验证手机号
isPhone("13800138000"); // true

// 验证密码强度 (0-4)
getPasswordStrength("Abc123!@#"); // 4

// 验证是否为空
isEmpty(""); // true
isEmpty([]); // true
isEmpty({}); // true
```

## HTTP 请求 (lib/request.ts)

```typescript
import { get, post, put, del, patch } from "@/lib/request";

// GET 请求
const data = await get("/api/users", {
  params: { page: 1, pageSize: 20 },
});

// POST 请求
const result = await post("/api/users", {
  name: "张三",
  email: "test@example.com",
});

// PUT 请求
await put("/api/users/1", { name: "李四" });

// DELETE 请求
await del("/api/users/1");

// PATCH 请求
await patch("/api/users/1", { status: "active" });

// 自定义配置
const data = await get("/api/users", {
  timeout: 5000,
  headers: {
    Authorization: "Bearer token",
  },
});
```

## React Hooks

### useDebounce - 防抖
```typescript
import { useDebounce } from "@/hooks";

const [searchTerm, setSearchTerm] = useState("");
const debouncedSearchTerm = useDebounce(searchTerm, 500);

useEffect(() => {
  // 使用防抖后的值进行搜索
  search(debouncedSearchTerm);
}, [debouncedSearchTerm]);
```

### useLocalStorage - 本地存储
```typescript
import { useLocalStorage } from "@/hooks";

const [user, setUser] = useLocalStorage("user", { name: "" });
```

### useMediaQuery - 媒体查询
```typescript
import { useIsMobile, useIsTablet, useIsDesktop } from "@/hooks";

const isMobile = useIsMobile();
const isTablet = useIsTablet();
const isDesktop = useIsDesktop();
```

### useCopyToClipboard - 复制到剪贴板
```typescript
import { useCopyToClipboard } from "@/hooks";

const [copied, copy] = useCopyToClipboard();

<button onClick={() => copy("复制的内容")}>
  {copied ? "已复制" : "复制"}
</button>
```

### useToggle - 切换状态
```typescript
import { useToggle } from "@/hooks";

const [isOpen, toggle, setIsOpen] = useToggle(false);

<button onClick={toggle}>切换</button>
```

### useClickOutside - 点击外部区域
```typescript
import { useClickOutside } from "@/hooks";
import { useRef } from "react";

const ref = useRef<HTMLDivElement>(null);
useClickOutside(ref, () => {
  console.log("点击了外部区域");
});

<div ref={ref}>内容</div>
```

### useWindowSize - 窗口尺寸
```typescript
import { useWindowSize } from "@/hooks";

const { width, height } = useWindowSize();
```

## 常量 (constants/index.ts)

```typescript
import {
  API_BASE_URL,
  APP_NAME,
  TOKEN_KEY,
  DEFAULT_PAGE_SIZE,
  MAX_FILE_SIZE,
  BREAKPOINTS,
  HTTP_STATUS,
  REGEX,
} from "@/constants";
```

## 类型定义 (types/index.ts)

```typescript
import type {
  ApiResponse,
  PaginationParams,
  PaginationResponse,
  User,
  FieldError,
  Option,
  MenuItem,
  UploadFile,
  TableColumn,
  SortParams,
  FilterParams,
} from "@/types";
```

## 配置 (config/site.ts)

```typescript
import { siteConfig } from "@/config/site";

console.log(siteConfig.name); // "PicArt"
```

## 环境变量

复制 `.env.local.example` 为 `.env.local` 并配置相应的环境变量：

```bash
cp .env.local.example .env.local
```
