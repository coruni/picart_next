"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 标签页组件属性接口
 * @interface TabsProps
 * 
 * @property {string} [defaultValue] - 默认选中的标签值
 * @property {string} [value] - 受控模式下的选中值
 * @property {(value: string) => void} [onValueChange] - 值变化回调
 * @property {React.ReactNode} children - 子组件
 * @property {string} [className] - 自定义样式类名
 */
interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * 标签页上下文值接口
 * @interface TabsContextValue
 * 
 * @property {string} value - 当前选中的标签值
 * @property {(value: string) => void} onValueChange - 值变化回调
 */
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined
);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within Tabs");
  }
  return context;
};

/**
 * 标签页容器组件
 * @component
 * 
 * 标签页组件的根容器，管理标签页的状态
 * 
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">标签一</TabsTrigger>
 *     <TabsTrigger value="tab2">标签二</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">内容一</TabsContent>
 *   <TabsContent value="tab2">内容二</TabsContent>
 * </Tabs>
 * ```
 */
export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(
    defaultValue || ""
  );

  const value = controlledValue ?? internalValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [controlledValue, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/**
 * 标签页列表组件属性接口
 * @interface TabsListProps
 * 
 * @property {React.ReactNode} children - 子组件
 * @property {string} [className] - 自定义样式类名
 */
interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 标签页列表组件
 * @component
 * 
 * 用于包裹标签页触发器的容器
 */
export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-6",
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

/**
 * 标签页触发器组件属性接口
 * @interface TabsTriggerProps
 * 
 * @property {string} value - 标签值
 * @property {React.ReactNode} children - 标签内容
 * @property {string} [className] - 自定义样式类名
 * @property {boolean} [disabled] - 是否禁用
 */
interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * 标签页触发器组件
 * @component
 * 
 * 标签页的可点击标签，选中时显示底部蓝色指示条
 */
export function TabsTrigger({
  value,
  children,
  className,
  disabled = false,
}: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      className={cn(
        "relative pb-3 px-1 text-sm font-medium transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected
          ? "text-foreground"
          : "text-secondary hover:text-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {children}
      {isSelected && (
        <span className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full w-1/2 translate-x-1/2" />
      )}
    </button>
  );
}

/**
 * 标签页内容组件属性接口
 * @interface TabsContentProps
 * 
 * @property {string} value - 标签值
 * @property {React.ReactNode} children - 内容
 * @property {string} [className] - 自定义样式类名
 */
interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * 标签页内容组件
 * @component
 * 
 * 显示与选中标签对应的内容，只有当标签值匹配时才显示
 */
export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: selectedValue } = useTabsContext();

  if (selectedValue !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      className={cn("mt-4 focus-visible:outline-none", className)}
    >
      {children}
    </div>
  );
}
