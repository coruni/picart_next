# 浮动标签表单组件

## 📦 组件说明

浮动标签（Floating Label）是一种现代化的表单设计模式，标签作为 placeholder 显示在输入框内，当用户聚焦或输入内容时，标签会浮动到输入框上方并缩小。

## 🎨 效果演示

### 初始状态
```
┌─────────────────────────┐
│ 邮箱地址                 │
└─────────────────────────┘
```

### 聚焦/有值状态
```
  邮箱地址 (缩小)
┌─────────────────────────┐
│ user@example.com        │
└─────────────────────────┘
```

## 📝 使用方法

### 基础用法

```tsx
import { FloatingInput } from "@/components/ui/FloatingInput";

<FloatingInput
  label="邮箱地址"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  fullWidth
/>
```

### 配合表单验证使用

```tsx
import { useForm } from "@/hooks/useForm";
import { Form, FormField } from "@/components/ui/Form";
import { FloatingInput } from "@/components/ui/FloatingInput";

const form = useForm({
  initialValues: {
    email: "",
    password: "",
  },
  validationRules: {
    email: {
      required: "邮箱不能为空",
      email: true,
    },
    password: {
      required: "密码不能为空",
      minLength: { value: 6, message: "至少6个字符" },
    },
  },
  onSubmit: async (values) => {
    console.log(values);
  },
});

<Form errors={form.errors} touched={form.touched} onSubmit={form.handleSubmit}>
  <FormField name="email" floating>
    <FloatingInput
      {...form.getFieldProps("email")}
      label="邮箱地址"
      type="email"
      fullWidth
    />
  </FormField>

  <FormField name="password" floating>
    <FloatingInput
      {...form.getFieldProps("password")}
      label="密码"
      type="password"
      fullWidth
    />
  </FormField>

  <Button type="submit" variant="primary" fullWidth>
    登录
  </Button>
</Form>
```

## 🎯 组件属性

### FloatingInput Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| label | string | - | 标签文本（必填） |
| error | boolean | false | 是否显示错误状态 |
| fullWidth | boolean | false | 是否占满宽度 |
| value | string | - | 输入值 |
| ...props | InputHTMLAttributes | - | 其他原生 input 属性 |

### FormField Props (floating 模式)

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| name | string | - | 字段名称 |
| floating | boolean | false | 是否使用浮动标签模式 |
| children | ReactNode | - | 子组件 |

## 🎨 样式特性

### 动画效果
- 标签位置平滑过渡（200ms）
- 标签大小平滑缩放
- 颜色渐变过渡

### 状态样式
- **默认状态**: 灰色边框，标签居中
- **聚焦状态**: 主题色边框和标签
- **有值状态**: 标签浮动到顶部
- **错误状态**: 红色边框和标签
- **禁用状态**: 半透明，禁止交互

### 深色模式
- 自动适配深色主题
- 背景色和文字颜色自动切换

## 📋 完整示例

查看以下文件获取完整示例：
- `src/examples/FloatingFormExample.tsx` - 浮动标签表单示例
- `src/components/ui/FloatingInput.tsx` - 组件源码

### 登录表单示例

```tsx
export function LoginForm() {
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validationRules: {
      email: {
        required: "邮箱不能为空",
        email: "请输入有效的邮箱地址",
      },
      password: {
        required: "密码不能为空",
        minLength: {
          value: 6,
          message: "密码至少需要 6 个字符",
        },
      },
    },
    onSubmit: async (values) => {
      // 处理登录逻辑
      console.log(values);
    },
  });

  return (
    <Form errors={form.errors} touched={form.touched} onSubmit={form.handleSubmit}>
      <FormField name="email" floating>
        <FloatingInput
          {...form.getFieldProps("email")}
          label="邮箱地址"
          type="email"
          fullWidth
        />
      </FormField>

      <FormField name="password" floating>
        <FloatingInput
          {...form.getFieldProps("password")}
          label="密码"
          type="password"
          fullWidth
        />
      </FormField>

      <Button type="submit" variant="primary" fullWidth loading={form.isSubmitting}>
        登录
      </Button>
    </Form>
  );
}
```

## 🔄 对比传统表单

### 传统标签
```tsx
<FormField name="email" label="邮箱">
  <Input {...form.getFieldProps("email")} placeholder="请输入邮箱" />
</FormField>
```

### 浮动标签
```tsx
<FormField name="email" floating>
  <FloatingInput {...form.getFieldProps("email")} label="邮箱" />
</FormField>
```

## 💡 最佳实践

1. **标签文本简洁**: 使用简短清晰的标签文本
2. **一致性**: 在同一表单中保持风格一致
3. **错误提示**: 配合 FormField 显示验证错误
4. **无障碍**: 组件已包含适当的 ARIA 属性
5. **响应式**: 使用 fullWidth 适配不同屏幕

## 🎯 适用场景

✅ **适合使用**:
- 登录/注册表单
- 联系表单
- 个人信息编辑
- 现代化的 Web 应用

❌ **不适合使用**:
- 复杂的多步骤表单（可能需要更多上下文）
- 需要长标签文本的场景
- 老旧浏览器支持要求

## 🌟 特色功能

- ✅ TypeScript 类型安全
- ✅ 完整的表单验证集成
- ✅ 深色模式支持
- ✅ 平滑动画效果
- ✅ 错误状态显示
- ✅ 响应式设计
- ✅ 无障碍支持
