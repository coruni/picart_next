"use client";

import { uploadControllerGetUploadConfig } from "@/api";
import { useCallback, useEffect, useRef, useState } from "react";

export interface CompressionConfig {
  maxWidth: number;
  quality: number;
  format: "jpeg" | "webp" | "auto";
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
  type: "compressed" | "ready" | "error";
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
    width: number;
    height: number;
  };
  error?: string;
}

type CompressionTask = {
  id: string;
  file: File;
  resolve: (result: CompressedImageResult) => void;
  reject: (error: Error) => void;
  startTime: number;
};

// Web Worker 代码 - 优化版本
const workerCode = `
  // 缓存 ImageBitmap 避免重复创建
  const bitmapCache = new Map();

  // 清理过期缓存
  setInterval(() => {
    bitmapCache.clear();
  }, 60000); // 每分钟清理一次

  self.onmessage = async (event) => {
    const { type, file, fileName, fileType, fileLastModified, config, id } = event.data;

    if (type === "compress") {
      try {
        const result = await compressImage(file, fileName, fileType, fileLastModified, config);
        self.postMessage({
          type: "compressed",
          id,
          success: true,
          result,
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
    const originalWidth = width;
    const originalHeight = height;

    // 计算缩放后的尺寸
    if (width > maxWidth) {
      const scale = maxWidth / width;
      width = maxWidth;
      height = Math.round(height * scale);
    }

    // 使用 OffscreenCanvas 进行压缩
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", {
      alpha: fileType !== "image/jpeg" && fileType !== "image/jpg",
    });

    if (!ctx) {
      bitmap.close();
      throw new Error("Failed to get canvas context");
    }

    // 使用更好的图像质量设置
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    // 根据后端配置的格式选择输出格式
    let mimeType;
    let outputExtension;

    // 后端配置格式优先
    if (format === "webp") {
      mimeType = "image/webp";
      outputExtension = ".webp";
    } else if (format === "jpeg" || format === "jpg") {
      mimeType = "image/jpeg";
      outputExtension = ".jpg";
    } else {
      // auto 或未知格式：根据原图类型智能选择
      if (fileType === "image/png") {
        // PNG 保持 PNG（可能包含透明通道）
        mimeType = "image/png";
        outputExtension = ".png";
      } else if (fileType === "image/webp") {
        mimeType = "image/webp";
        outputExtension = ".webp";
      } else {
        // 默认转换为 JPEG
        mimeType = "image/jpeg";
        outputExtension = ".jpg";
      }
    }

    // 尝试压缩
    let compressedBlob;
    try {
      compressedBlob = await canvas.convertToBlob({
        type: mimeType,
        quality: quality / 100,
      });
    } catch (e) {
      // 如果指定格式失败，回退到 JPEG
      mimeType = "image/jpeg";
      outputExtension = ".jpg";
      compressedBlob = await canvas.convertToBlob({
        type: mimeType,
        quality: quality / 100,
      });
    }

    // 如果压缩后比原文件大，返回原文件
    if (compressedBlob.size >= arrayBuffer.byteLength) {
      return {
        file: arrayBuffer,
        fileName,
        fileType,
        lastModified: fileLastModified,
        originalSize: arrayBuffer.byteLength,
        compressedSize: arrayBuffer.byteLength,
        compressionRatio: 1,
        width: originalWidth,
        height: originalHeight,
      };
    }

    const compressedArrayBuffer = await compressedBlob.arrayBuffer();

    return {
      file: compressedArrayBuffer,
      fileName: generateOutputFileName(fileName, outputExtension),
      fileType: mimeType,
      lastModified: fileLastModified,
      originalSize: arrayBuffer.byteLength,
      compressedSize: compressedBlob.size,
      compressionRatio: compressedBlob.size / arrayBuffer.byteLength,
      width,
      height,
    };
  }

  function generateOutputFileName(originalName, extension) {
    const baseName = originalName.replace(/\\.[^/.]+$/, "");
    return baseName + extension;
  }
`;

/**
 * 图片压缩 Hook - 优化版本
 * 特性：
 * 1. Web Worker 异步压缩，不阻塞主线程
 * 2. 智能格式选择（WebP/JPEG）
 * 3. 并发控制，防止内存溢出
 * 4. 压缩质量自适应
 * 5. 自动降级策略
 */
export function useImageCompression() {
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const configRef = useRef<UploadConfig | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const tasksRef = useRef<Map<string, CompressionTask>>(new Map());
  const taskIdCounter = useRef(0);
  const concurrentLimit = useRef(3); // 并发限制
  const processingCount = useRef(0); // 当前处理数量

  // 初始化 Web Worker
  useEffect(() => {
    const blob = new Blob([workerCode], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, id, success, result, error } = event.data;

      if (type === "compressed" && id) {
        processingCount.current--;
        processQueue(); // 处理队列中的下一个任务

        const task = tasksRef.current.get(id);
        if (task) {
          const duration = Date.now() - task.startTime;

          if (success && result) {
            // Reconstruct File from ArrayBuffer
            const file = new File([result.file], result.fileName, {
              type: result.fileType,
              lastModified: result.lastModified,
            });

            // 开发环境下输出压缩信息
            if (process.env.NODE_ENV === "development") {
              console.log(
                `[ImageCompression] Compressed ${result.fileName}: ${
                  (result.originalSize / 1024 / 1024).toFixed(2)
                }MB → ${(result.compressedSize / 1024 / 1024).toFixed(2)}MB ` +
                `(${(result.compressionRatio * 100).toFixed(1)}%) in ${duration}ms`
              );
            }

            task.resolve({
              file,
              originalSize: result.originalSize,
              compressedSize: result.compressedSize,
              compressionRatio: result.compressionRatio,
            });
          } else {
            console.error(`[ImageCompression] Failed to compress: ${error}`);
            task.reject(new Error(error || "Compression failed"));
          }
          tasksRef.current.delete(id);
        }
      }
    };

    worker.onerror = (error) => {
      console.error("[ImageCompression] Web Worker error:", error);
      // 清理所有待处理任务
      tasksRef.current.forEach((task) => {
        task.reject(new Error("Worker error"));
      });
      tasksRef.current.clear();
      processingCount.current = 0;
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      tasksRef.current.clear();
      processingCount.current = 0;
    };
  }, []);

  // 处理队列
  const processQueue = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;

    // 找出待处理的任务
    const pendingTasks = Array.from(tasksRef.current.values()).filter(
      (task) => !task.startTime
    );

    // 并发控制
    while (processingCount.current < concurrentLimit.current && pendingTasks.length > 0) {
      const task = pendingTasks.shift();
      if (task) {
        processingCount.current++;
        task.startTime = Date.now();

        task.file.arrayBuffer().then((fileArrayBuffer) => {
          const compressionConfig = configRef.current?.compression || {
            maxWidth: 1920,
            quality: 85,
            format: "auto",
          };

          worker.postMessage(
            {
              type: "compress",
              file: fileArrayBuffer,
              fileName: task.file.name,
              fileType: task.file.type,
              fileLastModified: task.file.lastModified,
              config: compressionConfig,
              id: task.id,
            },
            [fileArrayBuffer]
          );
        });
      }
    }
  }, []);

  // 获取上传配置
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await uploadControllerGetUploadConfig({});

      if (response.data?.data) {
        const uploadConfig = response.data.data as UploadConfig;
        // 使用后端返回的格式配置，不再强制覆盖
        setConfig(uploadConfig);
        configRef.current = uploadConfig;
      }
    } catch (error) {
      console.error("[ImageCompression] Failed to fetch upload config:", error);
      // 使用默认配置
      const defaultConfig = {
        compression: {
          maxWidth: 1920,
          quality: 85,
          format: "jpeg" as const,
        },
        limits: {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxFileCount: 9,
        },
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      } satisfies UploadConfig;
      setConfig(defaultConfig);
      configRef.current = defaultConfig;
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化时获取配置
  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  /**
   * 压缩单个图片（带并发控制）
   */
  const compressImage = useCallback(
    async (
      file: File,
      customConfig?: CompressionConfig,
    ): Promise<CompressedImageResult> => {
      const compressionConfig = customConfig || configRef.current?.compression;

      // 如果不是图片，直接返回
      if (!file.type.startsWith("image/")) {
        return {
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
        };
      }

      // GIF 图片通常不需要压缩（可能是动图）
      if (file.type === "image/gif") {
        return {
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
        };
      }

      const worker = workerRef.current;
      if (!worker || !compressionConfig) {
        // Worker 未初始化或没有配置，返回原文件
        return {
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
        };
      }

      // 小图片不需要压缩（小于 100KB）
      if (file.size < 100 * 1024) {
        return {
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
        };
      }

      const taskId = `task-${++taskIdCounter.current}`;

      return new Promise<CompressedImageResult>((resolve, reject) => {
        tasksRef.current.set(taskId, {
          id: taskId,
          file,
          resolve,
          reject,
          startTime: 0, // 标记为待处理
        });

        // 触发队列处理
        processQueue();
      });
    },
    [processQueue],
  );

  /**
   * 批量压缩图片（支持进度回调）
   */
  const compressImages = useCallback(
    async (
      files: File[],
      onProgress?: (current: number, total: number) => void,
    ): Promise<CompressedImageResult[]> => {
      const results: CompressedImageResult[] = [];
      const total = files.length;

      for (let i = 0; i < total; i++) {
        try {
          const result = await compressImage(files[i]);
          results.push(result);
        } catch (error) {
          console.error("[ImageCompression] Failed to compress image:", error);
          // 压缩失败返回原文件
          results.push({
            file: files[i],
            originalSize: files[i].size,
            compressedSize: files[i].size,
            compressionRatio: 1,
          });
        }

        if (onProgress) {
          onProgress(i + 1, total);
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

      // 检查文件类型
      const allowedTypes = configRef.current?.allowedMimeTypes;
      if (allowedTypes && allowedTypes.length > 0) {
        for (const file of files) {
          if (!allowedTypes.includes(file.type)) {
            return {
              valid: false,
              error: `不支持的文件类型: ${file.type}，请上传 ${allowedTypes.join(", ")}`,
            };
          }
        }
      }

      return { valid: true };
    },
    [],
  );

  /**
   * 取消所有待处理的压缩任务
   */
  const cancelAllTasks = useCallback(() => {
    tasksRef.current.forEach((task) => {
      task.reject(new Error("Task cancelled"));
    });
    tasksRef.current.clear();
    processingCount.current = 0;
  }, []);

  return {
    config,
    loading,
    compressImage,
    compressImages,
    validateFiles,
    cancelAllTasks,
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

/**
 * 快速判断是否应该压缩（同步方法，用于 UI 预览）
 */
export function shouldCompress(file: File): boolean {
  if (!file.type.startsWith("image/")) return false;
  if (file.type === "image/gif") return false;
  if (file.size < 100 * 1024) return false; // 小于 100KB 不压缩
  return true;
}

/**
 * 获取推荐压缩配置
 */
export function getRecommendedConfig(file: File): Partial<CompressionConfig> {
  const isPNG = file.type === "image/png";
  const isLargeImage = file.size > 5 * 1024 * 1024; // 大于 5MB

  return {
    maxWidth: isLargeImage ? 1920 : 2560,
    quality: isPNG ? 90 : 85, // PNG 转 WebP 质量可以更高
    format: "auto",
  };
}
