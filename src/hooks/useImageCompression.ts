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

interface WorkerMessage {
  type: "compressed" | "ready";
  id?: string;
  success?: boolean;
  result?: {
    file: ArrayBuffer;
    fileName: string;
    fileType: string;
    lastModified: number;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  };
  error?: string;
  ready?: boolean;
}

type CompressionTask = {
  id: string;
  file: File;
  resolve: (result: CompressedImageResult) => void;
  reject: (error: Error) => void;
};

/**
 * 图片压缩 Hook
 * 获取上传配置并使用 Web Worker 异步压缩图片
 */
export function useImageCompression() {
  const { token } = useUserStore();
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const configRef = useRef<UploadConfig | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const tasksRef = useRef<Map<string, CompressionTask>>(new Map());
  const taskIdCounter = useRef(0);

  // 初始化 Web Worker
  useEffect(() => {
    // 创建 Web Worker
    const workerCode = `
      self.onmessage = async (event) => {
        const { type, file, fileName, fileType, fileLastModified, config, id } = event.data;

        if (type === "compress") {
          try {
            const result = await compressImage(file, fileName, fileType, fileLastModified, config);
            self.postMessage({
              type: "compressed",
              id,
              success: true,
              result: {
                file: result.file,
                fileName: result.fileName,
                fileType: result.fileType,
                lastModified: result.lastModified,
                originalSize: result.originalSize,
                compressedSize: result.compressedSize,
                compressionRatio: result.compressionRatio,
              },
            });
          } catch (error) {
            self.postMessage({
              type: "compressed",
              id,
              success: false,
              error: error.message || "Unknown error",
            });
          }
        }
      };

      async function compressImage(arrayBuffer, fileName, fileType, fileLastModified, config) {
        const { maxWidth, quality, format } = config;

        const blob = new Blob([arrayBuffer], { type: fileType });
        const bitmap = await createImageBitmap(blob);

        let { width, height } = bitmap;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        const mimeType = format === "jpeg" ? "image/jpeg" : \`image/\${format}\`;
        const compressedBlob = await canvas.convertToBlob({
          type: mimeType,
          quality: quality / 100,
        });

        const compressedArrayBuffer = await compressedBlob.arrayBuffer();

        return {
          file: compressedArrayBuffer,
          fileName: fileName,
          fileType: mimeType,
          lastModified: fileLastModified,
          originalSize: arrayBuffer.byteLength,
          compressedSize: compressedBlob.size,
          compressionRatio: compressedBlob.size / arrayBuffer.byteLength,
        };
      }
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, id, success, result, error } = event.data;

      if (type === "compressed" && id) {
        const task = tasksRef.current.get(id);
        if (task) {
          if (success && result) {
            // Reconstruct File from ArrayBuffer
            const file = new File([result.file], result.fileName, {
              type: result.fileType,
              lastModified: result.lastModified,
            });
            task.resolve({
              file,
              originalSize: result.originalSize,
              compressedSize: result.compressedSize,
              compressionRatio: result.compressionRatio,
            });
          } else {
            task.reject(new Error(error || "Compression failed"));
          }
          tasksRef.current.delete(id);
        }
      }
    };

    worker.onerror = (error) => {
      console.error("Web Worker error:", error);
      // 清理所有待处理任务
      tasksRef.current.forEach((task) => {
        task.reject(new Error("Worker error"));
      });
      tasksRef.current.clear();
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      tasksRef.current.clear();
    };
  }, []);

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
   * 压缩单个图片（使用 Web Worker）
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

      // 如果不是图片，直接返回
      if (!file.type.startsWith("image/")) {
        return {
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
        };
      }

      const worker = workerRef.current;
      if (!worker) {
        // Worker 未初始化，返回原文件
        return {
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
        };
      }

      const taskId = `task-${++taskIdCounter.current}`;

      // Convert File to ArrayBuffer for transfer
      const fileArrayBuffer = await file.arrayBuffer();

      return new Promise<CompressedImageResult>((resolve, reject) => {
        tasksRef.current.set(taskId, {
          id: taskId,
          file,
          resolve,
          reject,
        });

        // Send compression task to Worker with transferable ArrayBuffer
        worker.postMessage(
          {
            type: "compress",
            file: fileArrayBuffer,
            fileName: file.name,
            fileType: file.type,
            fileLastModified: file.lastModified,
            config: compressionConfig,
            id: taskId,
          },
          [fileArrayBuffer], // Transfer ownership
        );
      });
    },
    [],
  );

  /**
   * 批量压缩图片（使用 Promise.all 并行处理）
   */
  const compressImages = useCallback(
    async (files: File[]): Promise<CompressedImageResult[]> => {
      // 使用 Promise.all 并行压缩所有图片
      const promises = files.map(async (file) => {
        try {
          return await compressImage(file);
        } catch (error) {
          console.error("Failed to compress image:", error);
          // 压缩失败返回原文件
          return {
            file,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 1,
          };
        }
      });

      return Promise.all(promises);
    },
    [compressImage],
  );

  /**
   * 检查文件是否符合限制
   */
  const validateFiles = useCallback(
    (files: File[], isCompressed: boolean = false): { valid: boolean; error?: string } => {
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
          const sizeType = isCompressed ? "压缩后" : "";
          return {
            valid: false,
            error: `${sizeType}文件大小不能超过 ${formatFileSize(limits.maxFileSize)}`,
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
