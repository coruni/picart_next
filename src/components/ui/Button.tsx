import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
    loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = "default",
            size = "md",
            fullWidth = false,
            loading = false,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const baseStyles =
            "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

        const variants = {
            default: "bg-primary/20 text-primary hover:bg-primary hover:text-white! focus:ring-primary/50",
            primary:
                "bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm hover:shadow-md",
            secondary:
                "bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-sm hover:shadow-md",
            outline:
                "border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 focus:ring-primary-500",
            ghost:
                "text-foreground hover:bg-muted focus:ring-muted",
            danger:
                "bg-error-500 text-white hover:bg-error-600 focus:ring-error-500 shadow-sm hover:shadow-md",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-4 h-8 text-sm",
            lg: "px-6 py-3 text-base",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth && "w-full",
                    loading && "cursor-wait",
                    className
                )}
                disabled={disabled || loading}
                {...props}
            >
                {loading && (
                    <Circle />
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export { Button };