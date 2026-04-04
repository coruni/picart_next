/**
 * 图片压缩 Web Worker
 * 在后台线程中处理图片压缩，避免阻塞主线程
 */

interface CompressionConfig {
  maxWidth: number;
  quality: number;
  format: string;
}

interface CompressMessage {
  type: "compress";
  file: File;
  config: CompressionConfig;
  id: string;
}

interface ReadyMessage {
  type: "ready";
}

// Web Worker 中的图片压缩逻辑
self.onmessage = async (event: MessageEvent<CompressMessage | ReadyMessage>) => {
  const { type } = event.data;

  if (type === "ready") {
    self.postMessage({ type: "ready", ready: true });
    return;
  }

  if (type === "compress") {
    const { file, config, id } = event.data as CompressMessage;

    try {
      const result = await compressImageInWorker(file, config);
      self.postMessage(
        {
          type: "compressed",
          id,
          success: true,
          result,
        },
        [result.file] // Transfer ownership of the file
      );
    } catch (error) {
      self.postMessage({
        type: "compressed",
        id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};

async function compressImageInWorker(
  file: File,
  config: CompressionConfig
): Promise<{
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}> {
  const { maxWidth, quality, format } = config;

  // 读取图片为 ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });
  const bitmap = await createImageBitmap(blob);

  // 计算新的尺寸
  let { width, height } = bitmap;
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  // 创建 OffscreenCanvas (Worker 中可用)
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // 绘制图片
  ctx.drawImage(bitmap, 0, 0, width, height);

  // 关闭 bitmap
  bitmap.close();

  // 转换为 blob
  const mimeType = format === "jpeg" ? "image/jpeg" : `image/${format}`;
  const compressedBlob = await canvas.convertToBlob({
    type: mimeType,
    quality: quality / 100,
  });

  // 创建新文件
  const compressedFile = new File([compressedBlob], file.name, {
    type: mimeType,
    lastModified: file.lastModified,
  });

  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedBlob.size,
    compressionRatio: compressedBlob.size / file.size,
  };
}

export {};
