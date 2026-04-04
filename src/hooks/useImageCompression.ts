"use client";

import { uploadControllerGetUploadConfig } from "@/api";
import { useUserStore } from "@/stores";
import { useCallback, useEffect, useRef, useState } from "react";

export interface CompressionConfig {
  maxWidth: number;
  quality: number;
  format: string;
}

export interface UploadLimits {
  maxFileSize: number;
  maxFileCount: number;
}

export interface UploadConfig {
  compression: CompressionConfig;
  limits: UploadLimits;
  allowedMimeTypes: string[];
}

export interface CompressedImageResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * 图片压缩 Hook
 * 获取上传配置并压缩图片
 */
export function useImageCompression() {
  const { token } = useUserStore();
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const configRef = useRef<UploadConfig | null>(null);

  // 获取上传配置
  const fetchConfig = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await uploadControllerGetUploadConfig({});

      if (response.data?.data) {
        const uploadConfig = response.data.data;
        setConfig(uploadConfig);
        configRef.current = uploadConfig;
      }
    } catch (error) {
      console.error("Failed to fetch upload config:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 初始化时获取配置
  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  /**
   * 压缩单个图片
   */
  const compressImage = useCallback(
    async (
      file: File,
      customConfig?: CompressionConfig,
    ): Promise<CompressedImageResult> => {
      const compressionConfig = customConfig || configRef.current?.compression;

      if (!compressionConfig) {
        // 如果没有配置，直接返回原文件
        return {
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
        };
      }

      const { maxWidth, quality, format } = compressionConfig;

      // 读取图片
      const image = await createImageBitmap(file);

      // 计算新的尺寸
      let { width, height } = image;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // 创建 canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      // 绘制图片
      ctx.drawImage(image, 0, 0, width, height);

      // 转换为 blob
      const mimeType = format === "jpeg" ? "image/jpeg" : `image/${format}`;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), mimeType, quality / 100);
      });

      // 创建新文件
      const compressedFile = new File([blob], file.name, {
        type: mimeType,
        lastModified: file.lastModified,
      });

      // 关闭 image bitmap
      image.close();

      return {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: blob.size,
        compressionRatio: blob.size / file.size,
      };
    },
    [],
  );

  /**
   * 压缩多个图片
   */
  const compressImages = useCallback(
    async (files: File[]): Promise<CompressedImageResult[]> => {
      const results: CompressedImageResult[] = [];

      for (const file of files) {
        // 只压缩图片文件
        if (!file.type.startsWith("image/")) {
          results.push({
            file,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 1,
          });
          continue;
        }

        try {
          const result = await compressImage(file);
          results.push(result);
        } catch (error) {
          console.error("Failed to compress image:", error);
          // 压缩失败返回原文件
          results.push({
            file,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 1,
          });
        }
      }

      return results;
    },
    [compressImage],
  );

  /**
   * 检查文件是否符合限制
   */
  const validateFiles = useCallback(
    (files: File[]): { valid: boolean; error?: string } => {
      const limits = configRef.current?.limits;

      if (!limits) {
        return { valid: true };
      }

      // 检查文件数量
      if (files.length > limits.maxFileCount) {
        return {
          valid: false,
          error: `最多只能上传 ${limits.maxFileCount} 个文件`,
        };
      }

      // 检查每个文件大小
      for (const file of files) {
        if (file.size > limits.maxFileSize) {
          return {
            valid: false,
            error: `文件大小不能超过 ${formatFileSize(limits.maxFileSize)}`,
          };
        }
      }

      return { valid: true };
    },
    [],
  );

  return {
    config,
    loading,
    compressImage,
    compressImages,
    validateFiles,
    refreshConfig: fetchConfig,
  };
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
