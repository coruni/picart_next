"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export const Select = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  disabled = false,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer",
          "px-3 py-2 text-sm text-left",
          "focus:outline-none focus:ring-primary focus:border-primary",
          "hover:border-primary transition-colors",
          "flex items-center justify-between",
          "bg-card",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span className={cn(!selectedOption && "text-gray-400")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-gray-500 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-20 w-full mt-1",
            "bg-card",
            "drop-shadow-lg",
            "rounded-lg ",
            "max-h-60 overflow-auto",
            "py-2",
          )}
        >
          {options.map((option) => (
            <div className="m-1">
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full px-2 py-2 text-sm text-left box-border rounded-lg cursor-pointer hover:text-primary",
                  "hover:bg-primary/20 dark:hover:bg-gray-700",
                  "flex items-center justify-between",
                  "transition-colors",
                  option.value === value && "text-primary",
                )}
              >
                <span>{option.label}</span>
                {/* {option.value === value && (
                  <Check className="size-4 text-primary" />
                )} */}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
