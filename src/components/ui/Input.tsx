"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * 输入框组件属性接口
 * @interface InputProps
 * @extends {InputHTMLAttributes<HTMLInputElement>}
 * 
 * @property {boolean} [error] - 是否显示错误状态
 * @property {boolean} [fullWidth] - 是否占满容器宽度
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fullWidth?: boolean;
}

/**
 * 输入框组件
 * @component
 * 
 * 基础输入框组件，支持错误状态和全宽显示
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <Input placeholder="请输入内容" />
 * 
 * // 错误状态
 * <Input error placeholder="输入有误" />
 * 
 * // 全宽
 * <Input fullWidth placeholder="全宽输入框" />
 * 
 * // 密码输入
 * <Input type="password" placeholder="请输入密码" />
 * ```
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, fullWidth, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 rounded-lg border bg-card px-3 py-2 text-sm",
          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
          "focus:ring-offset-0 outline-none focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors duration-200",
          error
            ? "border-red-500 focus:ring-red-500 dark:border-red-400"
            : "border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary hover:border-primary",
          fullWidth && "w-full",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
