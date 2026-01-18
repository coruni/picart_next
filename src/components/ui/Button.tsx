import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

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
            "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

        const variants = {
            default: "bg-primary/20 text-primary hover:bg-primary hover:text-white! focus:ring-primary/50",
            primary:
                "bg-primary text-white hover:bg-primary focus:ring-primary shadow-sm hover:shadow-md",
            secondary:
                "bg-secondary text-white hover:bg-secondary focus:ring-secondary-500 shadow-sm hover:shadow-md",
            outline:
                "border-2 border-primary text-primary hover:bg-primary hover:text-white  focus:ring-primary",
            ghost:
                "text-foreground hover:bg-muted focus:ring-muted",
            danger:
                "bg-error-500 text-white hover:bg-error-600 focus:ring-error-500 shadow-sm hover:shadow-md",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-4 h-7.5 text-sm",
            lg: "px-6 h-12 text-base",
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
                {loading ? (
                    <LoaderCircle className="animate-spin size-5" />
                ) : children}

            </button>
        );
    }
);

Button.displayName = "Button";

export { Button };