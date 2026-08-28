"use client";

import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { useCopyToClipboard } from "@/hooks";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Link2 } from "lucide-react";
import { getErrorMessage, showToast } from "@/lib";

interface ArticleShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cover?: string;
  link: string;
}

export function ArticleShareDialog({
  open,
  onOpenChange,
  cover,
  link,
}: ArticleShareDialogProps) {
  const t = useTranslations("articleShare");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, copyToClipboard] = useCopyToClipboard();

  useEffect(() => {
    if (open && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, link, { width: 220, margin: 2 }).catch(
        () => {},
      );
    }
  }, [open, link]);

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(link);
      showToast(t("copied"));
    } catch (error) {
      showToast(getErrorMessage(error, t("copyFailed")));
    }
  };

  const handleDownloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = "qrcode.png";
    anchor.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {cover ? (
            <div className="relative aspect-21/9 w-full overflow-hidden rounded-lg">
              <ImageWithFallback
                fill
                src={cover}
                alt={t("coverAlt")}
                className="object-cover"
              />
            </div>
          ) : null}
          <canvas
            ref={canvasRef}
            className="rounded-lg border border-border bg-white p-2"
          />
        </div>

        <div className="mt-2 overflow-hidden rounded-md border border-border px-3 py-2">
          <span className="block truncate text-center text-sm text-secondary">
            {link}
          </span>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCopyLink}>
            <Link2 className="size-4" />
            {t("copyLink")}
          </Button>
          <Button onClick={handleDownloadQr}>{t("downloadQr")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}