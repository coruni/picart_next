"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * 日期选择器组件属性接口
 * @interface DatePickerProps
 *
 * @property {string} [value] - 当前选中的日期值 (YYYY-MM-DD 格式)
 * @property {(value: string) => void} [onChange] - 日期变化回调
 * @property {string} [placeholder] - 占位文本
 * @property {string} [className] - 自定义样式类名
 * @property {boolean} [disabled] - 是否禁用
 * @property {Date} [minDate] - 最小可选日期
 * @property {Date} [maxDate] - 最大可选日期
 */
export type DatePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
};

/**
 * 日期选择器组件
 * @component
 *
 * 自定义日期选择器，支持年月日选择
 *
 * @example
 * ```tsx
 * const [date, setDate] = useState('');
 *
 * <DatePicker
 *   value={date}
 *   onChange={setDate}
 *   placeholder="选择日期"
 * />
 *
 * // 限制日期范围
 * <DatePicker
 *   value={date}
 *   onChange={setDate}
 *   minDate={new Date(2024, 0, 1)}
 *   maxDate={new Date(2024, 11, 31)}
 * />
 * ```
 */
export const DatePicker = ({
  value,
  onChange,
  placeholder = "选择日期",
  className,
  disabled = false,
  minDate,
  maxDate,
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(new Date());

  // Parse current value
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date;
  }, [value]);

  // Update view date when value changes
  useEffect(() => {
    if (parsedDate) {
      setViewDate(parsedDate);
    }
  }, [parsedDate]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Month names
  const monthNames = [
    "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月",
  ];

  // Week day names
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(currentYear, currentMonth + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Check if date is disabled
  const isDateDisabled = (date: Date) => {
    if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true;
    if (maxDate && date > new Date(maxDate.setHours(23, 59, 59, 999))) return true;
    return false;
  };

  // Check if date is selected
  const isDateSelected = (date: Date) => {
    if (!parsedDate) return false;
    return (
      date.getDate() === parsedDate.getDate() &&
      date.getMonth() === parsedDate.getMonth() &&
      date.getFullYear() === parsedDate.getFullYear()
    );
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (!onChange || isDateDisabled(date)) return;

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    onChange(dateString);
    setIsOpen(false);
  };

  // Navigate to previous month
  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Format display value
  const displayValue = useMemo(() => {
    if (!value) return "";
    return value;
  }, [value]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full h-10 rounded-lg border border-border cursor-pointer",
          "px-3 py-2 text-sm text-left",
          "focus:outline-none focus:ring-primary focus:border-primary",
          "hover:border-primary transition-colors",
          "flex items-center justify-between",
          "bg-card",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span className={cn(!displayValue && "text-gray-400")}>
          {displayValue || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-gray-500 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-20 mt-1",
            "bg-card",
            "drop-shadow-lg",
            "rounded-lg",
            "border border-border",
            "p-3",
            "min-w-[280px]",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-medium">
              {currentYear}年 {monthNames[currentMonth]}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs text-muted-foreground py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const selected = isDateSelected(date);
              const today = isToday(date);
              const disabled = isDateDisabled(date);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  disabled={disabled}
                  className={cn(
                    "aspect-square flex items-center justify-center",
                    "text-sm rounded-md transition-colors",
                    "hover:bg-primary/10 hover:text-primary",
                    !isCurrentMonth && "text-muted-foreground opacity-50",
                    today && "border border-primary",
                    selected && "bg-primary text-white hover:bg-primary hover:text-white",
                    disabled && "opacity-30 cursor-not-allowed hover:bg-transparent",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
