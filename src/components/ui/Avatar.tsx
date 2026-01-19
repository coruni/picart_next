import { cn } from "@/lib";
import Image from "next/image";
import { cva, type VariantProps } from "class-variance-authority";

const avatarVariants = cva("relative inline-block", {
    variants: {
        size: {
            xs: "w-6 h-6",
            sm: "w-8 h-8",
            md: "w-10 h-10",
            lg: "w-12 h-12",
            xl: "w-16 h-16",
            "2xl": "w-20 h-20",
        },
    },
    defaultVariants: {
        size: "md",
    },
});

type AvatarProps = VariantProps<typeof avatarVariants> & {
    url: string | any | unknown;
    className?: string;
    avatarFrame?: string;
};

export const Avatar = ({
    url,
    size,
    className,
    avatarFrame
}: AvatarProps) => {
    return (
        <div className={cn(avatarVariants({ size }), "transition-all", className)}>
            {avatarFrame && (
                <Image
                    quality={95}
                    src={avatarFrame}
                    alt="avatar frame"
                    fill
                    sizes="(max-width: 768px) 64px, 80px"
                    className="absolute inset-0 z-10 pointer-events-none"
                />
            )}
            <Image
                src={url || "/placeholder/avatar_placeholder.png"}
                alt="avatar"
                fill
                sizes="(max-width: 768px) 64px, 80px"
                className="rounded-full object-cover"
            />
        </div>
    );
};