"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

/**
 * 多行文本框组件属性接口
 * @interface TextareaProps
 * @extends {TextareaHTMLAttributes<HTMLTextAreaElement>}
 *
 * @property {boolean} [error] - 是否显示错误状态
 * @property {boolean} [fullWidth] - 是否占满容器宽度
 * @property {boolean} [showMaxLength] - 是否显示字符计数
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  fullWidth?: boolean;
  showMaxLength?: boolean;
}

/**
 * 多行文本框组件
 * @component
 *
 * 基础多行文本框组件，支持错误状态和全宽显示
 *
 * @example
 * ```tsx
 * // 基础用法
 * <Textarea placeholder="请输入内容" />
 *
 * // 错误状态
 * <Textarea error placeholder="输入有误" />
 *
 * // 全宽
 * <Textarea fullWidth placeholder="全宽输入框" />
 *
 * // 自定义高度
 * <Textarea className="min-h-[150px]" placeholder="自定义高度" />
 * ```
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, fullWidth, showMaxLength, value, maxLength, ...props }, ref) => {
    const textareaValue = value ?? "";
    const currentLength = typeof textareaValue === "string" ? textareaValue.length : 0;

    return (
      <div className={cn("relative", fullWidth && "w-full")}>
        <textarea
          className={cn(
            "flex min-h-[80px] rounded-lg border bg-card px-3 py-2 text-sm",
            "placeholder:text-gray-400",
            "focus:ring-offset-0 outline-none focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-200",
            "resize-y",
            error
              ? "border-red-500 focus:ring-red-500 dark:border-red-400"
              : "border-border focus:ring-primary focus:border-primary hover:border-primary",
            fullWidth && "w-full",
            showMaxLength && maxLength && "pb-6",
            className,
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        {showMaxLength && maxLength && (
          <span className="absolute right-3 bottom-2 text-xs text-secondary pointer-events-none">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
