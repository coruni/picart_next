import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { ReactNode } from "react";
import { useTranslations } from "next-intl";

type EmptyStateProps = {
  imageSrc?: string;
  imageWidth?: number;
  imageHeight?: number;
  message?: string;
  buttonText?: string;
  buttonHref?: string;
  onButtonClick?: () => void;
  showButton?: boolean;
  customButton?: ReactNode;
  className?: string;
};

export function EmptyState({
  imageSrc = "/placeholder/empty.png",
  imageWidth = 200,
  imageHeight = 150,
  message,
  buttonText,
  buttonHref = "/login",
  onButtonClick,
  showButton = true,
  customButton,
  className = "",
}: EmptyStateProps) {
  const t = useTranslations("emptyState");
  const finalMessage = message ?? t("message");
  const finalButtonText = buttonText ?? t("buttonText");

  return (
    <div className={`flex flex-col pb-12 ${className}`}>
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
        {finalMessage && (
          <span className="text-sm mb-2 text-secondary">{finalMessage}</span>
        )}
      </div>

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
              {finalButtonText}
            </Button>
          ) : (
            <Link href={buttonHref}>
              <Button variant="default" className="rounded-full" size="md">
                {finalButtonText}
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
