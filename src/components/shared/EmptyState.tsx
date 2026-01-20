import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { ReactNode } from "react";

type EmptyStateProps = {
  /**
   * 空状态图片路径
   */
  imageSrc?: string;
  /**
   * 图片宽度
   */
  imageWidth?: number;
  /**
   * 图片高度
   */
  imageHeight?: number;
  /**
   * 提示文字
   */
  message?: string;
  /**
   * 按钮文字
   */
  buttonText?: string;
  /**
   * 按钮链接
   */
  buttonHref?: string;
  /**
   * 按钮点击事件（如果提供，则不使用 buttonHref）
   */
  onButtonClick?: () => void;
  /**
   * 是否显示按钮
   */
  showButton?: boolean;
  /**
   * 自定义按钮内容
   */
  customButton?: ReactNode;
  /**
   * 容器类名
   */
  className?: string;
};

export function EmptyState({
  imageSrc = "/placeholder/empty.png",
  imageWidth = 200,
  imageHeight = 150,
  message = "暂无内容",
  buttonText = "去登录",
  buttonHref = "/login",
  onButtonClick,
  showButton = true,
  customButton,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col pb-12 ${className}`}>
      {/* 空白占位图 */}
      <div className="flex items-center justify-center flex-col gap-2">
        <Image
          src={imageSrc}
          width={imageWidth}
          height={imageHeight}
          quality={95}
          alt="empty-state"
          loading="eager"
          style={{ height: imageHeight, width: imageWidth }}
          draggable={false}
          className="object-cover"
        />
        {message && (
          <span className="text-sm mb-2 text-secondary">{message}</span>
        )}
      </div>

      {/* 按钮区域 */}
      {showButton && (
        <div className="flex justify-center items-center">
          {customButton ? (
            customButton
          ) : onButtonClick ? (
            <Button
              variant="default"
              className="rounded-full"
              size="md"
              onClick={onButtonClick}
            >
              {buttonText}
            </Button>
          ) : (
            <Link href={buttonHref}>
              <Button variant="default" className="rounded-full" size="md">
                {buttonText}
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
