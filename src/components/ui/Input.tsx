"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

/**
 * 输入框组件属性接口
 * @interface InputProps
 * @extends {InputHTMLAttributes<HTMLInputElement>}
 *
 * @property {boolean} [error] - 是否显示错误状态
 * @property {boolean} [fullWidth] - 是否占满容器宽度
 * @property {boolean} [showMaxLength] - 是否显示字符计数
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fullWidth?: boolean;
  showMaxLength?: boolean;
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
  ({ className, error, fullWidth, showMaxLength, value, maxLength, type = "text", ...props }, ref) => {
    const inputValue = value ?? "";
    const currentLength = typeof inputValue === "string" ? inputValue.length : 0;

    return (
      <div className={cn("relative", fullWidth && "w-full")}>
        <input
          type={type}
          className={cn(
            "flex h-10 rounded-lg border bg-card px-3 py-2 text-sm",
            "placeholder:text-gray-400",
            "focus:ring-offset-0 outline-none focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-200",
            error
              ? "border-red-500 focus:ring-red-500 dark:border-red-400"
              : "border-border focus:ring-primary focus:border-primary hover:border-primary",
            fullWidth && "w-full",
            showMaxLength && maxLength && "pr-13",
            className,
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        {showMaxLength && maxLength && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-secondary pointer-events-none">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };

