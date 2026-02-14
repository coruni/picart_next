"use client";

import {
  createContext,
  useContext,
  useId,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/**
 * 表单上下文值接口
 * @interface FormContextValue
 * @property {Record<string, string>} errors - 字段错误信息，以字段名为键
 * @property {Record<string, boolean>} touched - 字段触摸状态，以字段名为键
 */
interface FormContextValue {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

const FormContext = createContext<FormContextValue | null>(null);

/**
 * 访问表单上下文的 Hook
 * @throws {Error} 当在 Form 组件外使用时抛出错误
 * @returns {FormContextValue} 包含错误和触摸状态的表单上下文
 */
const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("Form components must be used within a Form");
  }
  return context;
};

/**
 * 表单组件属性
 * @interface FormProps
 * @extends {FormHTMLAttributes<HTMLFormElement>}
 * @property {Record<string, string>} [errors] - 字段错误信息
 * @property {Record<string, boolean>} [touched] - 字段触摸状态
 * @property {ReactNode} children - 表单内容
 */
export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  children: ReactNode;
}

/**
 * 表单组件，支持错误处理和验证状态
 * 为子表单组件提供上下文以访问错误和触摸状态
 * 
 * @component
 * @example
 * ```tsx
 * <Form errors={errors} touched={touched} onSubmit={handleSubmit}>
 *   <FormField name="email" label="邮箱">
 *     <Input type="email" />
 *   </FormField>
 * </Form>
 * ```
 */
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

/**
 * 表单字段组件属性
 * @interface FormFieldProps
 * @property {string} name - 字段名称，用于错误/触摸状态查找
 * @property {string} [label] - 字段标签文本
 * @property {boolean} [required] - 是否必填（显示星号）
 * @property {ReactNode} children - 字段输入组件
 * @property {string} [className] - 额外的 CSS 类名
 * @property {boolean} [floating] - 是否使用浮动标签样式（默认：false）
 */
export interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  floating?: boolean;
}

/**
 * 表单字段组件，包装输入框并显示标签和错误信息
 * 当字段被触摸时自动显示错误
 * 
 * @component
 * @example
 * ```tsx
 * <FormField name="username" label="用户名" required>
 *   <Input />
 * </FormField>
 * ```
 */
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

/**
 * 表单标签组件属性
 * @interface FormLabelProps
 * @property {string} [htmlFor] - 关联的输入元素 ID
 * @property {boolean} [required] - 显示必填星号
 * @property {ReactNode} children - 标签文本
 * @property {string} [className] - 额外的 CSS 类名
 */
export interface FormLabelProps {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * 表单标签组件，用于表单字段标签
 * 当 required 为 true 时显示必填星号
 * 
 * @component
 * @example
 * ```tsx
 * <FormLabel htmlFor="email" required>
 *   邮箱地址
 * </FormLabel>
 * ```
 */
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

/**
 * 表单错误组件属性
 * @interface FormErrorProps
 * @property {ReactNode} children - 错误信息文本
 * @property {string} [className] - 额外的 CSS 类名
 */
export interface FormErrorProps {
  children: ReactNode;
  className?: string;
}

/**
 * 表单错误组件，用于显示字段验证错误
 * 使用红色样式以提高可见性
 * 
 * @component
 * @example
 * ```tsx
 * <FormError>此字段为必填项</FormError>
 * ```
 */
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

/**
 * 表单描述组件属性
 * @interface FormDescriptionProps
 * @property {ReactNode} children - 描述文本
 * @property {string} [className] - 额外的 CSS 类名
 */
export interface FormDescriptionProps {
  children: ReactNode;
  className?: string;
}

/**
 * 表单描述组件，用于字段帮助文本
 * 显示表单字段的额外信息或说明
 * 
 * @component
 * @example
 * ```tsx
 * <FormDescription>
 *   输入您的邮箱地址以接收通知
 * </FormDescription>
 * ```
 */
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
