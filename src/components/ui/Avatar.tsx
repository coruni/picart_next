import Image from "next/image";
import { cn } from "@/lib";

/**
 * 头像组件属性接口
 * @interface AvatarProps
 * 
 * @property {string} [url] - 头像图片 URL，未提供时使用默认占位图
 * @property {string} [frameUrl] - 头像框图片 URL
 * @property {string} [className] - 外层容器样式类名，控制头像整体大小
 * @property {string} [avatarClassName] - 头像图片样式类名
 * @property {string} [frameClassName] - 头像框样式类名
 * @property {boolean} [bordered] - 是否显示边框
 */
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

/**
 * 头像组件
 * @component
 * 
 * 显示用户头像，支持头像框装饰。头像框会自动放大 130% 显示在头像外围
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <Avatar url="/avatar.jpg" />
 * 
 * // 带边框
 * <Avatar url="/avatar.jpg" bordered />
 * 
 * // 带头像框
 * <Avatar 
 *   url="/avatar.jpg" 
 *   frameUrl="/frame.png"
 * />
 * 
 * // 自定义大小
 * <Avatar 
 *   url="/avatar.jpg" 
 *   className="size-20"
 * />
 * ```
 */
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
