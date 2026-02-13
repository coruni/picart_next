"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fullWidth?: boolean;
}

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
