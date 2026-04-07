/**
 * 图片缩略图信息
 */
export interface ImageThumbnails {
  thumb: string;
  small: string;
  medium: string;
  large: string;
}

/**
 * 图片信息对象
 */
export interface ImageInfo {
  url: string;
  width: number;
  height: number;
  size: number;
  original: string;
  thumbnails: ImageThumbnails;
}

/**
 * 图片尺寸类型
 */
export type ImageSize = "thumb" | "small" | "medium" | "large" | "original";

/**
 * 根据容器宽度选择合适的图片尺寸
 * 注意：thumb 固定为 200px，其他尺寸使用常见响应式断点
 * @param width - 容器宽度（像素）
 * @returns 推荐的图片尺寸类型
 */
export function selectImageSizeByWidth(width: number): ImageSize {
  if (width <= 200) return "thumb";
  if (width <= 480) return "small";
  if (width <= 768) return "medium";
  if (width <= 1200) return "large";
  return "original";
}

/**
 * 根据设备像素比和容器宽度选择图片尺寸
 * 注意：thumb 固定为 200px，其他尺寸使用常见响应式断点
 * @param width - 容器宽度（像素）
 * @param dpr - 设备像素比（默认为1）
 * @returns 推荐的图片尺寸类型
 */
export function selectImageSizeForDisplay(
  width: number,
  dpr: number = window?.devicePixelRatio || 1,
): ImageSize {
  const adjustedWidth = width * dpr;

  if (adjustedWidth <= 300) return "thumb";
  if (adjustedWidth <= 720) return "small";
  if (adjustedWidth <= 1152) return "medium";
  if (adjustedWidth <= 1800) return "large";
  return "original";
}

/**
 * 获取图片URL，支持选择尺寸
 * @param image - 图片信息对象
 * @param size - 需要的图片尺寸
 * @returns 图片URL
 */
export function getImageUrl(
  image: ImageInfo | string,
  size: ImageSize = "original",
): string {
  // 不存在直接返回空
  if (!image) return "";
  // 如果是字符串（旧格式或兜底），直接返回
  if (typeof image === "string") {
    return image;
  }

  // 如果请求original或thumbnails不存在，返回原始URL
  if (size === "original" || !image.thumbnails) {
    return image.url;
  }

  // 返回对应尺寸的缩略图
  return image.thumbnails[size] || image.url;
}

/**
 * 处理图片数组，转换为URL数组（用于兼容旧组件）
 * @param images - 图片信息数组
 * @param size - 需要的图片尺寸
 * @returns URL字符串数组
 */
export function getImageUrls(
  images: (ImageInfo | string)[] | undefined,
  size: ImageSize = "original",
): string[] {
  if (!images || !Array.isArray(images)) return [];

  return images.map((img) => getImageUrl(img, size));
}

/**
 * 获取图片画廊用的URLs（小尺寸用于缩略图，大尺寸用于主图）
 * @param images - 图片信息数组
 * @returns 包含缩略图和原图URL的对象
 */
export function getImageGalleryUrls(
  images: (ImageInfo | string)[] | undefined,
): {
  thumbnails: string[];
  originals: string[];
} {
  if (!images || !Array.isArray(images)) {
    return { thumbnails: [], originals: [] };
  }

  return {
    thumbnails: images.map((img) => getImageUrl(img, "small")),
    originals: images.map((img) => getImageUrl(img, "original")),
  };
}

/**
 * 获取评论图片用的URLs（小尺寸）
 * @param images - 图片信息数组
 * @returns URL字符串数组
 */
export function getCommentImageUrls(
  images: (ImageInfo | string)[] | undefined,
): string[] {
  return getImageUrls(images, "small");
}

/**
 * 获取文章卡片预览用的URLs（中等尺寸）
 * @param images - 图片信息数组
 * @returns URL字符串数组
 */
export function getArticleCardImageUrls(
  images: (ImageInfo | string)[] | undefined,
): string[] {
  return getImageUrls(images, "medium");
}
