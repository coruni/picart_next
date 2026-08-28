"use client";

import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

interface ArticleShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cover?: string;
  link: string;
  title?: string;
  summary?: string;
}

// ─── 海报 canvas 导出辅助 ───────────────────────────────

// 计算 object-cover 裁剪区域（顶部对齐）
function coverCrop(imgW: number, imgH: number, boxW: number, boxH: number) {
  const scale = Math.max(boxW / imgW, boxH / imgH);
  const sw = boxW / scale;
  const sh = boxH / scale;
  const sx = (imgW - sw) / 2;
  return { sx, sy: 0, sw, sh };
}

// canvas 文本换行绘制，返回下一行 y
function fillWrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxLines: number,
  lineHeight: number,
) {
  let line = "";
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = ch;
      y += lineHeight;
      maxLines -= 1;
      if (maxLines <= 1) {
        while (
          ctx.measureText(line + "…").width > maxWidth &&
          line.length > 0
        ) {
          line = line.slice(0, -1);
        }
        ctx.fillText(line + "…", x, y);
        return y + lineHeight;
      }
    } else {
      line += ch;
    }
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}

function loadImage(
  src: string,
  crossOrigin?: string,
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// hex 颜色转 rgba（用于 canvas 渐变）
function hexToRgba(hex: string, alpha: number): string {
  let h = hex.trim().replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const num = parseInt(h, 16);
  if (Number.isNaN(num) || h.length !== 6) {
    return `rgba(255, 255, 255, ${alpha})`;
  }
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 跨域图片转同源代理 URL，避免 canvas 导出被 CORS 污染
function getCleanImageSrc(src: string): string {
  if (!src) return src;
  try {
    const url = new URL(src, window.location.origin);
    if (url.origin === window.location.origin) return url.href;
    return `/api/image-proxy?url=${encodeURIComponent(url.href)}`;
  } catch {
    return src;
  }
}

export function ArticleShareDialog({
  open,
  onOpenChange,
  cover,
  link,
  title,
  summary,
}: ArticleShareDialogProps) {
  const t = useTranslations("articleShare");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (open && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, link, { width: 80, margin: 2 }).catch(
        () => {},
      );
    }
  }, [open, link]);

  // 下载整张海报（canvas 绘制，无额外依赖）
  const handleDownloadPoster = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const W = 750;
      const H = 1000;
      const out = document.createElement("canvas");
      out.width = W;
      out.height = H;
      const ctx = out.getContext("2d");
      if (!ctx) return;

      // 读取主题色（跟随亮/暗模式，与 bg-card 等 class 一致）
      const cs = getComputedStyle(document.documentElement);
      const colorCard = cs.getPropertyValue("--color-card").trim() || "#ffffff";
      const colorFg =
        cs.getPropertyValue("--color-foreground").trim() || "#171717";
      const colorMuted =
        cs.getPropertyValue("--color-muted-foreground").trim() || "#6b7280";

      const pad = 36;
      const qrSize = 190;
      const qrX = W - pad - qrSize;
      const qrY = H - pad - qrSize;

      // 背景：有 cover 用 cover（顶部对齐裁剪）；加载失败则 card 色占位
      let hasCover = false;
      if (cover) {
        const img = await loadImage(getCleanImageSrc(cover));
        if (img && img.naturalWidth > 0) {
          const crop = coverCrop(img.naturalWidth, img.naturalHeight, W, H);
          ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, W, H);
          hasCover = true;
        }
      }
      if (!hasCover) {
        ctx.fillStyle = colorCard;
        ctx.fillRect(0, 0, W, H);
      }

      // 底部文案区：渐变遮罩，覆盖全图（与显示层一致）
      // 从底部 20% 实心 card → 中部 25% 透明 → 顶部全透明
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, hexToRgba(colorCard, 0));
      grad.addColorStop(0.5, hexToRgba(colorCard, 0.25));
      grad.addColorStop(0.8, colorCard);
      grad.addColorStop(1, colorCard);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const promoY = H - pad; // 引导语 baseline，底部对齐
      const titleText = title?.trim();
      const summaryText = summary?.trim();
      const titleAreaX = pad;
      const titleAreaMaxW = qrX - pad - 24;
      const fontFamily =
        '"MiSans", -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif';

      // 宣传内容：标题（最多 2 行）+ 摘要（最多 2 行）+ 引导语，位于二维码左上方
      if (titleText) {
        ctx.fillStyle = colorFg;
        ctx.font = `700 34px ${fontFamily}`;
        if (summaryText) {
          // 从底部反推各层 baseline：promo → summary → 标题
          const afterTitle = fillWrapText(
            ctx,
            titleText,
            titleAreaX,
            promoY - 10 - 26 * 2 - 10 - 46 * 2,
            titleAreaMaxW,
            2,
            46,
          );
          ctx.fillStyle = colorMuted;
          ctx.font = `400 18px ${fontFamily}`;
          const afterSummary = fillWrapText(
            ctx,
            summaryText,
            titleAreaX,
            afterTitle + 10,
            titleAreaMaxW,
            2,
            26,
          );
          ctx.font = `400 20px ${fontFamily}`;
          ctx.fillText(t("promo"), titleAreaX, afterSummary + 10);
        } else {
          const y = fillWrapText(
            ctx,
            titleText,
            titleAreaX,
            promoY - 46 * 2 - 40,
            titleAreaMaxW,
            2,
            46,
          );
          ctx.fillStyle = colorMuted;
          ctx.font = `400 22px ${fontFamily}`;
          ctx.fillText(t("promo"), titleAreaX, y + 40);
        }
      } else {
        ctx.fillStyle = colorMuted;
        ctx.font = `400 22px ${fontFamily}`;
        ctx.fillText(t("promo"), titleAreaX, promoY - 92);
      }

      // 二维码（右下角小型），白底提升扫码识别度
      const qrDataUrl = await QRCode.toDataURL(link, { width: 400, margin: 2 });
      const qrImg = await loadImage(qrDataUrl);
      if (qrImg) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      }

      const dataUrl = out.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `poster-${Date.now()}.png`;
      anchor.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-120 h-full max-w-sm flex-col overflow-hidden border-none px-0 pb-0 pt-0">
        {/* 海报 */}
        <div className="relative flex-1 overflow-hidden">
          {/* 背景层 */}
          {cover ? (
            <ImageWithFallback
              fill
              src={cover}
              alt={t("coverAlt")}
              className="object-top object-cover"
            />
          ) : (
            // 无 cover：card 色占位
            <div className="absolute inset-0 bg-card" />
          )}

          <div className="absolute inset-x-0 bottom-0 h-full bg-linear-to-t from-card from-20% via-card/25  to-transparent" />

          {/* 底部内容区 */}
          <div className="absolute inset-x-0 bottom-0">
            <div className="flex items-center justify-end px-4">
              <button
                className="flex items-center justify-center p-1"
                aria-label={t("downloadPoster")}
                title={t("downloadPoster")}
                onClick={handleDownloadPoster}
                disabled={downloading}
              >
                <Download size={16} />
              </button>
            </div>
            {/* <Button
              className="w-full"
              onClick={handleDownloadPoster}
              disabled={downloading}
            >
              <Download className="size-4" />
              {t("downloadPoster")}
            </Button> */}
            <div className="flex items-end justify-between gap-4 p-4">
              {/* 宣传内容：标题 + 引导语（二维码左上方） */}
              <div className="min-w-0 flex-1">
                {title && (
                  <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
                    {title}
                  </h3>
                )}
                {summary && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {summary}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("promo")}
                </p>
              </div>
              {/* 二维码（右下角小型） */}
              <canvas
                ref={canvasRef}
                className="h-12 w-12 shrink-0 rounded-md bg-white p-1.5"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
