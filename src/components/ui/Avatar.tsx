import Image from "next/image";
import { cn } from "@/lib";

type AvatarProps = {
  url?: string;
  frameUrl?: string;

  /** 外层：决定头像本体大小 */
  className?: string;

  /** 头像图片样式 */
  avatarClassName?: string;

  /** 头像框样式 */
  frameClassName?: string;

  bordered?: boolean;
};

export function Avatar({
  url,
  frameUrl,
  className,
  avatarClassName,
  frameClassName,
  bordered,
}: AvatarProps) {
  return (
    <div
      className={cn("relative inline-flex items-center justify-center transition-all duration-300", className)}
    >
      {/* Avatar frame - OUTSIDE and larger */}
      {frameUrl && (
        <div
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-11",
            frameClassName,
          )}
          style={{
            width: "calc((100% - 2px) * 1.3)",
            height: "calc((100% - 2px) * 1.3)",
          }}
        >
          <Image
            src={frameUrl}
            alt="avatar frame"
            fill
            className="object-contain"
          />
        </div>
      )}

      {/* Avatar image - REAL content */}
      <div className="relative z-10 h-full w-full">
        <Image
          src={url || "/placeholder/avatar_placeholder.png"}
          alt="avatar"
          fill
          className={cn(
            "h-full w-full rounded-full object-cover",
            bordered && "border border-border",
            avatarClassName,
          )}
        />
      </div>
    </div>
  );
}
