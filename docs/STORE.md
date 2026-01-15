# Zustand 状态管理使用文档

本项目使用 Zustand 作为状态管理库（React 版的 Pinia）。

## 为什么选择 Zustand？

- 🎯 简单易用，API 类似 Pinia
- 🚀 轻量级（~1KB）
- 💪 TypeScript 支持完善
- 🔄 支持持久化
- ⚡️ 无需 Provider 包裹

## 已创建的 Store

### 1. useUserStore - 用户状态管理

```typescript
import { useUserStore } from "@/stores";

function Component() {
  const { user, token, isAuthenticated, login, logout, updateUser } = useUserStore();

  // 登录
  const handleLogin = async () => {
    const userData = { id: "1", username: "张三", email: "test@example.com" };
    const token = "abc123";
    login(userData, token);
  };

  // 退出
  const handleLogout = () => {
    logout();
  };

  // 更新用户信息
  const handleUpdate = () => {
    updateUser({ username: "李四" });
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>欢迎，{user?.username}</p>
          <button onClick={handleLogout}>退出</button>
        </div>
      ) : (
        <button onClick={handleLogin}>登录</button>
      )}
    </div>
  );
}
```

### 2. useAppStore - 应用全局状态

```typescript
import { useAppStore } from "@/stores";

function Component() {
  const { theme, sidebarOpen, locale, setTheme, toggleSidebar, setLocale } = useAppStore();

  return (
    <div>
      {/* 主题切换 */}
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="light">浅色</option>
        <option value="dark">深色</option>
        <option value="system">跟随系统</option>
      </select>

      {/* 侧边栏切换 */}
      <button onClick={toggleSidebar}>
        {sidebarOpen ? "关闭" : "打开"}侧边栏
      </button>

      {/* 语言切换 */}
      <button onClick={() => setLocale("en")}>English</button>
    </div>
  );
}
```

### 3. useCartStore - 购物车状态

```typescript
import { useCartStore } from "@/stores";

function Component() {
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCartStore();

  const handleAddToCart = () => {
    addItem({
      id: "1",
      name: "商品名称",
      price: 99.99,
      quantity: 1,
      image: "/product.jpg",
    });
  };

  return (
    <div>
      <button onClick={handleAddToCart}>添加到购物车</button>
      
      <div>
        <p>商品数量: {getTotalItems()}</p>
        <p>总价: ¥{getTotalPrice().toFixed(2)}</p>
      </div>

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name} - ¥{item.price} x {item.quantity}
            <button onClick={() => removeItem(item.id)}>删除</button>
            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
          </li>
        ))}
      </ul>

      <button onClick={clearCart}>清空购物车</button>
    </div>
  );
}
```

### 4. useModalStore - 模态框状态

```typescript
import { useModalStore } from "@/stores";

function Component() {
  const { openModal, closeModal, toggleModal, isOpen } = useModalStore();

  return (
    <div>
      <button onClick={() => openModal("login")}>打开登录框</button>
      
      {isOpen("login") && (
        <div className="modal">
          <h2>登录</h2>
          <button onClick={() => closeModal("login")}>关闭</button>
        </div>
      )}

      <button onClick={() => toggleModal("settings")}>切换设置</button>
    </div>
  );
}
```

### 5. useNotificationStore - 通知状态

```typescript
import { useNotificationStore } from "@/stores";

function Component() {
  const { addNotification } = useNotificationStore();

  const showSuccess = () => {
    addNotification("success", "操作成功！", 3000);
  };

  const showError = () => {
    addNotification("error", "操作失败！", 3000);
  };

  const showWarning = () => {
    addNotification("warning", "警告信息", 3000);
  };

  const showInfo = () => {
    addNotification("info", "提示信息", 3000);
  };

  return (
    <div>
      <button onClick={showSuccess}>成功通知</button>
      <button onClick={showError}>错误通知</button>
      <button onClick={showWarning}>警告通知</button>
      <button onClick={showInfo}>信息通知</button>
    </div>
  );
}
```

## 创建自定义 Store

### 基础 Store

```typescript
import { create } from "zustand";

interface TodoState {
  todos: string[];
  addTodo: (todo: string) => void;
  removeTodo: (index: number) => void;
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  
  addTodo: (todo) =>
    set((state) => ({
      todos: [...state.todos, todo],
    })),
  
  removeTodo: (index) =>
    set((state) => ({
      todos: state.todos.filter((_, i) => i !== index),
    })),
}));
```

### 带持久化的 Store

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  fontSize: number;
  setFontSize: (size: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontSize: 16,
      setFontSize: (size) => set({ fontSize: size }),
    }),
    {
      name: "settings-storage", // localStorage key
    }
  )
);
```

### 带异步操作的 Store

```typescript
import { create } from "zustand";

interface DataState {
  data: any[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

export const useDataStore = create<DataState>((set) => ({
  data: [],
  loading: false,
  error: null,

  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/data");
      const data = await response.json();
      set({ data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
```

## 在组件中使用

### 选择性订阅（性能优化）

```typescript
// ❌ 不推荐：订阅整个 store
const store = useUserStore();

// ✅ 推荐：只订阅需要的状态
const user = useUserStore((state) => state.user);
const login = useUserStore((state) => state.login);
```

### 在非 React 组件中使用

```typescript
import { useUserStore } from "@/stores";

// 获取状态
const user = useUserStore.getState().user;

// 调用方法
useUserStore.getState().login(userData, token);

// 订阅变化
const unsubscribe = useUserStore.subscribe((state) => {
  console.log("User changed:", state.user);
});

// 取消订阅
unsubscribe();
```

## 中间件

### Persist（持久化）

```typescript
import { persist } from "zustand/middleware";

const useStore = create(
  persist(
    (set) => ({
      // store 定义
    }),
    {
      name: "storage-key", // localStorage key
      partialize: (state) => ({ user: state.user }), // 只持久化部分状态
    }
  )
);
```

### Immer（不可变更新）

```typescript
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const useStore = create(
  immer((set) => ({
    nested: { count: 0 },
    increment: () =>
      set((state) => {
        state.nested.count++; // 直接修改，immer 会处理不可变性
      }),
  }))
);
```

## 最佳实践

1. **按功能拆分 Store**：不要创建一个巨大的全局 store
2. **使用 TypeScript**：充分利用类型检查
3. **选择性订阅**：只订阅需要的状态，避免不必要的重渲染
4. **持久化敏感数据**：注意不要持久化敏感信息（如密码）
5. **异步操作**：在 store 中处理异步逻辑，保持组件简洁
6. **命名规范**：使用 `useXxxStore` 命名 store

## 与 Pinia 的对比

| 特性 | Pinia (Vue) | Zustand (React) |
|------|-------------|-----------------|
| 定义方式 | `defineStore()` | `create()` |
| 状态 | `state` | 直接定义 |
| 方法 | `actions` | 直接定义 |
| 计算属性 | `getters` | 函数方法 |
| 持久化 | 插件 | `persist` 中间件 |
| Provider | 需要 | 不需要 |

## 示例：完整的用户认证流程

```typescript
// stores/useAuthStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userControllerLogin, userControllerLogout } from "@/api";

interface AuthState {
  user: any;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await userControllerLogin({
            body: { email, password },
          });
          set({
            user: response.data?.user,
            token: response.data?.token,
            loading: false,
          });
        } catch (error) {
          set({
            error: (error as Error).message,
            loading: false,
          });
        }
      },

      logout: async () => {
        try {
          await userControllerLogout();
          set({ user: null, token: null });
        } catch (error) {
          console.error("Logout failed:", error);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);
```

## 调试

使用 Redux DevTools 调试 Zustand：

```typescript
import { devtools } from "zustand/middleware";

const useStore = create(
  devtools((set) => ({
    // store 定义
  }))
);
```

安装 Redux DevTools 浏览器扩展后即可查看状态变化。
