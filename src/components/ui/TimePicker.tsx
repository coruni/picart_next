"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * 时间选择器组件属性接口
 * @interface TimePickerProps
 *
 * @property {string} [value] - 当前选中的时间值 (HH:mm 格式)
 * @property {(value: string) => void} [onChange] - 时间变化回调
 * @property {string} [placeholder] - 占位文本
 * @property {string} [className] - 自定义样式类名
 * @property {boolean} [disabled] - 是否禁用
 * @property {boolean} [use12Hours] - 是否使用12小时制
 * @property {number} [minuteStep] - 分钟步长，默认为1
 */
export type TimePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  use12Hours?: boolean;
  minuteStep?: number;
};

/**
 * 时间选择器组件
 * @component
 *
 * 自定义时间选择器，支持24小时制和12小时制
 *
 * @example
 * ```tsx
 * const [time, setTime] = useState('');
 *
 * <TimePicker
 *   value={time}
 *   onChange={setTime}
 *   placeholder="选择时间"
 * />
 *
 * // 12小时制
 * <TimePicker
 *   value={time}
 *   onChange={setTime}
 *   use12Hours
 * />
 *
 * // 15分钟步长
 * <TimePicker
 *   value={time}
 *   onChange={setTime}
 *   minuteStep={15}
 * />
 * ```
 */
export const TimePicker = ({
  value,
  onChange,
  placeholder = "选择时间",
  className,
  disabled = false,
  use12Hours = false,
  minuteStep = 1,
}: TimePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const parsed = useMemo(() => {
    if (!value) return { hour: "", minute: "", period: "" };
    const [hourStr, minuteStr] = value.split(":");
    if (!hourStr || !minuteStr) return { hour: "", minute: "", period: "" };

    let hour = parseInt(hourStr, 10);
    const minute = minuteStr.slice(0, 2);
    let period = "";

    if (use12Hours) {
      period = hour >= 12 ? "PM" : "AM";
      hour = hour % 12 || 12;
    }

    return {
      hour: hour.toString().padStart(2, "0"),
      minute: minute,
      period: period,
    };
  }, [value, use12Hours]);

  // Generate hour options
  const hourOptions = useMemo(() => {
    const hours = use12Hours ? 12 : 24;
    return Array.from({ length: hours }, (_, i) => {
      const hour = i + (use12Hours ? 1 : 0);
      const value = hour.toString().padStart(2, "0");
      return { value, label: value };
    });
  }, [use12Hours]);

  // Generate minute options
  const minuteOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 60; i += minuteStep) {
      const value = i.toString().padStart(2, "0");
      options.push({ value, label: value });
    }
    return options;
  }, [minuteStep]);

  const periodOptions = [
    { value: "AM", label: "上午" },
    { value: "PM", label: "下午" },
  ];

  // Handle hour change
  const handleHourChange = (newHour: string) => {
    if (!onChange) return;

    let hour = parseInt(newHour, 10);
    const minute = parsed.minute || "00";

    if (use12Hours) {
      const period = parsed.period || "AM";
      if (period === "PM" && hour !== 12) {
        hour += 12;
      } else if (period === "AM" && hour === 12) {
        hour = 0;
      }
    }

    onChange(`${hour.toString().padStart(2, "0")}:${minute}`);
  };

  // Handle minute change
  const handleMinuteChange = (newMinute: string) => {
    if (!onChange) return;

    const hour = parsed.hour || "00";
    const minute = newMinute;

    if (use12Hours) {
      let hourNum = parseInt(hour, 10);
      const period = parsed.period || "AM";

      if (period === "PM" && hourNum !== 12) {
        hourNum += 12;
      } else if (period === "AM" && hourNum === 12) {
        hourNum = 0;
      }

      onChange(`${hourNum.toString().padStart(2, "0")}:${minute}`);
    } else {
      onChange(`${hour}:${minute}`);
    }
  };

  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    if (!onChange) return;

    const hour = parsed.hour || "12";
    const minute = parsed.minute || "00";

    let hourNum = parseInt(hour, 10);

    if (newPeriod === "PM" && hourNum !== 12) {
      hourNum += 12;
    } else if (newPeriod === "AM" && hourNum === 12) {
      hourNum = 0;
    }

    onChange(`${hourNum.toString().padStart(2, "0")}:${minute}`);
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
    if (use12Hours && parsed.period) {
      return `${parsed.hour}:${parsed.minute} ${parsed.period}`;
    }
    return value;
  }, [value, use12Hours, parsed]);

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
            "min-w-[200px]",
          )}
        >
          <div className="flex items-center gap-2">
            {/* Hour selector */}
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1 text-center">
                时
              </div>
              <div className="max-h-48 overflow-auto rounded-md border border-border/50">
                {hourOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleHourChange(option.value)}
                    className={cn(
                      "w-full px-3 py-2 text-sm text-center",
                      "hover:bg-primary/10 hover:text-primary",
                      "transition-colors",
                      option.value === parsed.hour &&
                        "bg-primary/10 text-primary font-medium",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Separator */}
            <span className="text-muted-foreground self-center mt-5">:</span>

            {/* Minute selector */}
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1 text-center">
                分
              </div>
              <div className="max-h-48 overflow-auto rounded-md border border-border/50">
                {minuteOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleMinuteChange(option.value)}
                    className={cn(
                      "w-full px-3 py-2 text-sm text-center",
                      "hover:bg-primary/10 hover:text-primary",
                      "transition-colors",
                      option.value === parsed.minute &&
                        "bg-primary/10 text-primary font-medium",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Period selector (12-hour mode) */}
            {use12Hours && (
              <div className="w-16">
                <div className="text-xs text-muted-foreground mb-1 text-center">
                  时段
                </div>
                <div className="rounded-md border border-border/50">
                  {periodOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handlePeriodChange(option.value)}
                      className={cn(
                        "w-full px-2 py-2 text-sm text-center",
                        "hover:bg-primary/10 hover:text-primary",
                        "transition-colors",
                        option.value === parsed.period &&
                          "bg-primary/10 text-primary font-medium",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
