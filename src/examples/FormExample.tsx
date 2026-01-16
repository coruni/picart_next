"use client";

import { useForm } from "@/hooks/useForm";
import { Form, FormField, FormDescription } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginFormExample() {
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldProps,
  } = useForm<LoginFormData>({
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
      console.log("提交表单:", values);
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("登录成功！");
    },
  });

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">登录</h2>
      
      <Form errors={errors} touched={touched} onSubmit={handleSubmit}>
        <FormField name="email" label="邮箱" required>
          <Input
            {...getFieldProps("email")}
            type="email"
            placeholder="请输入邮箱"
            fullWidth
          />
        </FormField>

        <FormField name="password" label="密码" required>
          <Input
            {...getFieldProps("password")}
            type="password"
            placeholder="请输入密码"
            fullWidth
          />
          <FormDescription>密码至少需要 6 个字符</FormDescription>
        </FormField>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          
          {isSubmitting ? "登录中..." : "登录"}
        </Button>
      </Form>
    </div>
  );
}

// 注册表单示例
interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
}

export function RegisterFormExample() {
  const form = useForm<RegisterFormData>({
    initialValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      age: 0,
    },
    validationRules: {
      username: {
        required: "用户名不能为空",
        minLength: {
          value: 3,
          message: "用户名至少需要 3 个字符",
        },
        maxLength: {
          value: 20,
          message: "用户名最多 20 个字符",
        },
        pattern: {
          value: /^[a-zA-Z0-9_]+$/,
          message: "用户名只能包含字母、数字和下划线",
        },
      },
      email: {
        required: "邮箱不能为空",
        email: true,
      },
      password: {
        required: "密码不能为空",
        minLength: {
          value: 8,
          message: "密码至少需要 8 个字符",
        },
        pattern: {
          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          message: "密码必须包含大小写字母和数字",
        },
      },
      confirmPassword: {
        required: "请确认密码",
        validate: (value) => {
          if (value !== form.values.password) {
            return "两次密码输入不一致";
          }
          return true;
        },
      },
      age: {
        required: "年龄不能为空",
        min: {
          value: 18,
          message: "年龄必须大于等于 18 岁",
        },
        max: {
          value: 100,
          message: "年龄必须小于等于 100 岁",
        },
      },
    },
    onSubmit: async (values) => {
      console.log("注册表单:", values);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      alert("注册成功！");
      form.reset();
    },
  });

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">注册</h2>
      
      <Form errors={form.errors} touched={form.touched} onSubmit={form.handleSubmit}>
        <FormField name="username" label="用户名" required>
          <Input
            {...form.getFieldProps("username")}
            placeholder="请输入用户名"
            fullWidth
          />
        </FormField>

        <FormField name="email" label="邮箱" required>
          <Input
            {...form.getFieldProps("email")}
            type="email"
            placeholder="请输入邮箱"
            fullWidth
          />
        </FormField>

        <FormField name="password" label="密码" required>
          <Input
            {...form.getFieldProps("password")}
            type="password"
            placeholder="请输入密码"
            fullWidth
          />
          <FormDescription>
            密码必须至少 8 个字符，包含大小写字母和数字
          </FormDescription>
        </FormField>

        <FormField name="confirmPassword" label="确认密码" required>
          <Input
            {...form.getFieldProps("confirmPassword")}
            type="password"
            placeholder="请再次输入密码"
            fullWidth
          />
        </FormField>

        <FormField name="age" label="年龄" required>
          <Input
            {...form.getFieldProps("age")}
            type="number"
            placeholder="请输入年龄"
            fullWidth
          />
        </FormField>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={form.reset}
            disabled={form.isSubmitting}
          >
            重置
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={form.isSubmitting}
            disabled={form.isSubmitting}
          >
            {form.isSubmitting ? "注册中..." : "注册"}
          </Button>
        </div>
      </Form>
    </div>
  );
}

// 简单表单示例
export function SimpleFormExample() {
  const form = useForm({
    initialValues: {
      name: "",
      message: "",
    },
    validationRules: {
      name: {
        required: "姓名不能为空",
      },
      message: {
        required: "留言不能为空",
        maxLength: {
          value: 200,
          message: "留言最多 200 个字符",
        },
      },
    },
    onSubmit: (values) => {
      console.log("提交:", values);
      alert(`感谢 ${values.name} 的留言！`);
    },
  });

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">留言板</h2>
      
      <Form errors={form.errors} touched={form.touched} onSubmit={form.handleSubmit}>
        <FormField name="name" label="姓名" required>
          <Input {...form.getFieldProps("name")} placeholder="请输入姓名" fullWidth />
        </FormField>

        <FormField name="message" label="留言" required>
          <textarea
            {...form.getFieldProps("message")}
            placeholder="请输入留言内容"
            rows={4}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <FormDescription>
            {form.values.message.length} / 200 字符
          </FormDescription>
        </FormField>

        <Button type="submit" variant="primary" fullWidth loading={form.isSubmitting}>
          提交留言
        </Button>
      </Form>
    </div>
  );
}
