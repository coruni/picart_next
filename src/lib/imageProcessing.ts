"use client";

/**
 * 判断源图片是否可能包含透明通道（PNG/WebP 均支持 alpha）
 */
function imageHasPossibleAlpha(file: File): boolean {
  return file.type === "image/png" || file.type === "image/webp";
}

/**
 * 获取裁剪导出的图片格式
 * @param file 源图文件
 * @param backendFormat 后端上传配置要求的压缩格式（imageProcessing.format），可选
 *
 * 规则：
 * - 后端要求 webp：一律输出 webp（webp 同时支持透明与不透明，且符合后端要求）
 * - 后端要求 jpeg：源图带透明时保持 png/webp 原格式（jpeg 不支持透明，会压黑），不透明则输出 jpeg
 * - 后端未指定 / auto：透明源图保持原格式，不透明源图输出 jpeg
 */
export function getCropExportType(file: File, backendFormat?: string): string {
  const hasAlpha = imageHasPossibleAlpha(file);
  const format = (backendFormat || "").toLowerCase();

  if (format === "webp") {
    return "image/webp";
  }

  if (format === "jpeg" || format === "jpg") {
    return hasAlpha ? file.type : "image/jpeg";
  }

  return hasAlpha ? file.type : "image/jpeg";
}
