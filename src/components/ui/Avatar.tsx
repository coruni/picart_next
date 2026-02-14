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

const avatarFrameVariants = cva("absolute z-10 pointer-events-none", {
  variants: {
    size: {
      xs: "w-8 h-8 -left-1 -top-1",
      sm: "w-11 h-11 -left-1.5 -top-1.5",
      md: "w-14 h-14 -left-2 -top-2",
      lg: "w-16 h-16 -left-2 -top-2",
      xl: "w-22 h-22 -left-3 -top-3",
      "2xl": "w-28 h-28 -left-4 -top-4",
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
  bordered?: boolean;
};

export const Avatar = ({
  url,
  size,
  className,
  avatarFrame,
  bordered,
}: AvatarProps) => {
  return (
    <div className={cn("relative inline-flex justify-center items-center transition-all shrink-0", className)}>
      {/* Avatar container */}
      <div className={cn(avatarVariants({ size }), "relative shrink-0")}>
        <Image
          src={url || "/placeholder/avatar_placeholder.png"}
          alt="avatar"
          fill
          sizes="(max-width: 768px) 64px, 80px"
          className={cn(
            "rounded-full object-cover shrink-0",
            bordered && "border border-border",
          )}
        />
      </div>
      
      {/* Avatar frame overlay - larger than avatar, positioned outside */}
      {avatarFrame && (
        <div className={cn(avatarFrameVariants({ size }))}>
          <Image
            src={avatarFrame}
            alt="avatar frame"
            fill
            className="object-contain shrink-0"
          />
        </div>
      )}
    </div>
  );
};
