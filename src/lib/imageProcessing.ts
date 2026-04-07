"use client";

/**
 * 图片处理工具函数
 * 用于处理 EXIF 方向、预加载、尺寸计算等
 */

/**
 * EXIF 方向值
 * 1: 正常
 * 2: 水平翻转
 * 3: 旋转 180°
 * 4: 垂直翻转
 * 5: 顺时针 90° + 水平翻转
 * 6: 顺时针 90°
 * 7: 顺时针 270° + 水平翻转
 * 8: 顺时针 270°
 */
export type EXIFOrientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * 从 ArrayBuffer 中读取 EXIF 方向信息
 * @param buffer - 图片文件的 ArrayBuffer
 * @returns 方向值（默认为 1）
 */
export function getEXIFOrientation(buffer: ArrayBuffer): EXIFOrientation {
  const view = new DataView(buffer);

  // 检查是否为 JPEG
  if (view.getUint16(0, false) !== 0xFFD8) {
    return 1;
  }

  const length = view.byteLength;
  let offset = 2;

  while (offset < length) {
    if (view.getUint16(offset + 2, false) <= 8) return 1;

    const marker = view.getUint16(offset, false);
    offset += 2;

    // APP1 标记 (EXIF)
    if (marker === 0xFFE1) {
      // 检查 EXIF 标识
      if (view.getUint32(offset + 2, false) !== 0x45786966) {
        offset += 2 + view.getUint16(offset, false);
        continue;
      }

      // 检查字节序
      const little = view.getUint16(offset + 8, false) === 0x4949;
      offset += 10;

      // 获取 IFD 偏移
      const ifdOffset = view.getUint32(offset, little);
      offset += ifdOffset - 8;

      // 获取 IFD 条目数
      const entries = view.getUint16(offset, little);
      offset += 2;

      // 查找 Orientation 标签 (0x0112)
      for (let i = 0; i < entries; i++) {
        const tag = view.getUint16(offset + i * 12, little);
        if (tag === 0x0112) {
          return view.getUint16(offset + i * 12 + 8, little) as EXIFOrientation;
        }
      }

      return 1;
    } else if ((marker & 0xFF00) !== 0xFF00) {
      break;
    } else {
      offset += view.getUint16(offset, false);
    }
  }

  return 1;
}

/**
 * 根据 EXIF 方向计算变换参数
 */
export interface TransformParams {
  rotate: number;
  scaleX: number;
  scaleY: number;
}

export function getTransformForOrientation(orientation: EXIFOrientation): TransformParams {
  switch (orientation) {
    case 1:
      return { rotate: 0, scaleX: 1, scaleY: 1 };
    case 2:
      return { rotate: 0, scaleX: -1, scaleY: 1 };
    case 3:
      return { rotate: 180, scaleX: 1, scaleY: 1 };
    case 4:
      return { rotate: 0, scaleX: 1, scaleY: -1 };
    case 5:
      return { rotate: 90, scaleX: -1, scaleY: 1 };
    case 6:
      return { rotate: 90, scaleX: 1, scaleY: 1 };
    case 7:
      return { rotate: 270, scaleX: -1, scaleY: 1 };
    case 8:
      return { rotate: 270, scaleX: 1, scaleY: 1 };
    default:
      return { rotate: 0, scaleX: 1, scaleY: 1 };
  }
}

/**
 * 计算考虑方向后的图片尺寸
 */
export function getOrientedDimensions(
  width: number,
  height: number,
  orientation: EXIFOrientation,
): { width: number; height: number } {
  // 方向 5, 6, 7, 8 需要交换宽高
  if (orientation >= 5) {
    return { width: height, height: width };
  }
  return { width, height };
}

/**
 * 图片预加载工具
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 批量预加载图片
 */
export function preloadImages(srcs: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(srcs.map(preloadImage));
}

/**
 * 使用 Intersection Observer 的图片懒加载
 */
export function createLazyImageLoader(
  callback: (img: HTMLImageElement) => void,
  options?: IntersectionObserverInit,
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: "50px", // 提前 50px 开始加载
    threshold: 0.01,
    ...options,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        callback(img);
        observer.unobserve(img);
      }
    });
  }, defaultOptions);

  return observer;
}

/**
 * 计算图片缩略图尺寸（保持宽高比）
 */
export function calculateThumbnailDimensions(
  originalWidth: number,
  originalHeight: number,
  maxSize: number,
): { width: number; height: number } {
  const ratio = Math.min(maxSize / originalWidth, maxSize / originalHeight);

  if (ratio >= 1) {
    return { width: originalWidth, height: originalHeight };
  }

  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

/**
 * 生成低质量图片占位符（LQIP）
 * 用于渐进式加载
 */
export async function generateBlurHash(
  imageData: ImageData,
): Promise<string> {
  // 简化版 - 返回平均颜色作为 base64 数据 URI
  const { data, width, height } = imageData;
  let r = 0, g = 0, b = 0;
  const pixelCount = width * height;

  // 采样计算平均颜色
  const step = Math.max(1, Math.floor(Math.sqrt(pixelCount / 100))); // 最多采样约 100 个点

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
    }
  }

  const samples = Math.ceil(width / step) * Math.ceil(height / step);
  r = Math.round(r / samples);
  g = Math.round(g / samples);
  b = Math.round(b / samples);

  // 返回 base64 编码的 1x1 像素
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, 1, 1);

  return canvas.toDataURL("image/png");
}

/**
 * 检测浏览器是否支持 WebP
 */
export async function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = () => resolve(true);
    webP.onerror = () => resolve(false);
    webP.src =
      "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";
  });
}

/**
 * 检测浏览器是否支持 AVIF
 */
export async function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = () => resolve(true);
    avif.onerror = () => resolve(false);
    avif.src =
      "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=";
  });
}

/**
 * 获取最佳图片格式
 */
export async function getOptimalImageFormat(): Promise<"avif" | "webp" | "jpeg"> {
  if (await supportsAVIF()) return "avif";
  if (await supportsWebP()) return "webp";
  return "jpeg";
}

/**
 * 创建图片的 Object URL 并自动释放
 */
export function createObjectURL(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 安全释放 Object URL
 */
export function revokeObjectURL(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

/**
 * 将 File 转换为 base64（用于预览）
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 从 base64 获取文件大小（近似）
 */
export function getBase64FileSize(base64: string): number {
  const base64Length = base64.split(",")[1]?.length || 0;
  return Math.floor((base64Length * 3) / 4);
}

/**
 * 图片压缩选项
 */
export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  type?: "image/jpeg" | "image/webp" | "image/png";
  preserveOrientation?: boolean;
}

/**
 * 使用 Canvas 压缩图片（主线程版本，用于预览）
 */
export async function compressImageWithCanvas(
  file: File,
  options: ImageCompressionOptions = {},
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    type = "image/jpeg",
    preserveOrientation = true,
  } = options;

  // 读取文件
  const buffer = await file.arrayBuffer();
  const orientation = preserveOrientation ? getEXIFOrientation(buffer) : 1;

  // 创建图片
  const blob = new Blob([buffer], { type: file.type });
  const bitmap = await createImageBitmap(blob);

  // 计算尺寸
  let { width, height } = bitmap;

  // 应用 EXIF 方向
  if (orientation >= 5) {
    [width, height] = [height, width];
  }

  // 计算缩放
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  const finalWidth = Math.round(width * scale);
  const finalHeight = Math.round(height * scale);

  // 创建 canvas
  const canvas = document.createElement("canvas");
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext("2d", { alpha: type !== "image/jpeg" })!;

  // 设置高质量插值
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 应用变换
  ctx.save();

  const transform = getTransformForOrientation(orientation);
  ctx.translate(finalWidth / 2, finalHeight / 2);
  ctx.rotate((transform.rotate * Math.PI) / 180);
  ctx.scale(transform.scaleX, transform.scaleY);
  ctx.drawImage(bitmap, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);

  ctx.restore();
  bitmap.close();

  // 转换为 blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas to Blob failed"));
        }
      },
      type,
      quality,
    );
  });
}
