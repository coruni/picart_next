"use client";

import {
  createContext,
  useContext,
  useId,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// Form Context
interface FormContextValue {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

const FormContext = createContext<FormContextValue | null>(null);

const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("Form components must be used within a Form");
  }
  return context;
};

// Form Component
export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  children: ReactNode;
}

export function Form({
  errors = {},
  touched = {},
  children,
  className,
  ...props
}: FormProps) {
  return (
    <FormContext.Provider value={{ errors, touched }}>
      <form className={cn("space-y-4", className)} {...props}>
        {children}
      </form>
    </FormContext.Provider>
  );
}

// FormField Component
export interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  floating?: boolean; // 是否使用浮动标签
}

export function FormField({
  name,
  label,
  required,
  children,
  className,
  floating = false,
}: FormFieldProps) {
  const id = useId();
  const { errors, touched } = useFormContext();
  const error = touched[name] ? errors[name] : undefined;

  // 如果是浮动标签模式，不显示独立的 label
  if (floating) {
    return (
      <div className={cn("space-y-2", className)}>
        <div>{children}</div>
        {error && <FormError>{error}</FormError>}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <FormLabel htmlFor={id} required={required}>
          {label}
        </FormLabel>
      )}
      <div>{children}</div>
      {error && <FormError>{error}</FormError>}
    </div>
  );
}

// FormLabel Component
export interface FormLabelProps {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormLabel({
  htmlFor,
  required,
  children,
  className,
}: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block text-sm font-medium text-gray-700 dark:text-gray-300",
        className
      )}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

// FormError Component
export interface FormErrorProps {
  children: ReactNode;
  className?: string;
}

export function FormError({ children, className }: FormErrorProps) {
  return (
    <p
      className={cn(
        "text-xs text-red-500 dark:text-red-400 flex items-center gap-1",
        className
      )}
    >

      {children}
    </p>
  );
}

// FormDescription Component
export interface FormDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function FormDescription({
  children,
  className,
}: FormDescriptionProps) {
  return (
    <p
      className={cn(
        "text-sm text-gray-500 dark:text-gray-400",
        className
      )}
    >
      {children}
    </p>
  );
}
