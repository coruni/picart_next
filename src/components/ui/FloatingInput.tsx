"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  fullWidth?: boolean;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, error, fullWidth, value, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    
    // 检测是否有值：只有非空字符串才算有值
    const hasValue = Boolean(value && String(value).trim());
    
    // 标签是否应该浮动：聚焦时或有值时
    const isFloating = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className={cn("relative", fullWidth && "w-full")}>
        <input
          ref={ref}
          value={value ?? ""}
          className={cn(
            "peer w-full h-12 rounded-lg border bg-white dark:bg-gray-800 px-3 pt-4 pb-1 text-base",
            "placeholder:text-transparent",
            "focus:outline-none focus:ring-1 focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200",
            error
              ? "border-red-500 focus:ring-red-500 dark:border-red-400"
              : "border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary",
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        <label
          className={cn(
            "absolute left-3 transition-all duration-200 pointer-events-none select-none",
            "text-gray-500 dark:text-gray-400",
            // 浮动状态：顶部小字
            // 非浮动状态：居中正常大小
            isFloating
              ? "top-1 text-xs font-medium"
              : "top-1/2 -translate-y-1/2 text-sm",
            error && "text-red-500 dark:text-red-400",
            isFocused && !error && "text-primary"
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
