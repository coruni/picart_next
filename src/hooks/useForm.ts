import { useState, useCallback, type FormEvent } from "react";

export interface ValidationRule {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  validate?: (value: any) => string | boolean;
  email?: boolean | string;
  min?: { value: number; message: string };
  max?: { value: number; message: string };
}

export interface FormConfig<T> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRule>>;
  onSubmit: (values: T) => void | Promise<void>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: FormConfig<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 验证单个字段
  const validateField = useCallback(
    (name: keyof T, value: any): string => {
      const rules = validationRules[name];
      if (!rules) return "";

      // Required 验证
      if (rules.required) {
        if (!value || (typeof value === "string" && !value.trim())) {
          return typeof rules.required === "string"
            ? rules.required
            : `${String(name)} 是必填项`;
        }
      }

      // Email 验证
      if (rules.email && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return typeof rules.email === "string"
            ? rules.email
            : "请输入有效的邮箱地址";
        }
      }

      // MinLength 验证
      if (rules.minLength && value) {
        if (value.length < rules.minLength.value) {
          return rules.minLength.message;
        }
      }

      // MaxLength 验证
      if (rules.maxLength && value) {
        if (value.length > rules.maxLength.value) {
          return rules.maxLength.message;
        }
      }

      // Pattern 验证
      if (rules.pattern && value) {
        if (!rules.pattern.value.test(value)) {
          return rules.pattern.message;
        }
      }

      // Min 验证（数字）
      if (rules.min !== undefined && value !== undefined) {
        if (Number(value) < rules.min.value) {
          return rules.min.message;
        }
      }

      // Max 验证（数字）
      if (rules.max !== undefined && value !== undefined) {
        if (Number(value) > rules.max.value) {
          return rules.max.message;
        }
      }

      // 自定义验证
      if (rules.validate) {
        const result = rules.validate(value);
        if (typeof result === "string") {
          return result;
        }
        if (result === false) {
          return "验证失败";
        }
      }

      return "";
    },
    [validationRules]
  );

  // 验证所有字段
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((key) => {
      const error = validateField(key as keyof T, values[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules, validateField]);

  // 处理字段变化
  const handleChange = useCallback(
    (name: keyof T) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const value = e.target.value;
      setValues((prev) => ({ ...prev, [name]: value }));

      // 如果字段已被触摸，实时验证
      if (touched[name as string]) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name as string]: error }));
      }
    },
    [touched, validateField]
  );

  // 处理字段失焦
  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [name as string]: true }));
      const error = validateField(name, values[name]);
      setErrors((prev) => ({ ...prev, [name as string]: error }));
    },
    [values, validateField]
  );

  // 设置字段值
  const setValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // 设置多个字段值
  const setFieldValues = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  // 重置表单
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // 处理表单提交
  const handleSubmit = useCallback(
    async (e?: FormEvent<HTMLFormElement>) => {
      if (e) {
        e.preventDefault();
      }

      // 标记所有字段为已触摸
      const allTouched = Object.keys(validationRules).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      // 验证表单
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validationRules, validateForm, onSubmit]
  );

  // 获取字段属性
  const getFieldProps = useCallback(
    (name: keyof T) => ({
      name: String(name),
      value: values[name] || "",
      onChange: handleChange(name),
      onBlur: handleBlur(name),
      error: touched[name as string] ? !!errors[name as string] : false,
    }),
    [values, errors, touched, handleChange, handleBlur]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setFieldValues,
    reset,
    getFieldProps,
    validateForm,
  };
}
