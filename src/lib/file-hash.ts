"use client";

/**
 * 计算文件的 SHA256 hash
 * 使用 Web Crypto API，与后端 crypto.createHash("sha256") 兼容
 */
export async function calculateFileHash(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * 批量计算文件的 SHA256 hash
 */
export async function calculateFileHashes(
  files: (File | Blob)[]
): Promise<string[]> {
  return Promise.all(files.map((file) => calculateFileHash(file)));
}

/**
 * 构建上传用的 metadata 字符串
 * @param files - 原始文件数组（压缩前）
 * @returns metadata JSON 字符串
 */
export async function buildUploadMetadata(
  files: (File | Blob)[]
): Promise<string> {
  const hashes = await calculateFileHashes(files);
  const metadata = files.map((file, index) => ({
    hash: hashes[index],
    name: file instanceof File ? file.name : "blob",
  }));
  return JSON.stringify(metadata);
}
