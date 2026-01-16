"use client";

import { useForm } from "@/hooks/useForm";
import { Form, FormField } from "@/components/ui/Form";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface LoginFormData {
  email: string;
  password: string;
}

export function FloatingLoginForm() {
  const form = useForm<LoginFormData>({
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("登录成功！");
    },
  });

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">登录（浮动标签）</h2>
      
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

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={form.isSubmitting}
        >
          {form.isSubmitting ? "登录中..." : "登录"}
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
  phone: string;
}

export function FloatingRegisterForm() {
  const form = useForm<RegisterFormData>({
    initialValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
    validationRules: {
      username: {
        required: "用户名不能为空",
        minLength: {
          value: 3,
          message: "用户名至少需要 3 个字符",
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
      phone: {
        required: "手机号不能为空",
        pattern: {
          value: /^1[3-9]\d{9}$/,
          message: "请输入有效的手机号",
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
      <h2 className="text-2xl font-bold mb-6">注册账号</h2>
      
      <Form errors={form.errors} touched={form.touched} onSubmit={form.handleSubmit}>
        <FormField name="username" floating>
          <FloatingInput
            {...form.getFieldProps("username")}
            label="用户名"
            fullWidth
          />
        </FormField>

        <FormField name="email" floating>
          <FloatingInput
            {...form.getFieldProps("email")}
            label="邮箱地址"
            type="email"
            fullWidth
          />
        </FormField>

        <FormField name="phone" floating>
          <FloatingInput
            {...form.getFieldProps("phone")}
            label="手机号"
            type="tel"
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

        <FormField name="confirmPassword" floating>
          <FloatingInput
            {...form.getFieldProps("confirmPassword")}
            label="确认密码"
            type="password"
            fullWidth
          />
        </FormField>

        <div className="flex gap-2 pt-2">
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
          >
            {form.isSubmitting ? "注册中..." : "注册"}
          </Button>
        </div>
      </Form>
    </div>
  );
}

// 对比示例：同时展示两种风格
export function ComparisonExample() {
  return (
    <div className="grid md:grid-cols-2 gap-8 p-8">
      <div>
        <FloatingLoginForm />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-6">传统标签</h2>
        <p className="text-sm text-gray-500 mb-4">
          对比：传统的标签在输入框上方
        </p>
      </div>
    </div>
  );
}

// Material Design 风格的浮动输入框
export function MaterialDesignForm() {
  const form = useForm({
    initialValues: {
      fullName: "",
      email: "",
      message: "",
    },
    validationRules: {
      fullName: {
        required: "姓名不能为空",
      },
      email: {
        required: "邮箱不能为空",
        email: true,
      },
      message: {
        required: "留言不能为空",
        maxLength: {
          value: 500,
          message: "留言最多 500 个字符",
        },
      },
    },
    onSubmit: async (values) => {
      console.log("联系我们:", values);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("感谢您的留言！我们会尽快回复。");
      form.reset();
    },
  });

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-2">联系我们</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        有任何问题或建议？请填写下方表单
      </p>
      
      <Form errors={form.errors} touched={form.touched} onSubmit={form.handleSubmit}>
        <FormField name="fullName" floating>
          <FloatingInput
            {...form.getFieldProps("fullName")}
            label="姓名"
            fullWidth
          />
        </FormField>

        <FormField name="email" floating>
          <FloatingInput
            {...form.getFieldProps("email")}
            label="邮箱地址"
            type="email"
            fullWidth
          />
        </FormField>

        <FormField name="message" floating>
          <div className="relative">
            <textarea
              {...form.getFieldProps("message")}
              rows={4}
              className={cn(
                "peer w-full rounded-lg border bg-white dark:bg-gray-800 px-3 pt-6 pb-2 text-sm",
                "placeholder:text-transparent resize-none",
                "focus:outline-none focus:ring-2 focus:ring-offset-0",
                "transition-all duration-200",
                form.touched.message && form.errors.message
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
              )}
            />
            <label
              className={cn(
                "absolute left-3 top-1.5 text-xs font-medium transition-all duration-200 pointer-events-none",
                form.touched.message && form.errors.message
                  ? "text-red-500"
                  : "text-gray-500 dark:text-gray-400 peer-focus:text-primary-500"
              )}
            >
              留言内容
            </label>
          </div>
        </FormField>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={form.isSubmitting}
        >
          {form.isSubmitting ? "发送中..." : "发送留言"}
        </Button>
      </Form>
    </div>
  );
}
