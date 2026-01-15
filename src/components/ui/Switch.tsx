"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
        return (
            <label
                className={cn(
                    "relative inline-flex items-center cursor-pointer",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
            >
                <input
                    ref={ref}
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onCheckedChange?.(e.target.checked)}
                    disabled={disabled}
                    {...props}
                />
                {/* 背景轨道 */}
                <div className="w-11 h-6 bg-[#c1ccd9] rounded-full peer dark:bg-gray-700 peer-checked:bg-primary relative transition-colors">
                    {/* 白色滑块 */}
                    <div className={cn(
                        "absolute top-[4px] w-4 h-4 shadow-md bg-white border border-gray-300 dark:border-gray-600 rounded-full transition-all duration-200",
                        checked ? "left-[22px]" : "left-[2px]"
                    )}>
                        {/* 眼睛 - 在白色滑块上 */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-[3px]">
                            <div className={cn(
                                "w-[3px] h-[3px] rounded-full transition-colors duration-200",
                                checked ? "bg-primary" : "bg-gray-400"
                            )}></div>
                            <div className={cn(
                                "w-[3px] h-[3px] rounded-full transition-colors duration-200",
                                checked ? "bg-primary" : "bg-gray-400"
                            )}></div>
                        </div>
                    </div>
                </div>
            </label>
        );
    }
);

Switch.displayName = "Switch";

export { Switch };
